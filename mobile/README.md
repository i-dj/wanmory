# Wanmory Mobile

The iOS and Android app for [Wanmory](../README.md). It signs in to a self-hosted Wanmory server and shows the photo timeline.

Built with Flutter (Dart), Riverpod for state, go_router for navigation and `cached_network_image` for thumbnails.

## What works so far

- Sign in with the server address, name and password
- Two-step verification: the 6-digit authenticator code, or a recovery code
- Sign-in kept on the device (iOS Keychain / Android Keystore), 90 days like "Keep me signed in" on the web
- Optional Face ID / Touch ID / fingerprint unlock, offered after the first sign-in and switchable in the account sheet; the app locks again after one minute in the background
- Library: photo and video counts, the featured carousel (the server's highlights) with "Play film" as a slideshow, a Year / Month / Day / All photos switch that stays pinned, a filter for photos, videos and favorites, and month sections titled with the cities in them
- Search by what is in a photo (the server's CLIP search)
- Albums and People tabs; tapping one opens its photos. Places is a placeholder for now
- Full-screen viewer with swipe and pinch-to-zoom
- Album sync (Settings): uploads the phone's photos and videos to the server, with synced / not synced counts, status and time left. Uploads are handed to the system (iOS background URLSession, Android WorkManager / user-initiated jobs), so they keep going with the app in the background or suspended; iOS relaunches the app in the background to deliver results, and the app then queues more. Swiping the app away in the app switcher cancels uploads (an OS rule); they resume on the next launch. Each photo is one tus "creation with upload" request to the server's existing `/api/uploads/`, so the server needs no changes
- Works with servers from before bearer support (v0.5.1 and older): the app then uses the session cookie the server sets

## Development

Requirements: Flutter 3.50 or newer, plus Xcode for iOS or Android Studio for Android.

```bash
cd mobile
flutter pub get
flutter run            # pick a simulator, emulator or connected phone
flutter analyze
flutter test
```

Start a server first (`make live` in the repo root runs one on port 8080). On a phone, use your computer's LAN address, for example `192.168.1.10:8080`. In the iOS Simulator, `localhost:8080` works.

## How the app talks to the server

The app uses the same JSON API as the web client. Sign-in sends `"bearer": true`, and the server then returns the session token in the response body. The app sends it on every request as `Authorization: Bearer <token>`, while the web client keeps using its HttpOnly cookie.

## Translations

UI text is written as the Chinese source string, as in the web client: `t('照片')`. `tool/i18n.mjs` collects every key used in `lib/`, takes the translations from `web/src/i18n/locales/` and the app-only strings in `i18n/<locale>.json`, and writes `assets/i18n/<locale>.json`. Run it after adding or changing UI text:

```bash
node tool/i18n.mjs          # regenerate, list missing translations
node tool/i18n.mjs check    # fail when something is missing
```

## Conventions

Comments, logs (`package:logging`, always English), commit messages and docs are in English.
