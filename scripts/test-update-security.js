const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateKeyPair, signArtifact, verifyArtifact } = require('./sign-updater');

/**
 * Update Security & Tampering Resistance Test Suite
 * 
 * Verifies that:
 * 1. Valid signed update packages pass cryptographic verification.
 * 2. Any byte modification to the update binary triggers immediate rejection.
 * 3. An attacker with a different Ed25519 key cannot forge a valid update.
 * 4. Empty or malformed signature strings are rejected.
 */

function runUpdateSecurityTests() {
  console.log('=== VALORECON UPDATE SECURITY VERIFICATION SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✖ [FAIL] ${testName}`);
    }
  }

  // Generate Authoritative Release Keypair
  const officialKeypair = generateKeyPair();
  const attackerKeypair = generateKeyPair();

  // Genuine release payload
  const genuinePayload = Buffer.from('VALORECON_PRODUCTION_RELEASE_BINARY_v1.0.0_VALID_PAYLOAD_PE64');
  const genuineSignature = signArtifact(genuinePayload, officialKeypair.privateKey);

  // TEST 1: Genuine artifact with genuine signature & public key
  const test1 = verifyArtifact(genuinePayload, genuineSignature, officialKeypair.publicKey);
  assert(test1 === true, 'Genuine artifact with authentic signature passes verification');

  // TEST 2: Tampered artifact (1-bit modification)
  const tamperedPayload = Buffer.from(genuinePayload);
  tamperedPayload[0] ^= 0xFF; // flip bits of first byte
  const test2 = verifyArtifact(tamperedPayload, genuineSignature, officialKeypair.publicKey);
  assert(test2 === false, 'Tampered binary payload is strictly rejected');

  // TEST 3: Attacker forged signature with distinct key
  const forgedSignature = signArtifact(genuinePayload, attackerKeypair.privateKey);
  const test3 = verifyArtifact(genuinePayload, forgedSignature, officialKeypair.publicKey);
  assert(test3 === false, 'Forged signature from unauthorized keypair is strictly rejected');

  // TEST 4: Empty signature string
  const test4 = verifyArtifact(genuinePayload, '', officialKeypair.publicKey);
  assert(test4 === false, 'Empty signature string is strictly rejected');

  // TEST 5: Corrupted base64 signature
  const corruptedSignature = genuineSignature.substring(0, genuineSignature.length - 4) + 'AAAA';
  const test5 = verifyArtifact(genuinePayload, corruptedSignature, officialKeypair.publicKey);
  assert(test5 === false, 'Corrupted signature string is strictly rejected');

  // TEST 6: Real release binary verification test
  const releaseBinaryPath = path.resolve(__dirname, '..', 'src-tauri', 'target', 'release', 'valorecon.exe');
  if (fs.existsSync(releaseBinaryPath)) {
    const realBinary = fs.readFileSync(releaseBinaryPath);
    const realSig = signArtifact(realBinary, officialKeypair.privateKey);
    const realValid = verifyArtifact(realBinary, realSig, officialKeypair.publicKey);
    assert(realValid === true, `Real compiled binary (${(realBinary.length / 1024 / 1024).toFixed(2)} MB) signed and verified successfully`);

    // Tamper real binary
    const tamperedReal = Buffer.from(realBinary);
    tamperedReal[tamperedReal.length - 1] ^= 0x01;
    const realTamperValid = verifyArtifact(tamperedReal, realSig, officialKeypair.publicKey);
    assert(realTamperValid === false, 'Tampered real binary payload is strictly rejected');
  }

  console.log(`\nUpdate Security Test Results: ${passed}/${total} passed (${((passed/total)*100).toFixed(0)}%)\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runUpdateSecurityTests();
}

module.exports = { runUpdateSecurityTests };
