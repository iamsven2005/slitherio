"use client"

import { useState, useEffect } from "react"
import { useGameControls } from "@/hooks/use-game-controls"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DebugPanelProps {
  gameId: string
  playerId?: string
}

export default function DebugPanel({ gameId, playerId }: DebugPanelProps) {
  const { direction } = useGameControls()
  const [logs, setLogs] = useState<string[]>([])

  // Add a log entry
  const addLog = (message: string) => {
    setLogs((prevLogs) => {
      const newLogs = [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]
      // Keep only the last 10 logs
      return newLogs.slice(-10)
    })
  }

  // Log direction changes
  useEffect(() => {
    addLog(`Direction changed to: ${direction}`)
  }, [direction])

  return (
    <Card className="mt-4 bg-gray-900 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs space-y-1">
          <div>Game ID: {gameId}</div>
          <div>Player ID: {playerId || "Unknown"}</div>
          <div>Current Direction: {direction}</div>
          <div className="mt-2 border-t border-gray-700 pt-2">
            <div className="font-semibold">Event Log:</div>
            {logs.map((log, index) => (
              <div key={index} className="text-gray-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
