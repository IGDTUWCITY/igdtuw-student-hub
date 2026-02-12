import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SearchResult } from './serpapi.js';

// Full opportunity structure matching database schema
export interface FetchedOpportunity {
  title: string;
  organization: string;
  description: string;
  opportunity_type: 'internship' | 'scholarship' | 'hackathon' | 'competition' | 'workshop';
  deadline: string; // ISO date string (YYYY-MM-DDTHH:mm:ssZ)
  location: string;
  is_remote: boolean;
  stipend: string | null;
  required_skills: string[];
  apply_link: string | null;
  external_id: string; // unique identifier to avoid duplicates
}

/**
 * Clean and structure SerpAPI search results using Gemini
 * @param searchResults - Array of search results from SerpAPI
 * @param opportunityType - Type of opportunity
 * @returns Array of structured opportunities
 */
export async function cleanSearchResultsWithGemini(
  searchResults: SearchResult[],
  opportunityType: string
): Promise<FetchedOpportunity[]> {
  try {
    if (searchResults.length === 0) {
      console.warn('⚠️ No search results to clean');
      return [];
    }

    console.log(`🧹 Cleaning ${searchResults.length} search results with Gemini...`);

    // Initialize Gemini AI with API key (must be done here after dotenv.config() runs)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format search results for Gemini
    const resultsText = searchResults
      .map(
        (result, index) =>
          `${index + 1}. Title: ${result.title}\n   URL: ${result.link}\n   Snippet: ${result.snippet}`
      )
      .join('\n\n');

    const prompt = buildCleaningPrompt(resultsText, opportunityType);

    console.log('📝 Sending search results to Gemini for cleaning...');

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log('✅ Received cleaned response from Gemini');

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json?\s*/g, '').replace(/```\s*$/g, '');

    // Find JSON array in the response
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.warn('⚠️ Could not find JSON array in cleaned response');
      return [];
    }

    try {
      const opportunities: FetchedOpportunity[] = JSON.parse(jsonMatch[0]);
      console.log(`✅ Successfully parsed ${opportunities.length} opportunities from cleaned results`);
      return opportunities;
    } catch (parseError) {
      console.error('❌ Failed to parse cleaned JSON:', parseError);
      return [];
    }
  } catch (error) {
    console.error('❌ Error cleaning search results with Gemini:', error);
    return [];
  }
}

/**
 * Build prompt for Gemini to clean SerpAPI results
 */
function buildCleaningPrompt(resultsText: string, opportunityType: string): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `You are an expert at extracting and structuring opportunity data from search results.

I have these search results:
${resultsText}

Extract ALL valid opportunities from these search results and structure them as JSON.

TODAY'S DATE: ${today}

CRITICAL REQUIREMENTS:
- Extract opportunities from 2026 onwards ONLY
- REJECT any 2025 or earlier opportunities
- Deadlines: Extract from snippet if available, else use "Not specified"
- If deadline IS in snippet, make sure it's AFTER today (${today}) - reject expired
- Prioritize opportunities with real deadlines
- Include women-focused opportunities
- Include research conferences

IMPORTANT:
- Extract deadline from snippet text when visible
- If no deadline in snippet → use "Not specified" (this is OK)
- Only reject if date is clearly past/expired
- Include research conferences as "research_conference" type

REQUIRED FORMAT:
[
  {
    "title": "Opportunity Name",
    "organization": "Company/Organization Name",
    "description": "From snippet - real description",
    "opportunity_type": "internship|scholarship|hackathon|competition|workshop|research_conference",
    "deadline": "2026-03-15T23:59:59Z OR 'Not specified'",
    "location": "City/Online",
    "is_remote": true,
    "stipend": "Amount or 'Not specified'",
    "required_skills": ["skill1", "skill2", "skill3"],
    "apply_link": "URL from search result",
    "external_id": "unique-identifier"
  }
]

RULES:
- Return ONLY valid JSON array
- Extract UP TO 20 valid opportunities from all search results
- REJECT only if: year is 2025 or earlier, OR deadline is clearly past today
- Otherwise INCLUDE even if deadline is "Not specified"
- Never use null values
- For unknown values:
  - deadline: "Not specified"
  - stipend: "Not specified"
  - apply_link: "Not specified"
  - location: "Online"
  - is_remote: true or false ONLY (no strings)
  - required_skills: MUST be an array (use [] if unknown)
- Opportunity_type: internship, scholarship, hackathon, competition, workshop, or research_conference
- external_id format: company-type-date (e.g., cisco-internship-feb2026)
- Start with [ and end with ]
- No markdown, no explanations, just JSON`;
}
