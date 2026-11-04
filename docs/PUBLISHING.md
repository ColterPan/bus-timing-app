# Publishing SG BUS on Google Play

> **Naming first:** "SGBUS" is the Land Transport Authority's own brand for Singapore's public buses (it's on the side of every green bus), and the lush green is their livery. Using them is fine for personal testing. For a public Play Store release, pick a distinct name (e.g. "SG Bus Timing" or something of your own), and consider a different icon colour too, or Google may reject the app as impersonating a government agency. Change `"name"` in `app/app.json`, and the icon via `app/assets/brand/`.

This is a step-by-step guide for a first-time Android publisher. Expect it to take **3–5 weeks** end to end. Most of that is Google's mandatory 14-day closed test and their reviews, not work.

| Phase | Time | Who |
|---|---|---|
| 1. Put the proxy online | 15 min | you (Cloudflare login) |
| 2. App icon and store graphics | 1–2 h | you (or ask Claude to make them) |
| 3. Play Console account | ~1–3 days (ID verification) | you |
| 4. Build the release file (`.aab`) | 20 min | you, using EAS |
| 5. Set up the store listing and policies | 1–2 h | you |
| 6. Closed test: **12+ testers for 14 days** | 14+ days | you and friends |
| 7. Apply for production | ~7 days review | Google |
| 8. Publish, then ship updates | minutes per update | you |

---

## 1. Put the proxy online (required)

The phone app can't use your laptop as its server once it's in other people's hands. Deploy the proxy to Cloudflare Workers (free tier: 100,000 requests/day):

```powershell
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\server"
npx wrangler login                       # opens a browser to sign in to Cloudflare
npx wrangler secret put LTA_ACCOUNT_KEY  # paste your DataMall key when asked; it stays secret on Cloudflare
npm run deploy                           # prints https://bus-timing-proxy.<your-subdomain>.workers.dev
```

Check it by opening `https://bus-timing-proxy.<your-subdomain>.workers.dev/arrivals/83139` in a browser.

Then, in `app/eas.json`, replace **both** `https://bus-timing-proxy.REPLACE-ME.workers.dev` with your Worker URL. That URL is not a secret: the key stays on Cloudflare, so it's fine to commit it.

## 2. App icon and store graphics

The app still uses Expo's default icon, and Google will reject placeholder branding. You need:

| Asset | Size | Where it goes |
|---|---|---|
| App icon | 1024×1024 PNG | `app/assets/icon.png` |
| Android adaptive icon | 1024×1024 PNG foreground (artwork in the centre ~66%), plus a background colour | `app/assets/android-icon-foreground.png`, and `backgroundColor` in `app.json` |
| Play Store icon | 512×512 PNG (32-bit, ≤1 MB) | uploaded in Play Console |
| Feature graphic | 1024×500 PNG/JPG | uploaded in Play Console |
| Phone screenshots | at least 2 (ideally 4–8), portrait 9:16, e.g. 1080×1920 | uploaded in Play Console |

Tips:
- Take screenshots from your own phone running the app: the Nearby map, a stop's times, Favourites, the MRT map, and dark mode.
- **Don't use LTA's logo or "SGBUS" brand, the "BusLah" name, or anything that looks official.** Google removes apps that impersonate government agencies or other apps. A distinct name plus a generic bus icon is fine (see the naming note at the top).

## 3. Create a Google Play developer account

1. Go to <https://play.google.com/console/signup>.
2. Choose a **Personal** account (unless you have a registered business).
3. Pay the one-time registration fee (US$25 at the time of writing; check the sign-up page).
4. Complete **identity verification** (government ID) and verify your phone and email. This can take a few days.
5. You'll also need to verify that you own an Android device. The Play Console app on your phone handles this.

> **Heads-up:** personal accounts created after 13 Nov 2023 must run a **closed test with at least 12 testers, opted in for 14 days in a row**, before the app can go public (step 6). Organisation accounts (which need a D-U-N-S number) are exempt.

## 4. Build the release file

Play Store needs an **Android App Bundle (`.aab`)**, not the `.apk` used for testing.

```powershell
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\app"
npx eas-cli@latest login                                 # free Expo account
npx eas-cli@latest build -p android --profile production
```

- The first time, EAS asks to **generate an Android keystore**. Say **yes** and let EAS store it. This key signs every future update, so never delete it from EAS, and never commit keystores (they're gitignored).
- The build runs in the cloud (~10–20 min) and gives you a download link for the `.aab`.
- `autoIncrement` in `eas.json` bumps the internal version code for every build. For user-visible versions, change `"version"` in `app/app.json` (e.g. `1.0.0` → `1.1.0`).
- The package name `com.colterpan.sgbustiming` (in `app.json`) is **permanent** once uploaded. Change it now if you want something else.

## 5. Create the app in Play Console

**Home → Create app:** enter your public app name (see the naming note at the top), default language English, choose **App**, **Free**, and accept the declarations.

Then complete every item under **Dashboard → Set up your app**:

| Section | What to enter |
|---|---|
| **Privacy policy** | `https://github.com/ColterPan/bus-timing-app/blob/main/docs/PRIVACY.md` |
| **App access** | All functionality is available without special access |
| **Ads** | No, the app has no ads |
| **Content rating** | Fill in the questionnaire: Utility/Reference category; answer "No" to violence, gambling, etc. The result should be Everyone/3+ |
| **Target audience** | 13 and over (picking under-13 brings extra Families-policy requirements) |
| **News app** | No |
| **Data safety** | **No data collected or shared.** Location is used only on the device and never leaves it, which Google's form doesn't count as "collected". Encrypted in transit: yes (HTTPS). Account deletion: not applicable (no accounts). |
| **Government apps** | Not a government app (it's independent; say so in the description too) |
| **Store listing** | Short description (≤80 chars), full description (≤4000), icon, feature graphic, screenshots, category **Maps & Navigation**, contact email |

Suggested short description:
> Live Singapore bus arrival times, nearby stops on a map, favourites and the MRT map.

Suggested start of the full description:
> [App name] shows live bus arrivals for every stop in Singapore. Open the app and your nearest stops, and the closest stop's bus times, are right there on a map. Save favourite stops, search by stop code, name or road, and check the MRT system map. Light and dark themes.
> Bus arrival data from LTA DataMall (Singapore Open Data Licence v1.0). Map tiles © OneMap / Singapore Land Authority. This app is independent and not affiliated with or endorsed by LTA.

## 6. Closed test: 12 testers × 14 days

1. **Testing → Closed testing → Create track**, then **Create release** and upload the `.aab` from step 4. Add release notes.
2. **Testers tab:** create an email list with **at least 12 Google accounts** (friends, family, classmates; your own counts as well). Ask a few extra people in case some drop out.
3. Send them the **opt-in link** shown on that page. Each tester must open it, tap **Become a tester**, and then install the app from Google Play.
4. Submit the release for review. Once approved, the **14-day clock** runs while at least 12 testers stay opted in. Testers who leave and rejoin don't count.
5. Ask testers to actually use it a few times (Google looks at engagement), and collect feedback. The UAT checklist in the README is a good script for them.
6. If you fix bugs during the test, build again (step 4) and upload a new release to the same closed track. The 14 days keep counting.

## 7. Apply for production access

After 14 days with 12+ opted-in testers, **Dashboard → Apply for production**. You'll answer questions about the closed test, the app and its readiness. Review usually takes up to ~7 days. If they ask for more testing, keep the closed test running and re-apply.

## 8. Publish, then ship updates

**Production → Create release**, upload the latest `.aab` and roll it out (you can start at, say, 20% of users and increase). Google reviews the release, usually within hours to a few days, and then anyone can install it from the Play Store.

For each later update:

```powershell
# 1. bump "version" in app/app.json, commit your changes
cd "C:\Users\colte\OneDrive\Documents\Personal Project\Bus Timing App\app"
npx eas-cli@latest build -p android --profile production
# 2. upload the new .aab: Play Console → Production → Create release
```

Optional automation: `eas submit -p android` can upload builds for you. It needs a **Google Cloud service-account JSON key** with Play Console access (see Expo's "Submit to Google Play" guide). Keep that file **outside git**: `google-service-account*.json` is already gitignored. The first upload must always be done by hand in Play Console.

---

## Before every public release: checklist

- [ ] The `eas.json` API URL points at your Cloudflare Worker (not your laptop)
- [ ] All tests pass (`npm test` in `app/` and `server/`) and CI on GitHub is green
- [ ] UAT checklist in the README done on a real phone
- [ ] `version` bumped in `app/app.json`
- [ ] No secrets in git (`server/.env` and keystores are ignored; the DataMall key lives only in Cloudflare)
- [ ] Privacy policy still accurate (update it if you ever add analytics, accounts or ads)

## Costs

| Item | Cost |
|---|---|
| Google Play registration | one-time fee (US$25 at the time of writing) |
| Expo EAS builds | free tier (limited builds per month, which is plenty here) |
| Cloudflare Workers | free up to 100k requests/day; the proxy's 15 s cache keeps LTA calls low |
| LTA DataMall | free (keep call rates reasonable, as their terms require) |
