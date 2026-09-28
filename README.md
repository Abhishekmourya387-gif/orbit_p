# Orbit — Recovery Companion

A full-stack web application that helps users track progress in overcoming addictive behaviors — with a gentle onboarding flow, daily check-ins, streak tracking with gamification (orbs), community support, educational lessons, and a coach messaging feature. Dark, space-themed UI with glassmorphism design.

> Built as a hackathon project.

## ✨ Features

- **Onboarding flow** — personalized setup (habit, triggers, goals)
- **Daily check-ins** — mood, urge levels, triggers, wins, relapse tracking
- **Streaks & gamification** — current/longest streaks, earnable orbs
- **Community** — anonymous posts with tags, likes, threaded replies
- **Lessons** — educational content on recovery
- **Coach messaging** — supportive conversational guidance

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Wouter, TanStack Query, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Backend | Node.js, Express 5, TypeScript (ESM), REST API |
| Database | PostgreSQL via Drizzle ORM, Zod validation |
| Build | Vite |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development (client + server)
npm run dev
```

The app runs on `http://localhost:5000` in development.
The current server uses in-memory storage, so no database is needed to run it. Data resets whenever the server restarts. `npm run db:push` is only for setting up the PostgreSQL schema and requires a `DATABASE_URL`; it does not switch the app to persistent storage.

## 📁 Project Structure

```
├── client/        # React frontend (pages, components, hooks)
├── server/        # Express API (routes, storage, auth)
├── shared/        # Shared Drizzle schema + types
├── script/        # Build scripts
└── drizzle.config.ts
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server + client |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run check` | TypeScript type-check |
| `npm run db:push` | Push Drizzle schema to database |

## 📄 License

MIT — see [LICENSE](LICENSE).
