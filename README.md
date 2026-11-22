# 🐕 Pat Pet 護理手帳 v1.3.0 · Android APK & 電腦同步專案

專為柴犬 **Pat Pet** 設計的護理記錄與倒數提醒程式，支援：
- 滴頸、杜蟲藥、美容、打針四大護理倒數與一頁總表
- Excel (`.xlsx` / `.csv`) 批次匯入匯出與 JSON 完整備份
- **GitHub Gist 私人自動同步**（手機 APK ↔ 桌上電腦）
- **固定簽章覆蓋升級 + 自動版本命名**（`PatPet-v1.3.0.apk`），以後升級新版直接按「更新」覆蓋，唔使解除安裝、資料唔會消失！

## 一、如何設定「直接覆蓋更新（唔使解除安裝）」？（只需做一次）

Android 允許直接覆蓋升級必須滿足三個條件：**相同 `appId`（已固定 `com.patpet.shibacare`）**、**遞增 `versionCode`（已自動由 GitHub Actions 遞增）**、以及**使用同一把簽章金鑰（Keystore）**。

1. **在電腦產生一把專屬簽章金鑰（只需執行一次）**
   - 在 Windows PowerShell / Mac 終端機執行：
     ```bash
     keytool -genkey -v -keystore patpet-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias patpet
     ```
   - 依指示設定一組密碼（請記低密碼，例如 `你的密碼`），姓名等資料隨便填即可。
2. **把金鑰轉成 Base64 文字**
   - **Windows PowerShell**：
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("patpet-release.jks")) | Set-Clipboard
     ```
   - **Mac / Linux**：
     ```bash
     base64 -i patpet-release.jks | pbcopy
     ```
3. **在 GitHub Repository 加入 4 個 Secrets**
   - 打開 GitHub 專案 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，新增以下 4 項：
     - `ANDROID_KEYSTORE_BASE64`：貼上剛才複製的 Base64 字串
     - `ANDROID_KEYSTORE_PASSWORD`：你設定的 Keystore 密碼
     - `ANDROID_KEY_ALIAS`：`patpet`
     - `ANDROID_KEY_PASSWORD`：同一個 Keystore 密碼
4. **注意**：如果你手機之前裝過無簽章的 `debug` 版，**只需解除安裝最後這一次**，改裝新編譯出來的 `PatPet-v1.3.0.apk`；以後每次更新（例如改 `package.json` 成 `"version": "1.4.0"` 再 Push）下載 `PatPet-v1.4.0.apk` 就能直接覆蓋更新！

## 二、以後點樣升級版本號？
只需修改 `package.json` 裡的 `"version": "1.3.0"` → 例如 `"1.4.0"` 並 Push 到 GitHub：
- App 畫面名稱、手機桌面名稱、APK 檔名（`PatPet-v1.4.0.apk`）同 Android `versionCode` 會全部自動同步更新！
