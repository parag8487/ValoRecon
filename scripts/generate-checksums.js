const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeFileSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function generateChecksums() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const nsisSource = path.join(rootDir, 'src-tauri', 'target', 'release', 'bundle', 'nsis', 'ValoRecon_1.0.0_x64-setup.exe');
  const nsisDest = path.join(distDir, 'ValoRecon_1.0.0_x64-setup.exe');
  if (fs.existsSync(nsisSource)) {
    fs.copyFileSync(nsisSource, nsisDest);
  }

  const candidatePaths = [
    { name: 'ValoRecon_1.0.0_x64-setup.exe', path: nsisDest },
    { name: 'valorecon.exe', path: path.join(rootDir, 'src-tauri', 'target', 'release', 'valorecon.exe') },
    { name: 'update.json', path: path.join(distDir, 'update.json') },
    { name: 'sbom.json', path: path.join(distDir, 'sbom.json') },
  ];

  // Scan dist directory for installers or bundle archives
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    for (const f of files) {
      if (f.endsWith('.exe') || f.endsWith('.msi') || f.endsWith('.zip') || f.endsWith('.tar.gz')) {
        candidatePaths.push({ name: f, path: path.join(distDir, f) });
      }
    }
  }

  const checksumEntries = [];

  for (const item of candidatePaths) {
    if (fs.existsSync(item.path)) {
      const sha = computeFileSha256(item.path);
      const stat = fs.statSync(item.path);
      checksumEntries.push(`${sha}  ${item.name}  (${stat.size} bytes)`);
      console.log(`[SHA256] ${sha}  ${item.name}`);
    }
  }

  const outputFile = path.join(distDir, 'SHA256SUMS.txt');
  fs.writeFileSync(outputFile, checksumEntries.join('\n') + '\n', 'utf8');
  console.log(`\nChecksums written to: ${outputFile}`);
}

if (require.main === module) {
  generateChecksums();
}

module.exports = { generateChecksums };
