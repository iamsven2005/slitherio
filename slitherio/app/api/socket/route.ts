import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Socket as NetSocket } from "net"
import { GameStatus } from "@prisma/client"
import { db } from "@/lib/db"

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const io = new SocketIOServer(res.socket.server)
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Join a game room
      socket.on("join-game", (gameId: string) => {
        socket.join(`game-${gameId}`)
        console.log(`Client ${socket.id} joined game ${gameId}`)
      })

      // Leave a game room
      socket.on("leave-game", (gameId: string) => {
        socket.leave(`game-${gameId}`)
        console.log(`Client ${socket.id} left game ${gameId}`)
      })

      // Handle snake movement
      socket.on("move-snake", async (data: { gameId: string; playerId: string; direction: string }) => {
        try {
          const { gameId, playerId, direction } = data

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

          if (!snake) return

          // Get the head segment (order 0)
          const head = snake.segments[0]
          if (!head) return

          // Calculate new position based on direction
          let newX = head.x
          let newY = head.y
          const moveAmount = 0.01 // Adjust speed as needed

          switch (direction) {
            case "up":
              newY = Math.max(0, head.y - moveAmount)
              break
            case "down":
              newY = Math.min(1, head.y + moveAmount)
              break
            case "left":
              newX = Math.max(0, head.x - moveAmount)
              break
            case "right":
              newX = Math.min(1, head.x + moveAmount)
              break
          }

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
            const prevSegment = snake.segments[i - 1]

            await db.snakeSegment.update({
              where: {
                id: segment.id,
              },
              data: {
                x: prevSegment.x,
                y: prevSegment.y,
              },
            })
          }

          // Check for collisions with food
          const foods = await db.food.findMany({
            where: {
              gameId,
            },
          })

          for (const food of foods) {
            const distance = Math.sqrt(Math.pow(newX - food.x, 2) + Math.pow(newY - food.y, 2))
            const collisionThreshold = 0.02 // Adjust as needed

            if (distance < collisionThreshold) {
              // Snake ate food
              await handleFoodCollision(gameId, playerId, food.id)
              break
            }
          }

          // Check for collisions with other snakes
          await checkSnakeCollisions(gameId, playerId, newX, newY)

          // Emit updated snake position to all clients in the game
          io.to(`game-${gameId}`).emit("snake-moved", {
            snakeId: snake.id,
            playerId,
            segments: [{ x: newX, y: newY, order: 0 }, ...snake.segments.slice(1)],
          })
        } catch (error) {
          console.error("Error handling snake movement:", error)
        }
      })

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })
  }

  res.end()
}

// Handle food collision (snake growth)
async function handleFoodCollision(gameId: string, playerId: string, foodId: string) {
  try {
    // Get the player's snake
    const snake = await db.snake.findUnique({
      where: {
        playerId,
      },
      include: {
        segments: {
          orderBy: {
            order: "desc", // Get the tail first
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

    // Delete the food
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

    // Get the updated game state
    const updatedGame = await db.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        foods: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    })

    // Emit food eaten event to all clients in the game
    if (global.socketIo) {
      global.socketIo.to(`game-${gameId}`).emit("food-eaten", {
        playerId,
        foodId,
        newFood: updatedGame?.foods[updatedGame.foods.length - 1],
        score: playerInGame.score + 10,
      })
    }
  } catch (error) {
    console.error("Error handling food collision:", error)
  }
}

// Check for collisions with other snakes
async function checkSnakeCollisions(gameId: string, playerId: string, headX: number, headY: number) {
  try {
    // Get all snakes in the game except the current player's
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

    // Get the player's snake
    const playerSnake = await db.snake.findUnique({
      where: {
        playerId,
      },
      include: {
        segments: true,
      },
    })

    if (!playerSnake) return

    // Get the player in game record
    const playerInGame = await db.playerInGame.findFirst({
      where: {
        gameId,
        playerId,
      },
    })

    if (!playerInGame) return

    // Check for self-collision (except head)
    for (let i = 1; i < playerSnake.segments.length; i++) {
      const segment = playerSnake.segments[i]
      const distance = Math.sqrt(Math.pow(headX - segment.x, 2) + Math.pow(headY - segment.y, 2))
      const collisionThreshold = 0.015 // Adjust as needed

      if (distance < collisionThreshold) {
        // Snake collided with itself
        await handleSnakeDeath(gameId, playerId, playerInGame.id)
        return
      }
    }

    // Check for collision with other snakes
    for (const otherSnake of otherSnakes) {
      for (const segment of otherSnake.segments) {
        const distance = Math.sqrt(Math.pow(headX - segment.x, 2) + Math.pow(headY - segment.y, 2))
        const collisionThreshold = 0.015 // Adjust as needed

        if (distance < collisionThreshold) {
          // Snake collided with another snake
          await handleSnakeDeath(gameId, playerId, playerInGame.id)
          return
        }
      }
    }

    // Check for boundary collision
    if (headX <= 0 || headX >= 1 || headY <= 0 || headY >= 1) {
      // Snake hit the boundary
      await handleSnakeDeath(gameId, playerId, playerInGame.id)
    }
  } catch (error) {
    console.error("Error checking snake collisions:", error)
  }
}

// Handle snake death
async function handleSnakeDeath(gameId: string, playerId: string, playerInGameId: string) {
  try {
    // Mark player as not alive
    await db.playerInGame.update({
      where: {
        id: playerInGameId,
      },
      data: {
        isAlive: false,
      },
    })

    // Get player score
    const playerInGame = await db.playerInGame.findUnique({
      where: {
        id: playerInGameId,
      },
    })

    if (!playerInGame) return

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

      // Emit game over event
      if (global.socketIo) {
        global.socketIo.to(`game-${gameId}`).emit("game-over", {
          gameId,
        })
      }
    }

    // Emit player died event
    if (global.socketIo) {
      global.socketIo.to(`game-${gameId}`).emit("player-died", {
        playerId,
        score: playerInGame.score,
      })
    }
  } catch (error) {
    console.error("Error handling snake death:", error)
  }
}
