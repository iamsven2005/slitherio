import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { getPlayerColor } from "@/lib/game-actions"
import type { Direction } from "@/hooks/use-game-controls"
import { GameStatus } from "@prisma/client"

// Get game state
export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId
    console.log(`GET request for game ${gameId}`)

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
      console.error(`Game ${gameId} not found`)
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
        color: getPlayerColor(snake.playerId),
        length: snake.length,
        segments: snake.segments.map((segment) => ({
          id: segment.id,
          x: segment.x,
          y: segment.y,
          order: segment.order,
        })),
      })),
    }

    // Get current player state if available
    let playerState = null
    const cookieStore = await cookies()
    const playerIdStr = cookieStore.get("playerId")?.value
    const playerId = playerIdStr

    if (playerId) {
      const playerInGame = game.players.find((p) => p.playerId === playerId)
      if (playerInGame) {
        playerState = {
          playerId: playerInGame.playerId,
          username: playerInGame.player.username,
          score: playerInGame.score,
          isAlive: playerInGame.isAlive,
          color: getPlayerColor(playerInGame.playerId),
        }
      }
    }

    return NextResponse.json({
      game: gameState,
      player: playerState,
    })
  } catch (error) {
    console.error("Error fetching game state:", error)
    return NextResponse.json({ error: "Failed to fetch game state" }, { status: 500 })
  }
}

// Update game state (for snake movement, direction changes, etc.)
export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId
    const body = await request.json()
    const { action, direction } = body

    console.log(`POST request for game ${gameId}, action: ${action}`)

    // Validate game exists
    const game = await db.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      console.error(`Game ${gameId} not found`)
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Get player ID from cookie
    const cookieStore = await cookies()
    const playerIdStr = cookieStore.get("playerId")?.value
    const playerId = playerIdStr ? playerIdStr : null

    if (!playerId) {
      console.error("Player ID not found in cookies")
      return NextResponse.json({ error: "Player ID not found" }, { status: 400 })
    }

    // Handle different actions
    switch (action) {
      case "move":
        // Update snake position
        const moveResult = await moveSnake(gameId, playerId)
        return NextResponse.json(moveResult)

      case "direction":
        // Update snake direction
        if (!direction) {
          return NextResponse.json({ error: "Direction is required" }, { status: 400 })
        }
        const directionResult = await updateDirection(playerId, direction as Direction)
        return NextResponse.json(directionResult)

      default:
        console.error(`Invalid action: ${action}`)
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating game state:", error)
    return NextResponse.json({ error: "Failed to update game state" }, { status: 500 })
  }
}

// Map to store player directions
const playerDirections = new Map<string, Direction>()

// Update snake direction
async function updateDirection(playerId: string, direction: Direction) {
  // Store the direction for this player
  playerDirections.set(playerId, direction)
  console.log(`API: Player ${playerId} direction updated to: ${direction}`)
  return { success: true, direction }
}

// Move snake
async function moveSnake(gameId: string, playerId: string) {
  console.log(`Moving snake for player ${playerId} in game ${gameId}`)

  // Get the player's snake
  const snake = await db.snake.findUnique({
    where: {
      playerId,
    },
    include: {
      segments: {
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!snake || snake.segments.length === 0) {
    console.error(`Snake not found for player ${playerId}`)
    return { success: false, error: "Snake not found" }
  }

  // Get the current direction for this player
  const direction = playerDirections.get(playerId) || "right"
  console.log(`Moving in direction: ${direction}`)

  // Get the head segment
  const head = snake.segments[0]
  console.log(`Head position before move: (${head.x}, ${head.y})`)

  // Calculate new position based on direction
  let newX = head.x
  let newY = head.y
  const moveAmount = 0.01 // Adjust speed as needed

  switch (direction) {
    case "up":
      newY = Math.max(0.01, head.y - moveAmount)
      break
    case "down":
      newY = Math.min(0.99, head.y + moveAmount)
      break
    case "left":
      newX = Math.max(0.01, head.x - moveAmount)
      break
    case "right":
      newX = Math.min(0.99, head.x + moveAmount)
      break
  }

  console.log(`New head position: (${newX}, ${newY})`)

  // Store old positions for each segment
  const oldPositions = snake.segments.map((segment) => ({
    id: segment.id,
    x: segment.x,
    y: segment.y,
    order: segment.order,
  }))

  // Update head position
  await db.snakeSegment.update({
    where: {
      id: head.id,
    },
    data: {
      x: newX,
      y: newY,
    },
  })

  // Move body segments to follow the head
  for (let i = 1; i < snake.segments.length; i++) {
    const segment = snake.segments[i]
    const prevPos = oldPositions[i - 1]

    await db.snakeSegment.update({
      where: {
        id: segment.id,
      },
      data: {
        x: prevPos.x,
        y: prevPos.y,
      },
    })
  }

  // Update lastMoved timestamp
  await db.snake.update({
    where: {
      id: snake.id,
    },
    data: {
      lastMoved: new Date(),
    },
  })

  // Check for collisions with food
  const foods = await db.food.findMany({
    where: {
      gameId,
    },
  })

  // Flag to track if food was eaten
  let foodEaten = false

  // Check for food collisions and handle growth
  for (const food of foods) {
    const distance = Math.sqrt(Math.pow(newX - food.x, 2) + Math.pow(newY - food.y, 2))
    const collisionThreshold = 0.02 // Adjust as needed

    if (distance < collisionThreshold) {
      console.log(`Food collision detected at (${food.x}, ${food.y}), distance: ${distance}`)
      // Snake ate food - handle growth
      await handleSnakeGrowth(snake.id, playerId, food.id, gameId)
      foodEaten = true
      break
    }
  }

  // Only check for collisions if no food was eaten
  // This prevents the snake from dying immediately after eating
  let isDead = false
  if (!foodEaten) {
    isDead = await checkCollisions(gameId, playerId, newX, newY)
  }

  if (isDead) {
    console.log(`Player ${playerId} died`)
    return { success: false, dead: true }
  }

  return { success: true }
}

// Handle snake growth when eating food
async function handleSnakeGrowth(snakeId: string, playerId: string, foodId: string, gameId: string) {
  console.log(`Growing snake ${snakeId} for player ${playerId}`)

  // Get the snake with segments
  const snake = await db.snake.findUnique({
    where: {
      id: snakeId,
    },
    include: {
      segments: {
        orderBy: {
          order: "desc", // Get segments in reverse order (tail first)
        },
      },
    },
  })

  if (!snake) {
    console.error(`Snake ${snakeId} not found`)
    return
  }

  // Get the player in game record
  const playerInGame = await db.playerInGame.findFirst({
    where: {
      gameId,
      playerId,
    },
  })

  if (!playerInGame) {
    console.error(`Player ${playerId} not found in game ${gameId}`)
    return
  }

  // Delete the eaten food
  await db.food.delete({
    where: {
      id: foodId,
    },
  })

  // Create a new food
  await db.food.create({
    data: {
      gameId,
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
    },
  })

  // Get the last segment (tail)
  const tail = snake.segments[0] // First element because we sorted by order desc
  console.log(`Adding new segment at tail position: (${tail.x}, ${tail.y})`)

  // Add a new segment at the tail position with a slight offset to prevent collision
  // The offset is in the opposite direction of movement to ensure it's behind the tail
  await db.snakeSegment.create({
    data: {
      snakeId: snake.id,
      x: tail.x,
      y: tail.y,
      order: snake.segments[0].order + 1, // New segment goes at the end (highest order)
    },
  })

  // Update snake length
  await db.snake.update({
    where: {
      id: snake.id,
    },
    data: {
      length: snake.length + 1,
    },
  })

  // Update player score
  await db.playerInGame.update({
    where: {
      id: playerInGame.id,
    },
    data: {
      score: playerInGame.score + 10, // 10 points per food
    },
  })

  // Also update the player's total score
  await db.player.update({
    where: {
      id: playerId,
    },
    data: {
      score: {
        increment: 10,
      },
    },
  })

  console.log(`Snake growth complete, new length: ${snake.length + 1}`)
}

// Check for collisions with other snakes or boundaries
async function checkCollisions(gameId: string, playerId: string, headX: number, headY: number) {
  // Check boundary collision
  if (headX <= 0 || headX >= 1 || headY <= 0 || headY >= 1) {
    console.log(`Boundary collision detected at (${headX}, ${headY})`)
    await handlePlayerDeath(gameId, playerId)
    return true
  }

  // Get the player's snake
  const playerSnake = await db.snake.findUnique({
    where: {
      playerId,
    },
    include: {
      segments: true,
    },
  })

  if (!playerSnake) return false

  // Check for self-collision (except head and the next few segments)
  // Skip the first 3 segments to prevent false collisions after turning
  for (let i = 3; i < playerSnake.segments.length; i++) {
    const segment = playerSnake.segments[i]
    const distance = Math.sqrt(Math.pow(headX - segment.x, 2) + Math.pow(headY - segment.y, 2))
    const collisionThreshold = 0.01 // Even smaller threshold to prevent false collisions

    if (distance < collisionThreshold) {
      console.log(
        `Self-collision detected: head at (${headX}, ${headY}), segment at (${segment.x}, ${segment.y}), distance: ${distance}`,
      )
      await handlePlayerDeath(gameId, playerId)
      return true
    }
  }

  // Get all other snakes in the game
  const otherSnakes = await db.snake.findMany({
    where: {
      player: {
        PlayerInGame: {
          some: {
            gameId,
            playerId: {
              not: playerId,
            },
            isAlive: true,
          },
        },
      },
    },
    include: {
      segments: true,
    },
  })

  // Check for collision with other snakes
  for (const otherSnake of otherSnakes) {
    for (const segment of otherSnake.segments) {
      const distance = Math.sqrt(Math.pow(headX - segment.x, 2) + Math.pow(headY - segment.y, 2))
      const collisionThreshold = 0.015 // Adjust as needed

      if (distance < collisionThreshold) {
        console.log(
          `Collision with other snake detected: head at (${headX}, ${headY}), segment at (${segment.x}, ${segment.y}), distance: ${distance}`,
        )
        await handlePlayerDeath(gameId, playerId)
        return true
      }
    }
  }

  return false
}

// Handle player death
async function handlePlayerDeath(gameId: string, playerId: string) {
  console.log(`Handling death for player ${playerId} in game ${gameId}`)

  // Mark player as not alive
  await db.playerInGame.updateMany({
    where: {
      gameId,
      playerId,
    },
    data: {
      isAlive: false,
    },
  })

  // Check if all players are dead
  const alivePlayers = await db.playerInGame.count({
    where: {
      gameId,
      isAlive: true,
    },
  })

  console.log(`Alive players remaining: ${alivePlayers}`)

  if (alivePlayers === 0) {
    // End the game
    await db.game.update({
      where: {
        id: gameId,
      },
      data: {
        status: GameStatus.FINISHED,
        endedAt: new Date(),
      },
    })
    console.log(`Game ${gameId} finished - all players dead`)
  }
}
