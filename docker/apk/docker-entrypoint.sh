#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e
echo "⚙️ Building Ionic app..."
ionic build

echo "🔄 Syncing with Capacitor Android..."
npx cap sync android

echo "🏗️ Building Android APK..."
cd "android"
./gradlew assembleDebug

echo "📦 Exporting APK..."

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
cd ..
mkdir -p "dist"
mv "android/app/build/outputs/apk/debug/app-debug.apk" "dist/app-debug-$TIMESTAMP.apk"
echo "✅ APK exported to dist/app-debug-$TIMESTAMP.apk"