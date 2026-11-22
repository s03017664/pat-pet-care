const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version || '1.3.0';
const runNumber = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
const versionCode = 100 + (isNaN(runNumber) ? 1 : runNumber);
const mode = process.argv[2] || 'pre';

if (mode === 'pre') {
  const capPath = 'capacitor.config.json';
  const cap = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  cap.appName = `Pat Pet 護理手帳 v${version}`;
  fs.writeFileSync(capPath, JSON.stringify(cap, null, 2));

  const htmlPath = path.join('www', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/const APP_VERSION = '[^']+';/, `const APP_VERSION = '${version}';`);
  html = html.replace(/<title>Pat Pet 護理手帳 v[^<]*<\/title>/, `<title>Pat Pet 護理手帳 v${version} · Shiba Care</title>`);
  fs.writeFileSync(htmlPath, html);

  const manifestPath = path.join('www', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const mf = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    mf.name = `Pat Pet 護理手帳 v${version}`;
    mf.short_name = `Pat Pet v${version}`;
    fs.writeFileSync(manifestPath, JSON.stringify(mf, null, 2));
  }
  console.log(`[pre] Synced version v${version} (versionCode ${versionCode})`);
}

if (mode === 'post') {
  const gradlePath = path.join('android', 'app', 'build.gradle');
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);

  const hasKeystore = Boolean(process.env.HAS_RELEASE_KEYSTORE === 'true');
  if (hasKeystore) {
    const signingBlock = [
      '    signingConfigs {',
      '        release {',
      '            storeFile file("release-key.jks")',
      '            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")',
      '            keyAlias System.getenv("ANDROID_KEY_ALIAS")',
      '            keyPassword System.getenv("ANDROID_KEY_PASSWORD")',
      '        }',
      '    }',
      '    buildTypes {'
    ].join('\n');

    if (!gradle.includes('signingConfigs {')) {
      gradle = gradle.replace('buildTypes {', signingBlock);
    }
    gradle = gradle.replace(
      /release\s*\{/,
      'release {\n            signingConfig signingConfigs.release'
    );
    console.log('[post] Configured fixed Release Keystore signing (overwrite-update enabled!)');
  } else {
    console.log('[post] No ANDROID_KEYSTORE_BASE64 secret detected; will build Debug APK.');
  }

  fs.writeFileSync(gradlePath, gradle);
  console.log(`[post] Patched build.gradle -> versionName="${version}", versionCode=${versionCode}`);
}
