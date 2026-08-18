const fs = require('fs');
const path = require('path');

/**
 * Software Bill of Materials (SBOM) Generator for ValoRecon
 * 
 * Aggregates dependencies across contracts, server, cloud, web, and Rust/Tauri desktop
 * into a standard CycloneDX-compatible JSON specification.
 */

function generateSbom() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

  const packagesToScan = [
    { name: '@valorecon/contracts', path: path.join(rootDir, 'packages', 'contracts', 'package.json') },
    { name: 'valorecon-server', path: path.join(rootDir, 'server', 'package.json') },
    { name: '@valorecon/cloud', path: path.join(rootDir, 'packages', 'cloud', 'package.json') },
    { name: 'valorecon-web', path: path.join(rootDir, 'web', 'package.json') },
  ];

  const components = [];

  // Add primary application component
  components.push({
    type: 'application',
    name: 'valorecon',
    version: rootPkg.version || '1.0.0',
    description: 'ValoRecon Tactical AI Assistant & Match Intelligence Desktop Suite',
    licenses: [{ license: { id: 'UNLICENSED' } }]
  });

  // Scan NPM packages
  for (const pkgInfo of packagesToScan) {
    if (fs.existsSync(pkgInfo.path)) {
      const pkg = JSON.parse(fs.readFileSync(pkgInfo.path, 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const [depName, depVer] of Object.entries(deps)) {
        components.push({
          type: 'library',
          name: depName,
          version: depVer.replace(/[\^~]/g, ''),
          scope: pkgInfo.name,
          purl: `pkg:npm/${depName}@${depVer.replace(/[\^~]/g, '')}`
        });
      }
    }
  }

  // Scan Cargo dependencies if Cargo.lock exists
  const cargoLockPath = path.join(rootDir, 'src-tauri', 'Cargo.lock');
  if (fs.existsSync(cargoLockPath)) {
    const cargoLock = fs.readFileSync(cargoLockPath, 'utf8');
    const packageBlocks = cargoLock.split('[[package]]').slice(1);
    for (const block of packageBlocks) {
      const nameMatch = block.match(/name\s*=\s*"([^"]+)"/);
      const verMatch = block.match(/version\s*=\s*"([^"]+)"/);
      if (nameMatch && verMatch) {
        components.push({
          type: 'library',
          name: nameMatch[1],
          version: verMatch[1],
          scope: 'tauri/rust',
          purl: `pkg:cargo/${nameMatch[1]}@${verMatch[1]}`
        });
      }
    }
  }

  // Deduplicate components by name and version
  const uniqueMap = new Map();
  for (const comp of components) {
    const key = `${comp.name}@${comp.version}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, comp);
    }
  }

  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:valorecon-${Date.now()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        { vendor: 'ValoRecon Release Engine', name: 'sbom-generator', version: '1.0.0' }
      ],
      component: {
        type: 'application',
        name: 'valorecon',
        version: rootPkg.version || '1.0.0'
      }
    },
    components: Array.from(uniqueMap.values())
  };

  const sbomPath = path.join(distDir, 'sbom.json');
  fs.writeFileSync(sbomPath, JSON.stringify(sbom, null, 2), 'utf8');
  console.log(`[SBOM] Generated software bill of materials at: ${sbomPath} (${uniqueMap.size} components recorded)`);
  return sbomPath;
}

if (require.main === module) {
  generateSbom();
}

module.exports = { generateSbom };
