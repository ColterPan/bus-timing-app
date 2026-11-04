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
| `app/` | Expo SDK 58 app: Favourites, Nearby (map + GPS), Search, MRT Map, Stop detail | Jest + RNTL, 110 tests, ~99% line coverage; Maestro E2E flows |

## Features

- **Live bus times:** next 3 buses per service; crowd level (green = seats, amber = standing, red = limited standing); double-deck/bendy badges; wheelchair icon; a "sched" tag when the time isn't live GPS. Auto refresh every 20 s, plus pull to refresh.
- **Nearby map:**
  - A draggable map with a blue "you are here" dot and bus-stop pins (the nearest are orange). Tap a pin to open that stop's times.
  - The ⌖ button jumps back to your location, and the tab re-locates you whenever you open it.
- **Nearby list:** the 10 nearest stops under the map. Tap one to drop down its live times, or ☆ to save it.
- **Favourites:** save stops with the ☆ from Nearby, Search or the stop page, and pin specific services.
- **Search:** by 5-digit stop code, stop name or road.
- **MRT map:** LTA's official system map (pinch or tap to zoom), with a link to the latest version on LTA's site.
- Dark mode follows the phone setting.

**Credits:** map tiles by [OneMap](https://www.onemap.gov.sg/) © Singapore Land Authority, with [Leaflet](https://leafletjs.com/); MRT system map © [Land Transport Authority](https://www.lta.gov.sg/), loaded live from LTA's website; bus data from [LTA DataMall](https://datamall.lta.gov.sg/). None of these need an API key in the app. The only key (LTA DataMall) stays on the proxy server.

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
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\server"; npm install
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\app";    npm install
```

Add your key: copy `server/.env.example` to `server/.env` and set `LTA_ACCOUNT_KEY=...`. **Never commit `.env`**, it's gitignored.

---

## 2. Run it on your laptop

You need two terminals.

**Terminal 1: proxy**
```powershell
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\server"
npm run dev
```
It prints `http://localhost:3000/health` and your Wi-Fi IP, e.g. `http://192.168.1.10:3000`. Check that it works by opening http://localhost:3000/arrivals/83139.

**Terminal 2: app**
```powershell
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\app"
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
Flows:

- search by code, see live arrivals, favourite the stop, then check Home
- search by name, then open the stop
- on Nearby, allow location, expand a stop's dropdown, ☆ it, tap ⌖, then check the MRT Map tab and Favourites

---

## 5. Standalone APK for real-world UAT

The APK can't use your laptop as the proxy once you leave home, so first deploy the proxy to Cloudflare (free):

```powershell
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\server"
npx wrangler login
npx wrangler secret put LTA_ACCOUNT_KEY   # paste your key when prompted
npm run deploy                            # prints https://bus-timing-proxy.<you>.workers.dev
```
Open `https://bus-timing-proxy.<you>.workers.dev/arrivals/83139` to check it.

Then build the APK:
1. In `app/eas.json`, replace both `https://bus-timing-proxy.REPLACE-ME.workers.dev` with your Worker URL.
2. Run:
   ```powershell
   cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\app"
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
- [ ] **Map:** the blue dot is where you're standing; drag and pinch to explore; zoom in to see more pins; tap a pin to open that stop's times
- [ ] **⌖ button:** drag the map away, tap ⌖, and it jumps back to you
- [ ] **Dropdown:** tap a nearby stop to see its live times inline; tap again to close; ☆ saves it
- [ ] **Re-locate:** walk somewhere else (or wait 30 s), switch tabs and come back; the nearest list updates without restarting the app
- [ ] **MRT Map:** the official map loads; pinch/tap to zoom; "Latest on LTA" opens LTA's website
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

- The project lives in OneDrive, which also syncs `node_modules` (~700 MB). If `npm install` is slow, pause OneDrive sync (OneDrive icon → Settings → Pause syncing) and resume afterwards. If Expo stops noticing file changes, run `npx expo start --clear`. GitHub is the real backup.
- `app/package.json` has an npm `overrides` entry for `react-native-worklets`: SDK 58's `expo-modules-core` declares an outdated peer range. The override is pinned to the same version as `react-native-worklets` in `dependencies`; bump both together. It also excludes `jest`/`@types/jest` from `expo install --check`, because jest-expo 58 runs on Jest 30.
- The DataMall terms ask for reasonable call rates. The proxy caches arrivals for 15 s per stop and the stop list for 24 h, and the app keeps its own copy of the stop list for a week.
