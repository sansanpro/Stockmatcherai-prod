#!/usr/bin/env node
// Sends a question to the deployed stock-assistant as the test account and prints the streamed result.
// Usage: node scripts/test-chat.mjs "How is NVIDIA doing?"
// Needs .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) and .env.test.local (TEST_USER_EMAIL/PASSWORD).
import { readFileSync } from 'node:fs';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return env;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.test.local') };
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const question = process.argv[2] ?? 'How is NVIDIA doing?';

const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD }),
}).then(r => r.json());
if (!auth.access_token) throw new Error(`Sign-in failed: ${JSON.stringify(auth)}`);

const start = Date.now();
const elapsed = () => `${((Date.now() - start) / 1000).toFixed(1)}s`;
console.log(`Q: ${question}`);

const response = await fetch(`${url}/functions/v1/stock-assistant`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${auth.access_token}`, apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: question }),
});
if (!response.ok) {
  console.log(`[${elapsed()}] HTTP ${response.status}: ${await response.text()}`);
  process.exit(1);
}

let answer = '';
let firstText = null;
let error = null;
const decoder = new TextDecoder();
let buffer = '';
for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
    const event = JSON.parse(line.slice(6));
    if (event.type === 'content_delta') {
      firstText ??= elapsed();
      answer += event.delta;
    } else if (event.type === 'tool_call') {
      console.log(`[${elapsed()}] tool ${event.tool.name} ${JSON.stringify(event.tool.args)}`);
    } else if (event.type === 'error') {
      error = event.message;
    } else {
      console.log(`[${elapsed()}] ${event.type}`);
    }
  }
}

console.log(`[${elapsed()}] done - first text at ${firstText ?? 'never'}, ${answer.length} chars`);
if (error) console.log(`ERROR: ${error}`);
console.log(`\n${answer}`);
process.exit(error || !answer ? 1 : 0);
