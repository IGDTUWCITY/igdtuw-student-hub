import { supabaseAdmin } from './supabase.js';

type SocietyRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  branch: string | null;
  year: string | null;
  interests: string[] | null;
  skills: string[] | null;
  bio: string | null;
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
  'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'as', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'it', 'its',
  'from', 'into', 'about', 'over', 'under', 'above', 'below', 'between', 'within',
  'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her',
]);

function normalizeText(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .match(/[a-z0-9]+/g);

  if (!tokens) return [];

  return tokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function buildProfileText(profile: ProfileRow): string {
  const interests = profile.interests?.join(' ') ?? '';
  const skills = profile.skills?.join(' ') ?? '';
  const branch = profile.branch ?? '';
  const year = profile.year ?? '';
  const bio = profile.bio ?? '';

  return [interests, skills, branch, year, bio].filter(Boolean).join(' ');
}

function buildSocietyText(society: SocietyRow): string {
  return [society.name, society.category ?? '', society.description ?? '']
    .filter(Boolean)
    .join(' ');
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length || 1;
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  for (const [token, count] of tf.entries()) {
    tf.set(token, count / total);
  }

  return tf;
}

function inverseDocumentFrequency(docTokens: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const totalDocs = docTokens.length || 1;

  for (const tokens of docTokens) {
    const unique = new Set(tokens);
    for (const token of unique) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, count] of df.entries()) {
    const value = Math.log((totalDocs + 1) / (count + 1)) + 1;
    idf.set(token, value);
  }

  return idf;
}

function tfidfVector(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const vector = new Map<string, number>();
  for (const [token, tfValue] of tf.entries()) {
    const idfValue = idf.get(token) || 0;
    vector.set(token, tfValue * idfValue);
  }
  return vector;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const value of a.values()) {
    normA += value * value;
  }
  for (const value of b.values()) {
    normB += value * value;
  }

  for (const [token, value] of a.entries()) {
    const other = b.get(token);
    if (other !== undefined) {
      dot += value * other;
    }
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function recommendSocieties(userId: string, limit = 5) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, branch, year, interests, skills, bio')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'Profile not found');
  }

  const { data: societies, error: societiesError } = await supabaseAdmin
    .from('societies')
    .select('id, name, description, category');

  if (societiesError || !societies) {
    throw new Error(societiesError?.message || 'No societies found');
  }

  const profileText = buildProfileText(profile as ProfileRow);
  const societyTexts = societies.map((society) => buildSocietyText(society));

  const profileTokens = normalizeText(profileText);
  const societyTokensList = societyTexts.map((text) => normalizeText(text));

  const idf = inverseDocumentFrequency([profileTokens, ...societyTokensList]);
  const profileVector = tfidfVector(termFrequency(profileTokens), idf);

  const scored = societies.map((society, index) => {
    const societyVector = tfidfVector(
      termFrequency(societyTokensList[index]),
      idf
    );
    const score = cosineSimilarity(profileVector, societyVector);
    return {
      ...society,
      score,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
