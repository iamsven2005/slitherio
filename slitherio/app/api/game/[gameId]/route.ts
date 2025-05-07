import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Get game state
export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = Number.parseInt(params.gameId)

    // Get game with players, foods, and snakes
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        foods: true,
      },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Get all snakes for this game
    const snakes = await db.snake.findMany({
      where: {
        player: {
          PlayerInGame: {
            some: {
              gameId,
            },
          },
        },
      },
      include: {
        segments: true,
      },
    })

    // Format game state for client
    const gameState = {
      id: game.id,
      name: game.name,
      status: game.status,
      playerCount: game.players.length,
      foods: game.foods.map((food) => ({
        id: food.id,
        x: food.x,
        y: food.y,
        size: food.size,
      })),
      snakes: snakes.map((snake) => ({
        id: snake.id,
        playerId: snake.playerId,
        length: snake.length,
        segments: snake.segments.map((segment) => ({
          id: segment.id,
          x: segment.x,
          y: segment.y,
          order: segment.order,
        })),
      })),
    }

    return NextResponse.json({ game: gameState })
  } catch (error) {
    console.error("Error fetching game state:", error)
    return NextResponse.json({ error: "Failed to fetch game state" }, { status: 500 })
  }
}

// Update game state (for snake movement, direction changes, etc.)
export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = Number.parseInt(params.gameId)
    const { playerId, action, direction } = await request.json()

    // Validate game exists
    const game = await db.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      case "move":
        // In a real implementation, this would update the snake's position
        // based on its current direction and check for collisions
        break

      case "direction":
        // Update snake direction
        // This would be stored in a real implementation
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating game state:", error)
    return NextResponse.json({ error: "Failed to update game state" }, { status: 500 })
  }
}
