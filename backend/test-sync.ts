import dotenv from 'dotenv';
import { fetchOpportunitiesWithGemini } from './src/fetchers/gemini';

dotenv.config();

async function test() {
  console.log('🧪 Testing Gemini Opportunity Fetcher\n');
  const result = await fetchOpportunitiesWithGemini('internship');
  console.log(`\n✅ Result: ${result.length} opportunities fetched`);
}

test().catch(console.error);
