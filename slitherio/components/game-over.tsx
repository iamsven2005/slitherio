"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { joinGame } from "@/lib/game-actions"

interface GameOverProps {
  score: number
  username: string
  gameId: string
}

export default function GameOver({ score, username, gameId }: GameOverProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePlayAgain = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Rejoin the same game with the same username
      // Note: We're not passing a color here, so it will use the last selected color
      await joinGame(username, gameId)

      // Force a hard refresh of the page to reset all state
      window.location.href = `/play/${gameId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart game")
      console.error("Error restarting game:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-red-600 text-white">
          <CardTitle className="text-2xl">Game Over!</CardTitle>
          <CardDescription className="text-white/80">Your snake has died</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="text-center space-y-4">
            <p className="text-lg">
              <span className="font-bold">{username}</span>, your final score is:
            </p>
            <p className="text-4xl font-bold text-green-600">{score} points</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePlayAgain} disabled={isLoading}>
            {isLoading ? "Restarting..." : "Play Again"}
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
