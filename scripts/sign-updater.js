const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Tauri Ed25519 Updater Signer & Verifier
 * 
 * Provides authentic cryptographic signing and verification for ValoRecon
 * release artifacts and update manifests.
 */

function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

function signArtifact(artifactBuffer, privateKeyPem) {
  // Ed25519 one-shot signature
  const signature = crypto.sign(null, artifactBuffer, privateKeyPem);
  return signature.toString('base64');
}

function verifyArtifact(artifactBuffer, signatureBase64, publicKeyPem) {
  try {
    const signature = Buffer.from(signatureBase64, 'base64');
    return crypto.verify(null, artifactBuffer, publicKeyPem, signature);
  } catch (err) {
    return false;
  }
}

function generateSignedManifest(options = {}) {
  const version = options.version || '1.0.0';
  const notes = options.notes || `ValoRecon v${version} - Tactical AI Assistant & VALORANT Match Intelligence`;
  const pubDate = new Date().toISOString();
  const artifactPath = options.artifactPath || path.resolve(__dirname, '..', 'src-tauri', 'target', 'release', 'valorecon.exe');
  
  const privateKeyPem = process.env.TAURI_PRIVATE_KEY || options.privateKeyPem;
  const publicKeyPem = process.env.TAURI_PUBLIC_KEY || options.publicKeyPem;

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Release artifact not found at: ${artifactPath}`);
  }

  const artifactBuffer = fs.readFileSync(artifactPath);
  const artifactSha256 = crypto.createHash('sha256').update(artifactBuffer).digest('hex');

  let signature = '';
  let effectivePublicKey = publicKeyPem;

  if (privateKeyPem) {
    signature = signArtifact(artifactBuffer, privateKeyPem);
    if (publicKeyPem) {
      const isValid = verifyArtifact(artifactBuffer, signature, publicKeyPem);
      if (!isValid) {
        throw new Error('Self-test signature verification failed: signature is invalid for the provided public key.');
      }
    }
  } else if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
    throw new Error('CRITICAL: TAURI_PRIVATE_KEY environment variable is required for production release signing. Empty signatures are prohibited.');
  } else {
    // Generate an ephemeral keypair for local verified staging build
    const ephemeral = generateKeyPair();
    signature = signArtifact(artifactBuffer, ephemeral.privateKey);
    effectivePublicKey = ephemeral.publicKey;
    const isValid = verifyArtifact(artifactBuffer, signature, effectivePublicKey);
    if (!isValid) {
      throw new Error('Ephemeral signature verification failed.');
    }
    console.log('[Updater Signer] Staging mode: Signed artifact with verified ephemeral Ed25519 keypair.');
  }

  const manifest = {
    version,
    notes,
    pub_date: pubDate,
    platforms: {
      'windows-x86_64': {
        signature,
        url: `https://github.com/parag8487/ValoRecon/releases/download/v${version}/ValoRecon_${version}_x64-setup.exe`,
        sha256: artifactSha256
      }
    }
  };

  const distDir = path.resolve(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const manifestPath = path.join(distDir, 'update.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[Updater Signer] Update manifest successfully generated at: ${manifestPath}`);
  console.log(`[Updater Signer] Artifact SHA256: ${artifactSha256}`);
  console.log(`[Updater Signer] Ed25519 Signature length: ${signature.length} chars (base64)`);

  return { manifest, manifestPath, artifactSha256, signature, publicKey: effectivePublicKey };
}

module.exports = {
  generateKeyPair,
  signArtifact,
  verifyArtifact,
  generateSignedManifest
};

if (require.main === module) {
  try {
    generateSignedManifest();
  } catch (err) {
    console.error('[Updater Signer] ERROR:', err.message);
    process.exit(1);
  }
}
