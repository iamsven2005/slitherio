"use client"

import { useState, useEffect } from "react"

export interface GameState {
  id: string
  name: string
  status: string
  playerCount: number
  foods: {
    id: string
    x: number
    y: number
    size: number
  }[]
  snakes: {
    id: string
    playerId: string
    color: string
    length: number
    segments: {
      id: string
      x: number
      y: number
      order: number
    }[]
  }[]
}

export interface PlayerState {
  playerId: string
  username: string
  score: number
  isAlive: boolean
  color: string
}

export function useGameState(gameId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout

    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/game/${gameId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch game state: ${response.statusText}`)
        }

        const data = await response.json()

        if (isMounted) {
          setGameState(data.game)
          // Check if player data is included in the response
          if (data.player) {
            setPlayerState(data.player)
          }
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
          const response = await fetch(`/api/game/${gameId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "move",
            }),
          })

          if (!response.ok) {
            console.error(`Move request failed: ${response.statusText}`)
          }
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
