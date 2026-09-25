# TaskManager

A daily task manager that runs on desktop and mobile as an installable web app (PWA).
Built with React, Vite and Tailwind CSS. Tasks are stored on the device (localStorage) and the app works offline.

## Run it

```bash
npm install
npm run dev        # development server with hot reload -> http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build -> http://localhost:4173
```

Both servers listen on your local network, so you can open the printed `Network:` URL on your phone (same Wi-Fi).

## Install on your phone

Phones only allow installing a PWA from **https** (or localhost), so deploy it first:

1. Push this folder to GitHub.
2. Import the repo on [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (framework: Vite, build: `npm run build`, output: `dist`).
3. Open the deployed URL on your phone:
   - **Android (Chrome):** menu ⋮ → *Install app* / *Add to Home screen*
   - **iPhone (Safari):** Share → *Add to Home Screen*

> Phase 1 stores tasks per device, so tasks on your phone and PC are separate until cloud sync is added (Phase 2).

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
  App.jsx                  views (Today / Upcoming / Anytime / Done), tag filter
  components/              QuickAdd, TaskItem, TaskSection, EditTaskSheet, Toast, Icons
  hooks/useTasks.js        task state + actions, useToday()
  lib/parse.js             quick-add natural-language parser
  lib/dates.js             local date keys and formatting
  lib/storage.js           persistence (swap for cloud sync in Phase 2)
  lib/tasks.js             task model, sorting, helpers
public/icon.svg            source icon; `npm run icons` regenerates the PNG icons
```

## Roadmap

- **Phase 2:** accounts and cloud sync (Supabase) so phone and PC share tasks
- **Phase 3:** recurring tasks, reminders/notifications, Pomodoro timer, weekly stats
- **Phase 4:** AI features (smarter natural-language input, day planner, task breakdown)
