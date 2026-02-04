import axios from 'axios';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

/**
 * Search for opportunities using SerpAPI
 * @param query - Search query (e.g., "hackathons India 2025")
 * @returns Array of search results with title, link, and snippet
 */
export async function searchOpportunitiesWithSerpAPI(
  query: string
): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      console.error('❌ SERPAPI_KEY not found in environment variables');
      return [];
    }

    console.log(`🔍 Searching SerpAPI for: "${query}"`);

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: apiKey,
        engine: 'google',
        num: 15, // Get top 15 results
      },
    });

    const organicResults = response.data.organic_results || [];

    const searchResults: SearchResult[] = organicResults
      .slice(0, 10) // Take top 10 results
      .map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
      }));

    console.log(`✅ Found ${searchResults.length} results from SerpAPI`);

    return searchResults;
  } catch (error) {
    console.error('❌ Error calling SerpAPI:', error);
    return [];
  }
}

/**
 * Build search queries based on opportunity type
 */
export function buildSearchQueries(opportunityType: string): string[] {
  const baseQueries = {
    internship: [
      'internships India 2026 apply now',
      'summer internship India 2026 open',
      'tech internship India 2026 hiring',
      'software engineering internship India 2026',
      'women internship India 2026',
    ],
    scholarship: [
      'scholarships India 2026 apply',
      'tech scholarships India 2026 open',
      'engineering scholarship India 2026',
      'women scholarship India 2026 tech',
      'merit scholarship India 2026',
    ],
    hackathon: [
      'hackathon India 2026 upcoming',
      'coding hackathon India 2026',
      'hackathon 2026 India open registration',
      'women hackathon India 2026',
      'innovation hackathon India 2026',
    ],
    competition: [
      'coding competition India 2026 open',
      'programming contest India 2026',
      'competitive programming India 2026',
      'coding challenge India 2026',
      'women coding competition India 2026',
    ],
    workshop: [
      'tech workshop India 2026 open',
      'free coding workshop India 2026',
      'online workshop India 2026 technology',
      'training program India 2026 IT',
      'women tech workshop India 2026',
    ],
    mixed: [
      'internship linkedin india 2026 apply',
      'hackathon unstop india 2026',
      'scholarship india 2026 open applications',
      'women internship india 2026',
      'research conference india 2026 computer science',
      'tech opportunity india 2026 hiring',
    ],
  };

  return baseQueries[opportunityType as keyof typeof baseQueries] || baseQueries.mixed;
}
