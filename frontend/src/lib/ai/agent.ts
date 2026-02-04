import { supabase } from "@/integrations/supabase/client";

export type AIResponse = {
  content: string;
  sources?: any[];
};

// --- Helper Functions for Data Retrieval ---

async function fetchAllSocieties() {
  const { data, error } = await supabase
    .from("societies")
    .select("*")
    .limit(10);
  
  if (error) return [];
  return data || [];
}

async function searchSocieties(query: string) {
  // If the query is generic "societies" or "clubs", return all
  if (["societies", "society", "clubs", "club"].includes(query.toLowerCase().trim())) {
    return fetchAllSocieties();
  }

  const { data, error } = await supabase
    .from("societies")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(3);

  if (error) return [];
  return data || [];
}

async function fetchAllOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .limit(5)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data || [];
}

async function searchOpportunities(query: string) {
  // If generic, return latest
  if (["opportunities", "opportunity", "internships", "jobs", "hackathons"].includes(query.toLowerCase().trim())) {
    return fetchAllOpportunities();
  }

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,organization.ilike.%${query}%`)
    .limit(5);

  if (error) return [];
  return data || [];
}

async function fetchAllAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .limit(5)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

async function searchAnnouncements(query: string) {
  if (["announcements", "events", "news", "updates"].includes(query.toLowerCase().trim())) {
    return fetchAllAnnouncements();
  }

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(3);

  if (error) return [];
  return data || [];
}

// --- Main Query Processor ---

export async function processUserQuery(query: string): Promise<AIResponse> {
  const lowerQuery = query.toLowerCase().trim();

  // 1. Handle Greetings & Conversational Inputs
  const greetings = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"];
  if (greetings.some(g => lowerQuery === g || lowerQuery.startsWith(g + " "))) {
    return {
      content: "Hello! I'm your IGDTUW Student Hub Assistant. How can I help you today? You can ask me about societies, opportunities, or upcoming events!",
    };
  }
  
  if (lowerQuery.includes("who are you") || lowerQuery.includes("what can you do")) {
    return {
      content: "I am an AI assistant designed to help students of IGDTUW. I can provide information about campus societies, upcoming hackathons, internships, scholarships, and university announcements. Just ask!",
    };
  }

  // 2. Identify Intent & Fetch Data
  let context: any[] = [];

  // Keywords to trigger specific searches
  const societyKeywords = ["society", "societies", "club", "clubs", "technical", "cultural"];
  const oppKeywords = ["opportunity", "opportunities", "hackathon", "hackathons", "internship", "internships", "job", "scholarship"];
  const eventKeywords = ["event", "events", "announcement", "announcements", "workshop", "webinar"];

  const hasSocietyIntent = societyKeywords.some(k => lowerQuery.includes(k));
  const hasOppIntent = oppKeywords.some(k => lowerQuery.includes(k));
  const hasEventIntent = eventKeywords.some(k => lowerQuery.includes(k));

  if (hasSocietyIntent) {
    // Remove keywords and common stop words to find the actual search term
    const cleanQuery = query.replace(/societies|society|clubs|club|show|me|find|list|what|are|the|can|i|join/gi, "").trim();
    const effectiveQuery = cleanQuery.length < 2 ? "societies" : cleanQuery;
    const socs = await searchSocieties(effectiveQuery);
    context = [...context, ...socs.map(s => ({ ...s, type: 'society' }))];
  }

  if (hasOppIntent) {
    // Check for specific hackathon intent
    const isHackathon = query.toLowerCase().includes("hackathon");
    // Check for specific internship intent
    const isInternship = query.toLowerCase().includes("internship");
    
    if (isHackathon) {
      // Return top hackathons
      const { data } = await supabase
        .from("opportunities")
        .select("*")
        .eq("opportunity_type", "hackathon")
        .limit(5)
        .order('created_at', { ascending: false });
      
      const hackathons = data || [];
      context = [...context, ...hackathons.map(o => ({ ...o, type: 'opportunity' }))];
    } else if (isInternship) {
      // Return top internships
      const { data } = await supabase
        .from("opportunities")
        .select("*")
        .eq("opportunity_type", "internship")
        .limit(5)
        .order('created_at', { ascending: false });
      
      const internships = data || [];
      context = [...context, ...internships.map(o => ({ ...o, type: 'opportunity' }))];
    } else {
      const cleanQuery = query.replace(/opportunities|opportunity|internships|hackathons|internship|hackathon|show|me|find|list|what|are|the|there|any|upcoming/gi, "").trim();
      const effectiveQuery = cleanQuery.length < 2 ? "opportunities" : cleanQuery;
      const opps = await searchOpportunities(effectiveQuery);
      context = [...context, ...opps.map(o => ({ ...o, type: 'opportunity' }))];
    }
  }

  if (hasEventIntent) {
    const cleanQuery = query.replace(/announcements|events|announcement|event|show|me|find|list|what|are|the|latest|university|updates|news/gi, "").trim();
    const effectiveQuery = cleanQuery.length < 2 ? "announcements" : cleanQuery;
    const anns = await searchAnnouncements(effectiveQuery);
    context = [...context, ...anns.map(a => ({ ...a, type: 'announcement' }))];
  }

  // Fallback: If no specific intent detected, but query is substantial, search across all
  if (!hasSocietyIntent && !hasOppIntent && !hasEventIntent && query.length > 2) {
    const [opps, socs, anns] = await Promise.all([
      searchOpportunities(query),
      searchSocieties(query),
      searchAnnouncements(query)
    ]);
    context = [...opps.map(o => ({ ...o, type: 'opportunity' })), ...socs.map(s => ({ ...s, type: 'society' })), ...anns.map(a => ({ ...a, type: 'announcement' }))];
  }

  // 3. Generate Response
  if (context.length === 0) {
    return {
      content: "I searched the IGDTUW Student Hub but couldn't find any specific information matching your query. \n\n**Try asking about:**\n- Specific societies (e.g., 'ACM', 'IEEE')\n- 'Show me hackathons'\n- 'Latest announcements'\n- 'Internship opportunities'",
    };
  }

  // Format the response
  let responseText = `Here is what I found for "${query}":\n\n`;

  const opportunities = context.filter(c => c.type === 'opportunity');
  if (opportunities.length > 0) {
    responseText += "**Opportunities:**\n";
    opportunities.forEach(opp => {
      responseText += `- **${opp.title}** (${opp.opportunity_type}) at ${opp.organization || 'Various'}\n`;
      if (opp.apply_link) {
        responseText += `  [Apply Here](${opp.apply_link})\n`;
      }
    });
    responseText += "\nTo know more check out the [Opportunities](/opportunities) section.\n";
  }

  const societies = context.filter(c => c.type === 'society');
  if (societies.length > 0) {
    responseText += "**Societies & Clubs:**\n";
    societies.forEach(soc => {
      responseText += `- **${soc.name}**\n  ${soc.description ? soc.description.substring(0, 120) + '...' : 'No description available'}\n`;
    });
    responseText += "\nTo know more check out the [Campus Life](/campus) section.\n";
  }

  const announcements = context.filter(c => c.type === 'announcement');
  if (announcements.length > 0) {
    responseText += "**Announcements:**\n";
    announcements.forEach(ann => {
      responseText += `- **${ann.title}**\n  ${ann.content ? ann.content.substring(0, 100) + '...' : ''}\n`;
    });
  }

  return {
    content: responseText,
    sources: context
  };
}
