"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { updateDirection } from "@/lib/game-actions"

export type Direction = "up" | "down" | "left" | "right"

export function useGameControls() {
  const [direction, setDirection] = useState<Direction>("right")
  const directionRef = useRef<Direction>("right")

  // Update direction in state and ref
  const changeDirection = useCallback((newDirection: Direction) => {
    // Prevent 180-degree turns (which cause immediate self-collision)
    if (
      (directionRef.current === "up" && newDirection === "down") ||
      (directionRef.current === "down" && newDirection === "up") ||
      (directionRef.current === "left" && newDirection === "right") ||
      (directionRef.current === "right" && newDirection === "left")
    ) {
      return
    }

    setDirection(newDirection)
    directionRef.current = newDirection

    // Send direction update to server immediately
    updateDirection(newDirection).catch(console.error)
  }, [])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault() // Prevent default behavior (like scrolling)

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          console.log("UP key pressed")
          changeDirection("up")
          break
        case "ArrowDown":
        case "s":
        case "S":
          console.log("DOWN key pressed")
          changeDirection("down")
          break
        case "ArrowLeft":
        case "a":
        case "A":
          console.log("LEFT key pressed")
          changeDirection("left")
          break
        case "ArrowRight":
        case "d":
        case "D":
          console.log("RIGHT key pressed")
          changeDirection("right")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [changeDirection])

  return { direction, setDirection: changeDirection }
}
