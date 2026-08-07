#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e

# ---- Configuration ----
ANDROID_DIR="android"
APK_SRC="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
DIST_DIR="dist"

# ---- Build web assets ----
echo "⚙️ Building Ionic app..."
ionic build

# ---- Sync web assets and plugins into the native Android project ----
echo "🔄 Syncing with Capacitor Android..."
npx cap sync android

# ---- Build the debug APK ----
echo "🏗️ Building Android APK..."
cd "$ANDROID_DIR"
./gradlew assembleDebug
cd ..

# ---- Export the APK with a timestamped filename ----
echo "📦 Exporting APK..."
if [ ! -f "$APK_SRC" ]; then
  echo "❌ APK not found at $APK_SRC"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
APK_DEST="$DIST_DIR/app-debug-$TIMESTAMP.apk"
mkdir -p "$DIST_DIR"
mv "$APK_SRC" "$APK_DEST"
echo "✅ APK exported to $APK_DEST"