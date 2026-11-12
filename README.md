# CoverMe — frontend template

A mobile-first PWA template written in plain HTML, CSS and JS, with no build step. It follows the *System Design, Architecture & Build Plan* (design concept "the calm advocate in your pocket").

## Run it

```bash
python -m http.server 5500
```

Then open <http://localhost:5500>. Opening the files directly with `file://` also works, but the service worker and microphone need `http(s)`.

The service worker is turned off on localhost so that your edits show when you reload. To test offline mode locally, add `?sw=1` to the URL.

## Screens

| # | Screen | File |
|---|--------|------|
| 1 | Welcome (3 swipe cards) and consent | `index.html` |
| 2 | Setup: HMO picker, then plan type, then hospital | `setup.html` (`?edit=1` from Settings) |
| 3 | Home: voice button, text box, quick picks, open cases | `home.html` |
| 4 | Checking: the pipeline steps tick in. For voice notes it also asks "Is this right?" | `checking.html` |
| 5 | Result: verdict, citations, desk script, HMO call bar, start timer | `result.html?case=` (`?error=` shows the error state) |
| 6 | 1-hour timer ring (green, then amber, then red) and the timeline | `timer.html?case=` |
| 7 | Complaint: details, letter preview, email / WhatsApp / PDF; escalation goes HMO, then NHIA call centre, then NHIA Enforcement | `complaint.html?case=` |
| 8 | My cases, and case detail (add events, mark resolved or refunded) | `cases.html`, `case.html?id=` |
| 9 | Know your rights library (search, topics, share a rule as an image) | `rights.html` |
| 10 | Settings: language, theme, HMO, alerts, demo tools, delete all my data | `settings.html` |
| 11 | Emergency takeover (the ⓘ button in the header, or triggered by keywords) | `CM.ui.emergency()` in `ui.js` |
| – | Privacy notice and offline fallback | `privacy.html`, `offline.html` |

## Code layout

```
assets/css/styles.css      tokens (brand-700, paper, amber-500 ...) + every component, light/dark
assets/js/icons.js         inline Lucide-style icons + logo
assets/js/i18n.js          every string in English + Pidgin (CM.t, data-i18n attributes)
assets/js/mock-data.js     sample HMOs / drugs / rules  <- replace with the seed data
assets/js/api.js           MOCK API that mirrors /api/v1 and the verdict JSON shape
assets/js/store.js         localStorage (settings, consent, offline cache)
assets/js/ui.js            shell, sheets, dialogs, toasts, emergency, desk mode, overdue watcher
assets/js/voice.js         hold or tap to record, live waveform, 60 s cap, slide to cancel
assets/js/pages/*.js       one script per screen
sw.js, manifest.webmanifest
```

## Wiring the real backend

Every method in `assets/js/api.js` returns a Promise that has the same shape as the REST response. The comment at the top of that file maps each method to its endpoint. To connect the backend, replace each method body with a `fetch('/api/v1/...', { credentials: 'include' })` call. The screens do not need to change.

Once the backend is connected, delete the client-side copies of the rules engine and the templates (`understand`, `decide`, `write`). On the server, the AI reads and writes, and the rules engine decides coverage.

The headline, script and askFor fields are mocked as `{ en, pcm }` objects so that the language toggle works offline. `CM.L()` also accepts plain strings, which is what the API returns.

## Demo mode

Go to **Settings → Demo tools**:

- **Demo mode** runs the timer at 60× speed.
- **Load a ready demo case** opens a timer that is already 50 minutes in.
- **Simulate "couldn't check"** makes the next request fail so you can show the error state.

> The mock data uses placeholder HMO phone numbers and illustrative rule texts. Replace them with `coverme_seed.zip` before showing the app to real users.
