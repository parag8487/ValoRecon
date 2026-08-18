const { generateSignedManifest } = require('./sign-updater');

/**
 * Production Update Manifest Generator
 * Generates and cryptographically signs update.json with Ed25519 signature.
 */

try {
  const result = generateSignedManifest();
  console.log('Update manifest generated and cryptographically verified.');
} catch (err) {
  console.error('Failed to generate update manifest:', err.message);
  process.exit(1);
}
