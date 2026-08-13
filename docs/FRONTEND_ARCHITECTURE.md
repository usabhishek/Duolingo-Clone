# Frontend Architecture

## Stack
- Next.js 14 App Router
- TypeScript (strict)
- Tailwind CSS + CSS variables for theming
- TanStack Query (server state)
- Zustand-ready (lesson UI uses local React state)
- Framer Motion (animations)

## Structure
```
app/           → Pages (route segments)
components/    → UI components by domain
lib/api/       → Centralized API client (never raw fetch in pages)
lib/auth/      → Token storage (JWT only — never XP/hearts)
types/         → TypeScript interfaces matching backend schemas
```

## State Management Rules
- **TanStack Query**: path, stats, leaderboard, achievements, analytics
- **Local state**: lesson exercise selection, word bank, match pairs
- **Never store**: XP, hearts, gems as source of truth in localStorage

## Key Components
| Component | Purpose |
|-----------|---------|
| LearningPath | Duolingo-style vertical skill tree |
| ExerciseRenderer | Routes to exercise type UI |
| TopBar | Streak, XP, hearts, gems, daily goal bar |
| AudioButton | Browser SpeechSynthesis TTS |
| SpeechInput | Web Speech API with text fallback |

## Pages
- `/` — Home learning path + course selector (ES/DE/EN)
- `/lesson/[id]` — Full lesson player with feedback bar
- `/profile`, `/leaderboard`, `/achievements`, `/friends`, `/chat`
- `/practice`, `/mistakes`, `/analytics`

## Dark Mode
CSS variables in `globals.css`, toggled via `ThemeProvider`.

## Responsive
Mobile-first, max-w-2xl container, bottom nav bar.
