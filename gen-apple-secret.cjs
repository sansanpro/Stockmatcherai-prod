/**
 * Generates the Apple client_secret JWT required by Supabase.
 * Run: node gen-apple-secret.js
 *
 * Prerequisites: npm install jsonwebtoken (one-time)
 * Then delete this file — never commit it to git.
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');

// ── Fill these in ────────────────────────────────────────────────────────────
const TEAM_ID    = '5T6YBPQX48';           // Your Apple Team ID
const KEY_ID     = 'H78GANXGU9';
const CLIENT_ID  = 'com.hassanomar.stockmatcherai';
const KEY_FILE   = `${require('os').homedir()}/Downloads/AuthKey_H78GANXGU9.p8`;
// ─────────────────────────────────────────────────────────────────────────────

const privateKey = fs.readFileSync(KEY_FILE, 'utf8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',          // Apple allows max 6 months
  audience: 'https://appleid.apple.com',
  issuer: TEAM_ID,
  subject: CLIENT_ID,
  keyid: KEY_ID,
});

console.log('\n✅ Apple client_secret JWT:\n');
console.log(token);
console.log('\nPaste this into Supabase → Authentication → Providers → Apple → Secret Key\n');
console.log('⚠️  This token expires in 180 days — regenerate it before it expires.\n');
