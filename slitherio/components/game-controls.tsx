"use client"

import { useGameControls } from "@/hooks/use-game-controls"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function GameControls() {
  const { direction, setDirection } = useGameControls()
  const [activeDirection, setActiveDirection] = useState<string>("right")

  // Update active direction when direction changes
  useEffect(() => {
    setActiveDirection(direction)
  }, [direction])

  // Handle direction button clicks
  const handleDirectionClick = (newDirection: "up" | "down" | "left" | "right") => {
    console.log(`Button clicked: ${newDirection}`)
    setDirection(newDirection)
    setActiveDirection(newDirection)
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-4">
      <div className="text-white text-sm">
        Current direction: <span className="font-bold capitalize">{activeDirection}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div></div>
        <Button
          variant="default"
          size="icon"
          onClick={() => handleDirectionClick("up")}
          className={
            activeDirection === "up" ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700 text-white"
          }
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
        <div></div>

        <Button
          variant="default"
          size="icon"
          onClick={() => handleDirectionClick("left")}
          className={
            activeDirection === "left" ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700 text-white"
          }
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={() => handleDirectionClick("down")}
          className={
            activeDirection === "down" ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700 text-white"
          }
        >
          <ArrowDown className="h-6 w-6" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={() => handleDirectionClick("right")}
          className={
            activeDirection === "right" ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700 text-white"
          }
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="text-white text-xs mt-2">You can also use arrow keys or WASD to control your snake</div>
    </div>
  )
}
