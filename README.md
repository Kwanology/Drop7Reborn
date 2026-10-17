<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Drop 7 Reborn 🔴🟢🔵

An authentic, ad-free recreation of the classic numerical puzzle game Drop7 with custom color palette, soundtrack selector, and all classic game modes (Normal, Hardcore, Sequence). Optimized for Android and modern devices (e.g., Samsung Galaxy S26+).

---

## 🚀 Running Locally (Web)

**Prerequisites:** Node.js (v18+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Building the Android APK

The project is packaged with Capacitor and built with Android Gradle.

### One-Click Build:
Run either of the following commands in the project root:

```bash
npm run build:apk
```
*or directly execute:*
```cmd
build-apk.bat
```
*(PowerShell users can also run `./build-apk.ps1`)*

The script will:
1. Compile the web assets (`npm run build`)
2. Sync assets with native Android wrapper (`npx cap sync android`)
3. Compile the Android APK via Gradle (`gradlew assembleDebug`)
4. Copy the output APK directly to `Drop7Reborn.apk` in the project root.

### Generated APK Locations:
- **Root Directory:** `Drop7Reborn.apk`
- **Gradle Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🛠️ Project Structure

- `src/`: Game logic, audio engine, board storage, React components
- `public/`: Audio sound effects, soundtracks, icons
- `android/`: Native Android project configured with Capacitor
- `build-apk.bat` / `build-apk.ps1`: Automated APK build scripts

