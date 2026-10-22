const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set via: $env:GITHUB_TOKEN="your_token"
if (!GITHUB_TOKEN) { console.error('❌ Set GITHUB_TOKEN env var first'); process.exit(1); }
const OWNER = 'arhamakhan798-code';
const REPO = 'My-Team-Data';
const BASE_DIR = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set(['node_modules', '.next', '.git', '.vscode', '.idea', 'out']);
const IGNORED_FILES = new Set(['.env', '.env.local', 'verify-result.txt', 'push-to-github.js']);

function shouldIgnore(relPath) {
  const parts = relPath.split(path.sep);
  for (const part of parts) {
    if (IGNORED_DIRS.has(part)) return true;
  }
  const basename = path.basename(relPath);
  if (IGNORED_FILES.has(basename)) return true;
  if (basename.startsWith('.env.')) return true;
  // Ignore any service account or client secret json files
  if (basename.endsWith('.json')) {
    const allowed = ['package.json', 'package-lock.json', 'tsconfig.json', 'vercel.json'];
    if (!allowed.includes(basename)) return true;
  }
  return false;
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(BASE_DIR, fullPath);
    if (shouldIgnore(relPath)) continue;

    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push({ fullPath, relPath: relPath.replace(/\\/g, '/') });
    }
  }
  return fileList;
}

async function githubRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Team-Directory-Deployer',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`GitHub API Error [${res.status}] ${method} ${endpoint}: ${json.message || text}`);
  }
  return json;
}

async function main() {
  console.log('🚀 Starting project upload to GitHub: ' + OWNER + '/' + REPO);

  // 1. Scan files to upload
  const files = getAllFiles(BASE_DIR);
  console.log(`📦 Found ${files.length} project files to upload (node_modules, .next, and secrets excluded).\n`);

  // 2. Upload blobs to GitHub
  const treeItems = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isBinary = /\.(ico|png|jpg|jpeg|webp|woff|woff2|ttf|eot)$/i.test(file.relPath);
    const content = fs.readFileSync(file.fullPath);

    const blobData = await githubRequest('/git/blobs', 'POST', {
      content: isBinary ? content.toString('base64') : content.toString('utf8'),
      encoding: isBinary ? 'base64' : 'utf-8',
    });

    treeItems.push({
      path: file.relPath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });

    process.stdout.write(`  [${i + 1}/${files.length}] Uploaded: ${file.relPath}\n`);
  }

  // 3. Create Tree
  console.log('\n🌲 Creating GitHub tree...');
  const treeData = await githubRequest('/git/trees', 'POST', {
    tree: treeItems,
  });
  console.log('✓ Tree created: ' + treeData.sha);

  // 4. Check if main branch exists
  let parentCommitSha = null;
  try {
    const refData = await githubRequest('/git/refs/heads/main');
    parentCommitSha = refData.object.sha;
    console.log('✓ Current main branch commit: ' + parentCommitSha);
  } catch (err) {
    console.log('ℹ️ Repository is empty. Creating initial commit on main.');
  }

  // 5. Create Commit
  console.log('📝 Creating commit...');
  const commitPayload = {
    message: 'Initial commit: Team Directory app with Google Sheets database & Google Drive OAuth photo storage',
    tree: treeData.sha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };
  const commitData = await githubRequest('/git/commits', 'POST', commitPayload);
  console.log('✓ Commit created: ' + commitData.sha);

  // 6. Update or Create ref
  if (parentCommitSha) {
    await githubRequest('/git/refs/heads/main', 'PATCH', {
      sha: commitData.sha,
      force: true,
    });
    console.log('✓ Updated refs/heads/main to commit: ' + commitData.sha);
  } else {
    await githubRequest('/git/refs', 'POST', {
      ref: 'refs/heads/main',
      sha: commitData.sha,
    });
    console.log('✓ Created refs/heads/main at commit: ' + commitData.sha);
  }

  console.log('\n🎉 ALL FILES SUCCESSFULLY PUSHED TO GITHUB!');
  console.log('🔗 Visit your repository: https://github.com/' + OWNER + '/' + REPO);
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message || err);
  process.exit(1);
});
