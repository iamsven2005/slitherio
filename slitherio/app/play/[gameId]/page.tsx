import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { GameStatus } from "@prisma/client"
import PlayerSetup from "@/components/player-setup"
import GameCanvas from "@/components/game-canvas"
import GameControls from "@/components/game-controls"
import DebugPanel from "@/components/debug-panel"

export default async function GamePage({ params }: { params: { gameId: string } }) {
  // Properly handle params as they need to be awaited in Next.js
  const gameIdParam = await Promise.resolve(params.gameId)

  // For new game, we'll create it when the player submits their username
  if (gameIdParam === "new") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-green-50 to-green-100">
        <PlayerSetup isNewGame={true} />
      </div>
    )
  }

  // For existing game, fetch it
  const game = await db.game.findUnique({
    where: { id: gameIdParam },
    include: {
      players: {
        include: {
          player: true,
        },
      },
      foods: true,
    },
  })

  if (!game) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <div className="w-full max-w-6xl">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">{game.name}</h1>
          <div className="flex gap-4">
            <div className="bg-green-800 text-white px-3 py-1 rounded-md">Players: {game.players.length}</div>
            <div
              className={`${game.status === GameStatus.WAITING ? "bg-yellow-600" : "bg-green-600"} text-white px-3 py-1 rounded-md`}
            >
              Status: {game.status}
            </div>
          </div>
        </div>

        {game.status === GameStatus.WAITING ? (
          <PlayerSetup gameId={game.id} isNewGame={false} />
        ) : (
          <div className="relative">
            <GameCanvas gameId={game.id} />
            <GameControls />
            <DebugPanel gameId={game.id} />
          </div>
        )}
      </div>
    </div>
  )
}
