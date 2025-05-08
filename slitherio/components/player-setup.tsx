"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createGame, joinGame, startGame } from "@/lib/game-actions"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface PlayerSetupProps {
  gameId?: string
  isNewGame: boolean
}

// Predefined color options
const colorOptions = [
  { value: "#22c55e", label: "Green", bgClass: "bg-green-500" },
  { value: "#ef4444", label: "Red", bgClass: "bg-red-500" },
  { value: "#3b82f6", label: "Blue", bgClass: "bg-blue-500" },
  { value: "#eab308", label: "Yellow", bgClass: "bg-yellow-500" },
  { value: "#8b5cf6", label: "Purple", bgClass: "bg-purple-500" },
  { value: "#ec4899", label: "Pink", bgClass: "bg-pink-500" },
]

export default function PlayerSetup({ gameId, isNewGame }: PlayerSetupProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [gameName, setGameName] = useState("")
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)
  const [isLoading, setIsLoading] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isNewGame) {
        if (!username || !gameName) {
          throw new Error("Username and game name are required")
        }
        const newGame = await createGame(username, gameName, selectedColor)
        router.push(`/play/${newGame.id}`)
      } else {
        if (!username || !gameId) {
          throw new Error("Username is required")
        }
        await joinGame(username, gameId, selectedColor)
        setIsJoined(true)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartGame = async () => {
    if (!gameId) return

    setIsLoading(true)
    try {
      await startGame(gameId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isNewGame ? "Create New Game" : "Join Game"}</CardTitle>
        <CardDescription>
          {isNewGame
            ? "Create a new game and invite friends to play"
            : isJoined
              ? "Waiting for the game to start..."
              : "Enter your username to join this game"}
        </CardDescription>
      </CardHeader>
      {!isJoined ? (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Your Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            {isNewGame && (
              <div className="space-y-2">
                <label htmlFor="gameName" className="text-sm font-medium">
                  Game Name
                </label>
                <Input
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter a name for your game"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Snake Color</label>
              <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="grid grid-cols-3 gap-2">
                {colorOptions.map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={color.value} id={color.value} className="sr-only" />
                    <Label
                      htmlFor={color.value}
                      className={`flex items-center justify-center p-2 rounded-md cursor-pointer border-2 ${
                        selectedColor === color.value ? "border-black" : "border-transparent"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${color.bgClass} mr-2`}></div>
                      <span className="text-sm">{color.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? "Loading..." : isNewGame ? "Create Game" : "Join Game"}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="space-y-4">
          <p className="text-center">
            You've joined as <strong>{username}</strong>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            The game will start automatically when at least 2 players join, or you can start it manually.
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleStartGame} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Game Now"}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
