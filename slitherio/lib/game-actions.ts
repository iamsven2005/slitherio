"use server"

import { db } from "@/lib/db"
import { GameStatus } from "@prisma/client"
import { cookies } from "next/headers"
import type { Direction } from "@/hooks/use-game-controls"

// Create a Map to store player directions that persists between requests
// Note: In a production app, you'd use Redis or another persistent store
const playerDirections = new Map<number, Direction>()

// Create a Map to store player colors
const playerColors = new Map<number, string>()

// Create a new game or join existing one with the same name
export async function createGame(username: string, gameName: string, snakeColor = "#22c55e") {
  // Create or find player
  const player = await db.player.upsert({
    where: { username },
    update: {},
    create: {
      username,
      score: 0,
    },
  })

  // Store the player's color preference
  playerColors.set(player.id, snakeColor)

  // Check if a game with this name already exists and is in WAITING status
  const existingGame = await db.game.findFirst({
    where: {
      name: gameName,
      status: GameStatus.WAITING,
    },
  })

  let game

  if (existingGame) {
    // Join the existing game
    console.log(`Joining existing game: ${gameName} (ID: ${existingGame.id})`)

    // Check if player is already in the game
    const existingPlayer = await db.playerInGame.findFirst({
      where: {
        gameId: existingGame.id,
        playerId: player.id,
      },
    })

    if (!existingPlayer) {
      // Add player to game
      await db.playerInGame.create({
        data: {
          gameId: existingGame.id,
          playerId: player.id,
          isAlive: true,
          score: 0,
        },
      })
    }

    game = existingGame
  } else {
    // Create a new game
    console.log(`Creating new game: ${gameName}`)
    game = await db.game.create({
      data: {
        name: gameName,
        status: GameStatus.WAITING,
        players: {
          create: {
            playerId: player.id,
            isAlive: true,
            score: 0,
          },
        },
        // Add some initial food
        foods: {
          create: Array.from({ length: 20 }).map(() => ({
            x: Math.random(),
            y: Math.random(),
            size: 0.5 + Math.random() * 1.5,
          })),
        },
      },
    })
  }

  // Set initial direction to right
  playerDirections.set(player.id, "right")

  // Store player ID in cookie - properly await cookies
  const cookieStore = await cookies()
  await cookieStore.set("playerId", player.id.toString(), {
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 1 day
  })

  return game
}

// Join an existing game
export async function joinGame(username: string, gameId: number, snakeColor = "#22c55e") {
  // Create or find player
  const player = await db.player.upsert({
    where: { username },
    update: {},
    create: {
      username,
      score: 0,
    },
  })

  // Store the player's color preference
  playerColors.set(player.id, snakeColor)

  // Check if game exists
  const game = await db.game.findUnique({
    where: { id: gameId },
  })

  if (!game) {
    throw new Error("Game not found")
  }

  // Set initial direction to right
  playerDirections.set(player.id, "right")

  // Check if player is already in the game
  const existingPlayer = await db.playerInGame.findFirst({
    where: {
      gameId,
      playerId: player.id,
    },
  })

  if (existingPlayer) {
    // If player exists but is dead, revive them
    if (!existingPlayer.isAlive) {
      await db.playerInGame.update({
        where: { id: existingPlayer.id },
        data: {
          isAlive: true,
          score: 0,
        },
      })

      // Delete old snake if it exists
      const oldSnake = await db.snake.findUnique({
        where: { playerId: player.id },
      })

      if (oldSnake) {
        // Delete all segments first (due to foreign key constraints)
        await db.snakeSegment.deleteMany({
          where: { snakeId: oldSnake.id },
        })

        // Then delete the snake
        await db.snake.delete({
          where: { id: oldSnake.id },
        })
      }

      // Create a new snake for the player
      await db.snake.create({
        data: {
          playerId: player.id,
          length: 1,
          segments: {
            create: {
              x: Math.random(),
              y: Math.random(),
              order: 0, // Head
            },
          },
        },
      })
    }
  } else {
    // Add player to game
    await db.playerInGame.create({
      data: {
        gameId,
        playerId: player.id,
        isAlive: true,
        score: 0,
      },
    })

    // If game is active, create a snake for the player
    if (game.status === GameStatus.ACTIVE) {
      await db.snake.create({
        data: {
          playerId: player.id,
          length: 1,
          segments: {
            create: {
              x: Math.random(),
              y: Math.random(),
              order: 0, // Head
            },
          },
        },
      })
    }
  }

  // Store player ID in cookie - properly await cookies
  const cookieStore = await cookies()
  await cookieStore.set("playerId", player.id.toString(), {
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 1 day
  })

  return { success: true }
}

// Get player color
export function getPlayerColor(playerId: number): string {
  return playerColors.get(playerId) || "#22c55e" // Default to green if no color is set
}

// Start the game
export async function startGame(gameId: number) {
  // First check if the game exists and is in WAITING status
  const existingGame = await db.game.findUnique({
    where: { id: gameId },
  })

  if (!existingGame) {
    throw new Error("Game not found")
  }

  if (existingGame.status !== GameStatus.WAITING) {
    // Game already started, just return it
    return existingGame
  }

  // Get the player ID from cookie
  const cookieStore = await cookies()
  const playerIdStr = cookieStore.get("playerId")?.value
  const playerId = playerIdStr ? Number.parseInt(playerIdStr) : null

  if (!playerId) {
    throw new Error("Player not found")
  }

  // Check if player is in the game
  const playerInGame = await db.playerInGame.findFirst({
    where: {
      gameId,
      playerId,
    },
  })

  if (!playerInGame) {
    throw new Error("You are not in this game")
  }

  // Update game status
  const game = await db.game.update({
    where: { id: gameId },
    data: {
      status: GameStatus.ACTIVE,
      startedAt: new Date(),
    },
    include: {
      players: {
        include: {
          player: true,
        },
      },
    },
  })

  // Create a snake for each player
  for (const playerInGame of game.players) {
    // Check if player already has a snake
    const existingSnake = await db.snake.findUnique({
      where: {
        playerId: playerInGame.playerId,
      },
    })

    if (!existingSnake) {
      // Create snake
      await db.snake.create({
        data: {
          playerId: playerInGame.playerId,
          length: 1,
          segments: {
            create: {
              x: Math.random(),
              y: Math.random(),
              order: 0, // Head
            },
          },
        },
      })

      // Set initial direction to right
      playerDirections.set(playerInGame.playerId, "right")
    }
  }

  return game
}

// Get current game state
export async function getGameState(gameId: number) {
  // Get player ID from cookie - properly await cookies
  const cookieStore = await cookies()
  const playerIdStr = cookieStore.get("playerId")?.value
  const playerId = playerIdStr ? Number.parseInt(playerIdStr) : null

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
    throw new Error("Game not found")
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

  return { game: gameState, player: playerState }
}

// Update snake direction
export async function updateDirection(direction: Direction) {
  const cookieStore = await cookies()
  const playerIdStr = cookieStore.get("playerId")?.value
  const playerId = playerIdStr ? Number.parseInt(playerIdStr) : null

  if (!playerId) {
    throw new Error("Player not found")
  }

  // Store the direction for this player
  playerDirections.set(playerId, direction)

  console.log(`Player ${playerId} direction updated to: ${direction}`)

  return { success: true, direction }
}

// Move snake
export async function moveSnake(gameId: number) {
  // Get player ID from cookie
  const cookieStore = await cookies()
  const playerIdStr = cookieStore.get("playerId")?.value
  const playerId = playerIdStr ? Number.parseInt(playerIdStr) : null

  if (!playerId) {
    throw new Error("Player not found")
  }

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
    return { success: false, error: "Snake not found" }
  }

  // Get the current direction for this player
  const direction = playerDirections.get(playerId) || "right"

  // Log the direction for debugging
  console.log(`Moving snake for player ${playerId} in direction: ${direction}`)

  // Get the head segment
  const head = snake.segments[0]

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

  // Store old positions for each segment
  const oldPositions = snake.segments.map((segment) => ({
    id: segment.id,
    x: segment.x,
    y: segment.y,
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

  // Check for food collisions and handle growth
  for (const food of foods) {
    const distance = Math.sqrt(Math.pow(newX - food.x, 2) + Math.pow(newY - food.y, 2))
    const collisionThreshold = 0.02 // Adjust as needed

    if (distance < collisionThreshold) {
      // Snake ate food - handle growth
      await handleSnakeGrowth(snake.id, playerId, food.id, gameId)
      break
    }
  }

  // Check for collisions with other snakes or boundaries
  const isDead = await checkCollisions(gameId, playerId, newX, newY)

  if (isDead) {
    return { success: false, dead: true }
  }

  return { success: true }
}

// Handle snake growth when eating food
async function handleSnakeGrowth(snakeId: number, playerId: number, foodId: number, gameId: number) {
  // Get the snake with segments
  const snake = await db.snake.findUnique({
    where: {
      id: snakeId,
    },
    include: {
      segments: {
        orderBy: {
          order: "desc", // Get tail first
        },
      },
    },
  })

  if (!snake) return

  // Get the player in game record
  const playerInGame = await db.playerInGame.findFirst({
    where: {
      gameId,
      playerId,
    },
  })

  if (!playerInGame) return

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
  const tail = snake.segments[0]

  // Add a new segment at the tail position
  await db.snakeSegment.create({
    data: {
      snakeId: snake.id,
      x: tail.x,
      y: tail.y,
      order: snake.segments.length, // New segment goes at the end
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
}

// Check for collisions with other snakes or boundaries
async function checkCollisions(gameId: number, playerId: number, headX: number, headY: number) {
  // Check boundary collision
  if (headX <= 0 || headX >= 1 || headY <= 0 || headY >= 1) {
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

  // Check for self-collision (except head)
  for (let i = 1; i < playerSnake.segments.length; i++) {
    const segment = playerSnake.segments[i]
    const distance = Math.sqrt(Math.pow(headX - segment.x, 2) + Math.pow(headY - segment.y, 2))
    const collisionThreshold = 0.015 // Adjust as needed

    if (distance < collisionThreshold) {
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
        await handlePlayerDeath(gameId, playerId)
        return true
      }
    }
  }

  return false
}

// Handle player death
async function handlePlayerDeath(gameId: number, playerId: number) {
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
  }
}
