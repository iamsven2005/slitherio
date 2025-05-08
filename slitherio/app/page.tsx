import Link from "next/link"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { GameStatus } from "@prisma/client"

export default async function Home() {
  const activeGames = await db.game.findMany({
    where: {
      status: GameStatus.WAITING,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  })
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-green-50 to-green-100">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-green-600">Slither.io Clone</h1>
          <p className="text-xl text-gray-600">Eat, grow, and survive!</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/play/new">
            <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Create New Game
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50"
            >
              Leaderboard
            </Button>
          </Link>
        </div>

        {activeGames.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Join Active Games</h2>
            <div className="grid gap-4">
              {activeGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/play/${game.id}`}
                  className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-green-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">{game.name}</span>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      Join Game
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
