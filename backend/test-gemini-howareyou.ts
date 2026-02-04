import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in backend/.env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function main() {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent('can u tell the the top 2 hackathons in india for computer science students, also reply in the format of a json array with each object having name, deadline and link as keys');
  const text = result.response.text().trim();
  console.log(`Model: ${modelName}`);
  console.log('Response:', text);
}

main().catch((error) => {
  console.error('Gemini error:', error?.message || error);
  process.exit(1);
});
