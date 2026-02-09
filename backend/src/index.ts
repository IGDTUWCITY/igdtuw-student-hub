import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cleanSearchResultsWithGemini } from './fetchers/gemini';
import { searchOpportunitiesWithSerpAPI, buildSearchQueries, SearchResult } from './fetchers/serpapi';
import { saveOpportunitiesToDatabase, cleanupExpiredOpportunities, getLastSyncTime } from './services/opportunityService';
import { recommendSocieties } from './services/recommendationService';
import { supabaseAdmin } from './services/supabase';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SYNC_INTERVAL_HOURS = 24;

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Backend is running ✅',
    timestamp: new Date().toISOString(),
  });
});

// Gemini API key check endpoint
app.get('/api/check-gemini', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY is missing in backend/.env',
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent('Reply with the single word: OK');
    const text = result.response.text().trim();

    return res.json({
      success: true,
      model: modelName,
      response: text,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

app.post('/api/add-society', async (req, res) => {
  try {
    const {
      userEmail,
      name,
      description,
      category,
      logo_url,
      instagram_url,
      linkedin_url,
    } = req.body || {};

    if (!userEmail || !name || !category) {
      return res.status(400).json({
        success: false,
        error: 'userEmail, name and category are required',
      });
    }

    const allowlist = new Set<string>([
      'chadhaaarohi@gmail.com',
    ].map((e) => e.toLowerCase()));
    if (!allowlist.has(String(userEmail).toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'Not allowed to add societies',
      });
    }

    const { error } = await supabaseAdmin
      .from('societies')
      .insert({
        name,
        description: description || null,
        category,
        logo_url: logo_url || null,
        instagram_url: instagram_url || null,
        linkedin_url: linkedin_url || null,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to add society',
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

app.post('/api/society-image-upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body || {};
    const ext = String(fileName || 'image.png').split('.').pop() || 'png';
    const path = `society-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext.toLowerCase()}`;
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === 'society-images');
    if (!exists) {
      await supabaseAdmin.storage.createBucket('society-images', { public: true });
    }
    const { data, error } = await supabaseAdmin.storage.from('society-images').createSignedUploadUrl(path);
    if (error || !data?.signedUrl) {
      return res.status(400).json({
        success: false,
        error: error?.message || 'Failed to create signed upload URL',
      });
    }
    const publicData = supabaseAdmin.storage.from('society-images').getPublicUrl(path);
    return res.json({
      success: true,
      signedUrl: data.signedUrl,
      path,
      publicUrl: publicData.data.publicUrl,
      contentType: contentType || 'application/octet-stream',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Society recommendations endpoint
app.post('/api/recommend-societies', async (req, res) => {
  try {
    const { userId, limit = 5 } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const recommendations = await recommendSocieties(userId, Number(limit) || 5);

    return res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Sync opportunities endpoint
app.post('/api/sync-opportunities', async (req, res) => {
  try {
    console.log('\n🔄 Starting opportunity sync...');
    
    // Get opportunity type from request body (default: 'mixed')
    const { type = 'mixed' } = req.body;
    
    // Validate type
    const validTypes = ['internship', 'scholarship', 'mixed', 'hackathon', 'competition', 'workshop', 'research_conference'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Step 1: Cleanup expired opportunities
    console.log('🗑️  Cleaning up expired opportunities...');
    const deletedCount = await cleanupExpiredOpportunities();

    // Step 2: Build search queries
    const queries = buildSearchQueries(type);
    console.log(`🔍 Built ${queries.length} search queries for type: ${type}`);

    // Step 3: Search with SerpAPI
    let allSearchResults: SearchResult[] = [];
    for (const query of queries) {
      const results = await searchOpportunitiesWithSerpAPI(query);
      allSearchResults = allSearchResults.concat(results);
    }

    if (allSearchResults.length === 0) {
      return res.json({
        success: true,
        message: 'No search results found',
        fetched: 0,
        saved: 0,
        skipped: 0,
        errors: 0,
        deletedExpired: deletedCount,
      });
    }

    // Step 4: Clean and structure with Gemini
    console.log(`🤖 Cleaning ${allSearchResults.length} search results with Gemini...`);
    const opportunities = await cleanSearchResultsWithGemini(allSearchResults, type);

    if (opportunities.length === 0) {
      return res.json({
        success: true,
        message: 'No opportunities structured from search results',
        fetched: 0,
        saved: 0,
        skipped: 0,
        errors: 0,
        deletedExpired: deletedCount,
      });
    }

    // Step 5: Save to database
    const result = await saveOpportunitiesToDatabase(opportunities);

    console.log('✅ Sync completed successfully!\n');

    // Return results
    res.json({
      success: true,
      message: 'Opportunities synced successfully',
      fetched: opportunities.length,
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
      deletedExpired: deletedCount,
    });
  } catch (error) {
    console.error('❌ Error syncing opportunities:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  
  // Initial sync on startup
  performScheduledSync();
});

/**
 * Auto-sync function that checks if 24 hours have passed
 * Only fetches from Gemini if it's been > 24 hours since last sync
 */
async function performScheduledSync() {
  try {
    console.log('\n⏰ Scheduled sync check...');
    
    // Get last sync time from database
    const lastSync = await getLastSyncTime();
    const now = new Date();
    
    if (lastSync) {
      const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      console.log(`📅 Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago`);
      
      // Only sync if > 24 hours have passed
      if (hoursSinceLastSync < SYNC_INTERVAL_HOURS) {
        console.log('⏭️  Skipping sync - less than 24 hours since last fetch');
        console.log(`⏳ Next sync in ${(SYNC_INTERVAL_HOURS - hoursSinceLastSync).toFixed(1)} hours\n`);
        return;
      }
    } else {
      console.log('🆕 First sync - no previous data found');
    }
    
    console.log('🔄 Starting scheduled opportunity sync...');
    
    // Cleanup expired opportunities
    await cleanupExpiredOpportunities();
    
    // Build search queries for mixed opportunities
    const queries = buildSearchQueries('mixed');
    
    // Search with SerpAPI
    let allSearchResults: SearchResult[] = [];
    for (const query of queries) {
      const results = await searchOpportunitiesWithSerpAPI(query);
      allSearchResults = allSearchResults.concat(results);
    }
    
    if (allSearchResults.length === 0) {
      console.log('⚠️  No search results found from SerpAPI\n');
      return;
    }
    
    // Clean and structure with Gemini
    const opportunities = await cleanSearchResultsWithGemini(allSearchResults, 'mixed');
    
    if (opportunities.length > 0) {
      const result = await saveOpportunitiesToDatabase(opportunities);
      console.log(`✅ Scheduled sync complete: ${result.saved} new opportunities added\n`);
    } else {
      console.log('⚠️  No opportunities structured from search results\n');
    }
  } catch (error) {
    console.error('❌ Error in scheduled sync:', error);
  }
}

// Schedule automatic sync every hour (but it will only run if 24h have passed)
cron.schedule('0 * * * *', () => {
  console.log('\n🔔 Cron job triggered');
  performScheduledSync();
});
