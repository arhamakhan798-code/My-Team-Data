// Token check utility - token is passed via environment variable
// Usage: GITHUB_TOKEN=your_token node scripts/check-token.js
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('❌ Please set GITHUB_TOKEN environment variable');
  process.exit(1);
}
fetch('https://api.github.com/user', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Node-Test',
  }
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Headers oauth-scopes:', r.headers.get('x-oauth-scopes'));
  console.log('Body:', await r.text());
}).catch(console.error);
