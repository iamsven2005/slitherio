"use client"

import { useState, useEffect } from "react"
import { getGameState, moveSnake } from "@/lib/game-actions"

export interface GameState {
  id: number
  name: string
  status: string
  playerCount: number
  foods: {
    id: number
    x: number
    y: number
    size: number
  }[]
  snakes: {
    id: number
    playerId: number
    color: string
    length: number
    segments: {
      id: number
      x: number
      y: number
      order: number
    }[]
  }[]
}

export interface PlayerState {
  playerId: number
  username: string
  score: number
  isAlive: boolean
  color: string
}

export function useGameState(gameId: number) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout

    const fetchGameState = async () => {
      try {
        const { game, player } = await getGameState(gameId)

        if (isMounted) {
          setGameState(game)
          setPlayerState(player)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch game state")
          console.error("Error fetching game state:", err)
        }
      }
    }

    // Initial fetch
    fetchGameState()

    // Set up polling interval - using polling instead of WebSockets for now
    intervalId = setInterval(fetchGameState, 200) // Faster polling for smoother updates

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [gameId])

  // Separate effect for snake movement to avoid dependency issues
  useEffect(() => {
    let moveIntervalId: NodeJS.Timeout

    if (playerState?.isAlive) {
      moveIntervalId = setInterval(async () => {
        try {
          await moveSnake(gameId)
        } catch (err) {
          console.error("Error moving snake:", err)
        }
      }, 100) // Move more frequently for smoother movement
    }

    return () => {
      if (moveIntervalId) {
        clearInterval(moveIntervalId)
      }
    }
  }, [gameId, playerState?.isAlive])

  return { gameState, playerState, error }
}
