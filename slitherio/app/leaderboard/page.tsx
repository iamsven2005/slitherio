import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LeaderboardPage() {
  const topPlayers = await db.player.findMany({
    orderBy: {
      score: "desc",
    },
    take: 20,
  })

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-gradient-to-b from-green-50 to-green-100">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center text-green-600 mb-8">Leaderboard</h1>

        <Card>
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="text-xl">Top Players</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-green-100">
                <tr>
                  <th className="py-3 px-4 text-left">Rank</th>
                  <th className="py-3 px-4 text-left">Player</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player, index) => (
                  <tr key={player.id} className="border-t border-gray-200">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{player.username}</td>
                    <td className="py-3 px-4 text-right">{player.score}</td>
                  </tr>
                ))}
                {topPlayers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No players yet. Be the first to play!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
