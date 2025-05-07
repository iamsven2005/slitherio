"use client"

import { useEffect, useRef, useState } from "react"
import { useGameState } from "@/hooks/use-game-state"
import { useGameControls } from "@/hooks/use-game-controls"
import GameOver from "./game-over"

interface GameCanvasProps {
  gameId: number
}

export default function GameCanvas({ gameId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { gameState, playerState } = useGameState(gameId)
  const { direction } = useGameControls()
  const [showGameOver, setShowGameOver] = useState(false)

  // Set canvas dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(window.innerHeight - 150, container.clientWidth * 0.75),
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Check if player is dead
  useEffect(() => {
    if (playerState && !playerState.isAlive && !showGameOver) {
      setShowGameOver(true)
    }
  }, [playerState, showGameOver])

  // Game rendering
  useEffect(() => {
    if (!canvasRef.current || !gameState) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    // Draw grid
    ctx.strokeStyle = "#222"
    ctx.lineWidth = 1
    const gridSize = 40

    for (let x = 0; x < dimensions.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, dimensions.height)
      ctx.stroke()
    }

    for (let y = 0; y < dimensions.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(dimensions.width, y)
      ctx.stroke()
    }

    // Draw food
    gameState.foods.forEach((food) => {
      ctx.beginPath()
      ctx.arc(food.x * dimensions.width, food.y * dimensions.height, food.size * 8, 0, Math.PI * 2)
      ctx.fillStyle = "#f59e0b"
      ctx.fill()
    })

    // Draw snakes
    gameState.snakes.forEach((snake) => {
      const isCurrentPlayer = snake.playerId === playerState?.playerId
      const snakeColor = snake.color || (isCurrentPlayer ? "#22c55e" : "#ef4444")
      const snakeHeadColor = isCurrentPlayer
        ? adjustColor(snakeColor, 20) // Brighter for head
        : adjustColor(snakeColor, 20)

      // Sort segments by order (head first)
      const sortedSegments = [...snake.segments].sort((a, b) => a.order - b.order)

      // Draw segments
      sortedSegments.forEach((segment, index) => {
        ctx.beginPath()
        const radius = isCurrentPlayer ? 12 : 10
        ctx.arc(segment.x * dimensions.width, segment.y * dimensions.height, radius, 0, Math.PI * 2)

        // Head is brighter
        if (index === 0) {
          ctx.fillStyle = snakeHeadColor
        } else {
          ctx.fillStyle = snakeColor
        }

        ctx.fill()

        // Draw eyes on head
        if (index === 0) {
          ctx.fillStyle = "#fff"

          // Left eye
          ctx.beginPath()
          ctx.arc(segment.x * dimensions.width - 3, segment.y * dimensions.height - 3, 3, 0, Math.PI * 2)
          ctx.fill()

          // Right eye
          ctx.beginPath()
          ctx.arc(segment.x * dimensions.width + 3, segment.y * dimensions.height - 3, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    })

    // Draw score and player count
    ctx.fillStyle = "#fff"
    ctx.font = "16px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Players: ${gameState.playerCount}`, 20, 30)

    if (playerState) {
      ctx.textAlign = "right"
      ctx.fillText(`Score: ${playerState.score}`, dimensions.width - 20, 30)
    }
  }, [gameState, playerState, dimensions, direction])

  // Helper function to adjust color brightness
  function adjustColor(color: string, amount: number): string {
    // Convert hex to RGB
    let r = Number.parseInt(color.substring(1, 3), 16)
    let g = Number.parseInt(color.substring(3, 5), 16)
    let b = Number.parseInt(color.substring(5, 7), 16)

    // Adjust brightness
    r = Math.min(255, Math.max(0, r + amount))
    g = Math.min(255, Math.max(0, g + amount))
    b = Math.min(255, Math.max(0, b + amount))

    // Convert back to hex
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }

  // Show game over screen if player is dead
  if (showGameOver && playerState) {
    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border border-gray-800 bg-black rounded-lg shadow-lg"
        />
        <GameOver score={playerState.score} username={playerState.username} gameId={gameId} />
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="border border-gray-800 bg-black rounded-lg shadow-lg"
    />
  )
}
