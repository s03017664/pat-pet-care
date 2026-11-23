const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version || '1.4.1';
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
  // 1. Copy Cute Red Shiba Inu Android launcher icons
  const iconsSrc = 'android-icons';
  const resDir = path.join('android', 'app', 'src', 'main', 'res');
  if (fs.existsSync(iconsSrc)) {
    for (const folder of fs.readdirSync(iconsSrc)) {
      const srcDir = path.join(iconsSrc, folder);
      const dstDir = path.join(resDir, folder);
      if (fs.statSync(srcDir).isDirectory()) {
        fs.mkdirSync(dstDir, { recursive: true });
        for (const file of fs.readdirSync(srcDir)) {
          fs.copyFileSync(path.join(srcDir, file), path.join(dstDir, file));
        }
      }
    }
    // Set warm Shiba cream background for Android Adaptive Icon
    const bgColorXml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#F8E7CB</color>\n</resources>\n`;
    const valuesDir = path.join(resDir, 'values');
    fs.mkdirSync(valuesDir, { recursive: true });
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgColorXml);

    const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`;
    fs.mkdirSync(anydpiDir, { recursive: true });
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);
    console.log('[post] Installed Cute Red Shiba Inu Android launcher icons!');
  }

  // 2. Patch android/app/build.gradle for versionCode, versionName & release signing
  const gradlePath = path.join('android', 'app', 'build.gradle');
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);

  const hasKeystore = Boolean(process.env.HAS_RELEASE_KEYSTORE === 'true');
  if (hasKeystore && !gradle.includes('signingConfigs {')) {
    gradle = gradle.replace(
      /buildTypes\s*\{\s*release\s*\{/,
      [
        'signingConfigs {',
        '        release {',
        '            storeFile file("release-key.jks")',
        '            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")',
        '            keyAlias System.getenv("ANDROID_KEY_ALIAS")',
        '            keyPassword System.getenv("ANDROID_KEY_PASSWORD")',
        '        }',
        '    }',
        '    buildTypes {',
        '        release {',
        '            signingConfig signingConfigs.release'
      ].join('\n')
    );
    console.log('[post] Configured fixed Release Keystore signing (overwrite-update enabled!)');
  }

  fs.writeFileSync(gradlePath, gradle);
  console.log(`[post] Patched build.gradle -> versionName="${version}", versionCode=${versionCode}`);
}
