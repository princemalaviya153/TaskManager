# TaskManager

A daily task manager that runs on desktop and mobile as an installable web app (PWA).
Built with React, Vite and Tailwind CSS, with accounts and cloud sync through [Supabase](https://supabase.com).
Tasks sync between all your devices, and the app keeps working offline.

## Run it

```bash
npm install
npm run dev        # development server with hot reload -> http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build -> http://localhost:4173
```

Both servers listen on your local network, so you can open the printed `Network:` URL on your phone (same Wi-Fi).

## Database setup (Supabase)

1. In the Supabase dashboard open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the `tasks` table, the Row Level Security rules (each user only sees their own tasks) and live updates.
2. In **Authentication → URL Configuration** set **Site URL** to your deployed URL
   (e.g. `https://task-manager-prince.vercel.app`) and add `http://localhost:5173` and `http://localhost:4173`
   under **Redirect URLs**, so email confirmation links open the app.
3. The connection values live in [`.env`](.env). They are public by design; never put the `service_role` key there.

### How sync works

Every change is saved on the device first, then pushed to Supabase in the background. Changes from other
devices arrive live (Supabase Realtime) and whenever the app is reopened. Offline changes wait in a queue and
are sent when the connection returns. The dot on the account button shows the sync state.

Tasks created before accounts existed (Phase 1) are moved into your account the first time you sign in on that device.

## Install on your phone

Phones only allow installing a PWA from **https** (or localhost), so deploy it first:

1. Push this folder to GitHub.
2. Import the repo on [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (framework: Vite, build: `npm run build`, output: `dist`).
3. Open the deployed URL on your phone:
   - **Android (Chrome):** menu ⋮ → *Install app* / *Add to Home screen*
   - **iPhone (Safari):** Share → *Add to Home Screen*

## Adding tasks

Below the task box are **Date**, **Time**, **Priority** and **Tags** buttons. Tap one to pick a value
(quick choices or a date/time picker, priority levels, existing tags or a new tag). A picked value
overrides anything typed in the text; tags from both are combined.

### Typing shortcuts

You can also type these directly in the task text; they show up as selected in the buttons.

| Type | Examples |
|---|---|
| Date | `today`, `tomorrow`, `yesterday`, `friday`, `next week`, `in 3 days`, `5 oct`, `oct 5`, `2026-10-05` |
| Time | `3pm`, `3:30pm`, `at 15:00` (a time with no date means today) |
| Priority | `!high` `!h` `!1` · `!medium` `!m` `!2` · `!low` `!l` `!3` |
| Tags | `#work`, `#home` |

Example: `Call dentist tomorrow 3pm #health !high`

Tasks added without a date go to **Today** when you're on the Today view, **Tomorrow** on Upcoming, and **Anytime** otherwise.

## Project layout

```
src/
  Root.jsx                 session check: sign-in screen or the app
  App.jsx                  views (Today / Upcoming / Anytime / Done), tag filter
  components/              QuickAdd, TaskItem, TaskSection, EditTaskSheet, AuthScreen, AccountMenu, Toast, Icons
  hooks/useTasks.js        local-first task state, sync queue, realtime; useToday()
  lib/parse.js             quick-add natural-language parser
  lib/dates.js             local date keys and formatting
  lib/storage.js           per-account device cache + pending-change queue
  lib/sync.js              Supabase fetch/push and row mapping
  lib/supabase.js          Supabase client
  lib/tasks.js             task model, sorting, helpers
supabase/schema.sql        database table, security rules, realtime
public/icon.svg            source icon; `npm run icons` regenerates the PNG icons
```

## Roadmap

- ~~**Phase 2:** accounts and cloud sync (Supabase) so phone and PC share tasks~~ ✅
- **Phase 3:** recurring tasks, reminders/notifications, Pomodoro timer, weekly stats
- **Phase 4:** AI features (smarter natural-language input, day planner, task breakdown)
