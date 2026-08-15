# Ionic Plugin Lab

Personal playground for testing and implementing native **Capacitor** plugins with **Angular** and **Ionic**. Includes real-world, reusable examples for **Android** & **iOS** (Web is used only for local development, and iOS is verified to build via CI).

This project exists to demonstrate practical integration of native device capabilities in a hybrid mobile app — not just "hello world" wrappers, but working examples with a real CI/CD pipeline behind them.

## 📱 Download

The latest signed Android build is published automatically on every push to `main`:

**[⬇️ Download latest APK](https://github.com/diegodanielcaceres10/ionic-plugin-lab/releases/latest/download/app-release.apk)**

> Since it's not distributed through Google Play, Android will ask you to allow "install from unknown sources" the first time — this is expected for a demo/portfolio APK.

## 🛠️ Tech stack

- **Framework:** Ionic + Angular
- **Native runtime:** Capacitor
- **Targets:** Android, iOS, Web
- **CI/CD:** GitHub Actions
- **Distribution:** Firebase App Distribution (Android, invite-only testing) + GitHub Releases (public APK download)

## 🚀 Getting started locally

Everything runs through Docker Compose — no need to install Node, Ionic, or Android SDK on your machine just to try it out.

**Dev server (live reload, Web preview):**

```bash
docker compose up
```

The app will be available at `http://localhost:4002`.

**Build a debug APK locally (no signing, quick testing on a real device):**

```bash
docker compose --profile apk build apk
```

See [`dist/apk-debug-*.apk`](./dist/apk-debug-*.apk) for details on where the generated APK ends up.

> This Docker setup is meant for quick local development and debug builds. The signed release APK and the iOS Simulator build are handled entirely by the CI pipelines below — no local Android Studio or Xcode setup needed for those.

## 🔄 CI/CD pipelines

### Android — build, sign & distribute

On every push to `main`:

1. Builds the Ionic web app and syncs Capacitor
2. Builds and signs a release APK with Gradle
3. Distributes it to a Firebase App Distribution testers group
4. Publishes the same APK as a public GitHub Release

### iOS — build for Simulator

Triggered manually (`workflow_dispatch`):

1. Generates the `ios/` native platform if it doesn't exist yet (and commits it back to the repo)
2. Resolves Swift Package Manager dependencies
3. Builds an unsigned build for iOS Simulator
4. Uploads the `.app` bundle as a workflow artifact

> A full iOS distribution (installable `.ipa`, public TestFlight link) requires an Apple Developer Program membership (paid). Since the goal of this project is to demonstrate plugin integration — already fully covered on Android — iOS is kept at "verified to build" status rather than distributed.

## 📄 License

This project is for portfolio and demonstration purposes.
