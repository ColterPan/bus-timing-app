# SG Bus Timing

A BusLah-style Singapore bus arrival app. It has an Expo (React Native) Android app and a small proxy server that keeps your LTA DataMall key private.

```
Phone / laptop browser / emulator ──► Proxy (Hono) ──► LTA DataMall
                                      laptop :3000 during dev
                                      Cloudflare Worker for UAT/APK
```

| Folder | What | Tests |
|---|---|---|
| `server/` | Proxy: `/arrivals/:code`, `/stops`, `/health`. Holds the API key, caches responses, rate-limits callers | Vitest, 36 tests, ~95% coverage |
| `app/` | Expo SDK 58 app: Favourites, Nearby (GPS), Search, Stop detail | Jest + RNTL, 75 tests, 100% line coverage; Maestro E2E flows |

**Features:** live next-3-bus ETAs, crowd level (green = seats, amber = standing, red = limited standing), double-deck/bendy badges, wheelchair icon, a "sched" tag when the time isn't live GPS, 20-second auto refresh, pull to refresh, favourite stops, pin specific services, nearest stops within 500 m, and search by code, name or road. Dark mode follows the phone setting.

---

## 1. One-time setup

| Install | Why |
|---|---|
| **Node 22** (already installed via nvm) | Run `nvm use 22.23.3` once. Node 20 is too old for Expo SDK 58 |
| **Expo Go** on your Android phone (Play Store) | Runs the app over Wi-Fi with live reload |
| **Android Studio** (optional) | Android emulator on your laptop. During setup install *Android SDK*, *Platform-Tools* and a virtual device (e.g. Pixel 8, API 35). Then set the user env var `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk` and add `%ANDROID_HOME%\platform-tools` to PATH |
| **Expo account** (free, expo.dev) | Building the installable APK |
| **Cloudflare account** (free) | Hosting the proxy so the APK works anywhere |
| **Maestro** (optional, maestro.mobile.dev) | Automated E2E tests on emulator/phone |

Then install the dependencies:

```powershell
nvm use 22.23.3
cd C:\dev\bus-timing-app\server; npm install
cd C:\dev\bus-timing-app\app;    npm install
```

Add your key: copy `server/.env.example` to `server/.env` and set `LTA_ACCOUNT_KEY=...`. **Never commit `.env`**, it's gitignored.

---

## 2. Run it on your laptop

You need two terminals.

**Terminal 1: proxy**
```powershell
cd C:\dev\bus-timing-app\server
npm run dev
```
It prints `http://localhost:3000/health` and your Wi-Fi IP, e.g. `http://192.168.1.10:3000`. Check that it works by opening http://localhost:3000/arrivals/83139.

**Terminal 2: app**
```powershell
cd C:\dev\bus-timing-app\app
npx expo start
```
Then press:
- **`w`** to open it in your laptop browser (quickest way to see it working)
- **`a`** to open it in the Android Studio emulator (start the emulator first)

The app finds the proxy through `app/.env.local`:
```
EXPO_PUBLIC_API_URL=http://<your-laptop-Wi-Fi-IP>:3000
```
Run `ipconfig` and use the Wi-Fi adapter's IPv4 address. Restart `npx expo start` after changing it.

---

## 3. Run it on your Android phone (dev / UAT round 1)

1. Put the phone on **the same Wi-Fi** as the laptop.
2. Make sure `app/.env.local` has your laptop's current Wi-Fi IP (see above).
3. Start both terminals as in step 2.
4. Open **Expo Go**, then scan the QR code shown by `npx expo start`.
5. Every code save reloads the app on your phone.

**If the phone can't connect.** Many school, office and public networks block devices from talking to each other. Try in this order:
- Use your **phone's hotspot** for the laptop, then update the IP in `.env.local`.
- Allow ports through Windows Firewall (admin PowerShell):
  `New-NetFirewallRule -DisplayName "Bus app dev" -Direction Inbound -Protocol TCP -LocalPort 3000,8081 -Action Allow`
- Run `npx expo start --tunnel` (this tunnels the app bundle only). Then also deploy the proxy (step 5) and point `EXPO_PUBLIC_API_URL` at it.

---

## 4. Tests

```powershell
cd server; npm test          # unit + route tests
cd server; npm run coverage  # coverage report (80% threshold)
cd app;    npm test          # unit + component + hook tests
cd app;    npm run coverage  # coverage report (80% threshold)
cd app;    npm run typecheck
cd app;    npx expo-doctor   # dependency health check
```

**E2E with Maestro.** Needs the APK installed on an emulator or phone (Maestro targets the installed app, `com.colterpan.sgbustiming`):
```powershell
cd app; maestro test .maestro/
```
Flows: search by code, then live arrivals, then favourite, then check Home; and search by name, then open the stop.

---

## 5. Standalone APK for real-world UAT

The APK can't use your laptop as the proxy once you leave home, so first deploy the proxy to Cloudflare (free):

```powershell
cd C:\dev\bus-timing-app\server
npx wrangler login
npx wrangler secret put LTA_ACCOUNT_KEY   # paste your key when prompted
npm run deploy                            # prints https://bus-timing-proxy.<you>.workers.dev
```
Open `https://bus-timing-proxy.<you>.workers.dev/arrivals/83139` to check it.

Then build the APK:
1. In `app/eas.json`, replace both `https://bus-timing-proxy.REPLACE-ME.workers.dev` with your Worker URL.
2. Run:
   ```powershell
   cd C:\dev\bus-timing-app\app
   npx eas-cli@latest login
   npx eas-cli@latest build -p android --profile preview
   ```
3. When the cloud build finishes (~10–15 min), open the link/QR on your phone, download the `.apk` and install it. Allow "install unknown apps" for your browser when asked.

---

## 6. UAT checklist (on the phone)

- [ ] **Arrivals:** at a real stop, the times match the stop's LED panel or another app within about 1 minute
- [ ] **Auto refresh:** leave the stop screen open; "Updated" time changes every ~20 s
- [ ] **Crowd colours** and DD/BD badges look right for buses you can see
- [ ] **Nearby:** grant location; the closest stops are listed with sensible distances
- [ ] **Location denied:** deny permission; you get a clear message and a button to fix it
- [ ] **Search:** by 5-digit code (Enter opens it), by stop name, by road name
- [ ] **Favourites:** star a stop and it shows on Home; pin one service and only that service shows; kill and reopen the app and favourites are still there
- [ ] **Offline:** airplane mode; you see a friendly error with "Try again", not a crash. Nearby/Search still work from the stop list cached on the phone
- [ ] **Late night:** a stop with no buses shows "No buses are serving this stop right now"
- [ ] **Dark mode:** switch the phone to dark mode and the app follows

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `expo` / `vitest` errors about Node version | Run `nvm use 22.23.3` (Node 20 is too old) |
| App shows "Can't reach the bus server" | Proxy not running, wrong IP in `app/.env.local`, or the network blocks device-to-device traffic (see step 3) |
| Proxy returns 502 | LTA is down or the key is wrong. Check the proxy terminal's error log |
| Changed `.env.local` but nothing happened | Restart `npx expo start` (env vars are read at start-up) |
| Metro acting strange | `npx expo start --clear` |

## Notes

- The project lives outside OneDrive on purpose. Syncing `node_modules` breaks the bundler's file watching.
- `app/package.json` has an npm `overrides` entry for `react-native-worklets`: SDK 58's `expo-modules-core` declares an outdated peer range. The override is pinned to the same version as `react-native-worklets` in `dependencies`; bump both together. It also excludes `jest`/`@types/jest` from `expo install --check`, because jest-expo 58 runs on Jest 30.
- The DataMall terms ask for reasonable call rates. The proxy caches arrivals for 15 s per stop and the stop list for 24 h, and the app keeps its own copy of the stop list for a week.
