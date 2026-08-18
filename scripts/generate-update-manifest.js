const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeSha256(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function generateManifest() {
  const version = '1.0.0';
  const notes = 'ValoRecon v1.0.0 - Tactical AI Assistant & Privacy-First VALORANT Coach';
  const pubDate = new Date().toISOString();

  const manifest = {
    version,
    notes,
    pub_date: pubDate,
    platforms: {
      'windows-x86_64': {
        signature: '',
        url: `https://github.com/parag8487/ValoRecon/releases/download/v${version}/ValoRecon_${version}_x64-setup.exe`
      }
    }
  };

  const outDir = path.resolve(__dirname, '..', 'dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const manifestPath = path.join(outDir, 'update.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Update manifest generated at ${manifestPath}`);
}

generateManifest();
