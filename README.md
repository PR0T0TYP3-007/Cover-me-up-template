# CoverMe — frontend template

A mobile-first PWA **template** written in plain HTML, CSS and JS, with no build step. It follows the *System Design, Architecture & Build Plan* (design concept "the calm advocate in your pocket"), including the update that added the logic review, the new setup flow, the 7-state case lifecycle and Mode B sending.

It is a design and UX reference built against mock data. The real app (Next.js frontend, NestJS API, Postgres, Gemini) is built separately: nothing here talks to a real backend, card-scan service or email provider.

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
| 2 | Setup: who it's for → scan the HMO card or pick HMO + enrollee ID → plan type (NHIA programme / state scheme / private / not sure) → hospital (state → LGA → search, Use my location, or type it). Skippable from step 2 | `setup.html` (`?edit=1` from Settings) |
| 3 | Home: open cases first (if any), voice button, text box, quick picks | `home.html` |
| 4 | Checking: the pipeline steps tick in; "Is this right?" for voice notes; back asks "Stop checking?" and keeps a draft | `checking.html` |
| 5 | Result: "If you're enrolled with…" framing + insurance confidence, then one verdict card and desk script **per issue** (scripts stream in after the headline), HMO call bar with "This number didn't work", and "When did the hospital ask your HMO?" before the timer | `result.html?case=` (`?error=` shows the error state) |
| 6 | 1-hour timer ring (green → amber → red), "approximate" label, Add-to-home-screen prompt, timeline | `timer.html?case=` |
| 7 | Complaint: name, phone, enrollee ID; letter preview; send it yourself (email / WhatsApp / call / PDF) or "Let CoverMe send it" with consent. Escalation: HMO → NHIA (NHIA programmes, private) or → state agency (state schemes) | `complaint.html?case=` |
| 8 | My cases; case detail with patient/HMO/plan (editable per case), nudges at 24 h / 48 h and day 10 / 25, HMO reply, evidence photos, Download case PDF, mark resolved or refunded | `cases.html`, `case.html?id=` |
| 9 | Know your rights library + rule detail (share a rule as an image) | `rights.html`, `rule.html?id=` |
| 10 | Settings: language, theme, HMO, alerts, demo tools, delete all my data | `settings.html` |
| 11 | Emergency takeover: closes only via "I'm getting help now" or "This isn't an emergency" (logged on the case) | `CM.ui.emergency()` in `ui.js` |
| – | Privacy notice, offline fallback, 404 | `privacy.html`, `offline.html`, `404.html` |

## Design

- **Concept:** "the calm advocate in your pocket". The look is editorial and warm, not clinical.
- **Type:** Fraunces (display serif) for headings, the desk script and letters; Instrument Sans for the interface; JetBrains Mono for rule IDs, timestamps and labels. This replaces the plan's Plus Jakarta Sans and Inter so the app doesn't look like a default template.
- **Signature pieces:**
  - green hero blocks with an adire-inspired line pattern
  - verdicts shown as an inked stamp
  - rule citations as perforated tickets
  - the desk script on a dark green card
  - tactile pill buttons, and a floating dock nav on phones
- **Layouts:**
  - Phones (under 640px): single column, floating bottom dock, sticky primary action.
  - Tablet (640px and up): roomier single column.
  - Desktop (1024px and up): dark green sidebar (nav, New case, your HMO, language, emergency) and two-column screens. On result, the answer sits beside the call bar. Complaint shows the form beside the letter, and timer shows the ring beside the timeline. Welcome is a split screen.
- **Colours:** The palette stays on the plan's tokens (`brand-700`, `paper`, `amber-500`, `danger-600` for emergencies only). Light and dark themes are both supported.

## Code layout

```
assets/css/styles.css      tokens (brand-700, paper, amber-500 ...) + every component, light/dark
assets/js/icons.js         inline Lucide-style icons + logo
assets/js/i18n.js          every string in English + Pidgin (CM.t, data-i18n attributes)
assets/js/mock-data.js     sample HMOs, drugs (with level of care), rules (with plan scope), facilities
                           for Lagos / FCT / Anambra, state agencies, NHIA contact  <- replace with seed data
assets/js/api.js           MOCK API that mirrors /api/v1 and the verdict JSON shape
assets/js/store.js         localStorage (settings, consent, offline cache)
assets/js/ui.js            shell, statuses, call bar, sheets, dialogs, emergency, desk mode, overdue watcher
assets/js/install.js       "Add to home screen" card (Android install prompt / iOS Share steps)
assets/js/share-rule.js    share a rule as a 1080x1080 image
assets/js/voice.js         hold or tap to record, live waveform, 60 s cap, slide to cancel
assets/js/pages/*.js       one script per screen
sw.js, manifest.webmanifest, assets/icons/ (PNG app icons)
```

## Wiring the real backend

Every method in `assets/js/api.js` returns a Promise that has the same shape as the REST response. The comment at the top of that file maps each method to its endpoint. To connect the backend, replace each method body with a `fetch('/api/v1/...', { credentials: 'include' })` call. The screens do not need to change.

Once the backend is connected, delete the client-side copies of the rules engine and the templates (`understand`, `decide`, `write`). On the server, the AI reads and writes, and the rules engine decides coverage.

Case shape (same as the doc's mock JSON): `{ caseId, emergency, transcript, planType, verification, hmo{name,phone,complaintEmail}, facility{name,level}, issues[{ type, verdict, headline, citations[], confirmWithHmo, script, askFor, timer{approvalRequestedAt,deadlineAt,approximate}|null }], status, serverTime }`. Statuses: `open → waiting_hmo → overdue → complaint_hmo → complaint_regulator → resolved | refunded`.

The headline, script and askFor fields are mocked as `{ en, pcm }` objects so that the language toggle works offline. `CM.L()` also accepts plain strings, which is what the API returns.

## Install as an app (PWA)

- **Android / Chrome:** an "Add to home screen" card appears after a few seconds on a phone with a real install button (`beforeinstallprompt`). Settings also has **Install CoverMe**.
- **iPhone / iPad:** iOS has no install API, so the card shows the steps: tap **Share** → **Add to Home Screen** → **Add**.
- Never shown once installed, on desktop, or on Welcome / Setup / Checking / Timer / Complaint; "Not now" snoozes it for a week. The Timer screen has its own prompt because on iPhone the overdue alert only arrives for the home-screen app.
- Preview it anywhere with `?install=ios` or `?install=android`.
- Icons: PNG 96 / 192 / 512, a maskable 512 and a 180 px `apple-touch-icon` in `assets/icons/`, made from `assets/img/icon.svg` and `icon-maskable.svg`.

## Demo mode

Go to **Settings → Demo tools**:

- **Demo mode** runs the timer at 60× speed.
- **Load a ready demo case** loads the demo line (two problems: drug outside + referral) with the hospital having asked the HMO 50 minutes ago.
- **Simulate "couldn't check"** makes the next request fail so you can show the error state.

> The mock data uses placeholder phone numbers and emails, illustrative rule texts and a mocked card scan. Replace them with `coverme_seed.zip`, the Health Facility Registry export and the real API before showing the app to real users.
