# 🐍 Multiplayer Snake Game (Next.js + Prisma + Socket.IO)

This is a real-time, multiplayer snake game built with **Next.js App Router**, **Prisma**, and **Socket.IO**. Players can join a game, control their snakes using keyboard input, and compete for food while avoiding collisions.

## 🚀 Features

- ⚡ Real-time multiplayer with Socket.IO
- 🐍 Classic snake gameplay with smooth movement
- 🍏 Dynamic food spawning and growth logic
- 💀 Collision detection (self, others, and walls)
- 🎮 Player score tracking and game state persistence using Prisma + PostgreSQL
- 🧠 Optimized with polling or WebSocket state updates
- 🖥️ Server-rendered and API-routed via Next.js 14/15 App Router

---

## 🛠️ Tech Stack

| Layer       | Tech                      |
|-------------|---------------------------|
| Frontend    | React (Next.js App Router) |
| Realtime    | Socket.IO (via Node.js Server API route) |
| Database    | PostgreSQL + Prisma ORM   |
| Styling     | Tailwind CSS              |
| Hosting     | Vercel or self-hosted     |

---

## 🧑‍💻 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/nextjs-snake-game.git
cd nextjs-snake-game
````

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/snakegame
```

### 4. Set up the database

```bash
npx prisma migrate dev --name init
```

### 5. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to play the game!

---

## 🎮 Controls

* `W` / `ArrowUp` – Move up
* `S` / `ArrowDown` – Move down
* `A` / `ArrowLeft` – Move left
* `D` / `ArrowRight` – Move right

---

## 📁 Folder Structure

```
app/
 └─ api/
     └─ game/[gameId]/route.ts    # Game state GET/POST handlers
 └─ layout.tsx                    # Root layout
 └─ page.tsx                      # Entry UI

lib/
 └─ db.ts                         # Prisma client instance

components/
 └─ GameCanvas.tsx                # Renders the snake & food
 └─ DebugPanel.tsx                # Debug UI for dev mode

hooks/
 └─ use-game-controls.ts          # Handles keyboard direction input
 └─ use-game-state.ts             # Polls or listens for game state

pages/
 └─ api/socket.ts                 # Socket.IO server handler
```

---

## ⚠ Known Issues

* Turbopack is not currently supported — use `npm run dev` (Webpack).
* Ensure your database is running locally or hosted remotely (NeonDB, Supabase, etc.).

---

## 📦 Deployment

You can deploy this to Vercel or any Node.js hosting platform. Ensure your database is accessible via `DATABASE_URL`.

---

## 📜 License

MIT License. Use it, modify it, and have fun.

---

## 🙌 Acknowledgements

Inspired by the classic Snake game and modern multiplayer architecture. Built with ❤️ using Next.js and Prisma.