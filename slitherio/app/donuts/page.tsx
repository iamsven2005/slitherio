//@ts-nocheck
"use client"

import { useState, useEffect, useRef, SetStateAction } from "react"

interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

interface Particle {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  originalX: number
  originalY: number
  char: string
  color: string
  trail: TrailPoint[]
  velocity: { x: number; y: number }
  lastCollisionTime: number
  lastSparkleHit: number
  magneticCharge: number
  stormVelocity: { x: number; y: number }
  residualCharge: number
  lastStormExposure: number
  supercharge: number
  lastSuperchargeTime: number
  superchargeLevel: number
  lastEnergyBurst: number
  stormExposureHistory: { timestamp: number; intensity: number; duration: number }[]
  resistanceLevel: number
  lastResistanceDecay: number
  totalStormExposures: number

}

interface Sparkle {
  id: number
  x: number
  y: number
  char: string
  color: string
  createdAt: number
  scale: number
  rotation: number
  velocityX: number
  velocityY: number
  generation: number
  hasTriggeredChain: boolean
  isBeingAttracted: boolean
  targetParticleId: number | null
  attractionStrength: number
}

interface Lightning {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  createdAt: number
  branches: { x: number; y: number }[]
}

interface EnergyWisp {
  id: number
  x: number
  y: number
  velocityX: number
  velocityY: number
  createdAt: number
  char: string
  color: string
  scale: number
  rotation: number
  targetX: number
  targetY: number
  isBeingAbsorbed: boolean
  absorptionStartTime: number
  targetParticleId: number | null
}

interface EnergyBurst {
  id: number
  x: number
  y: number
  createdAt: number
  scale: number
  rotation: number
  particles: { x: number; y: number; velocityX: number; velocityY: number; char: string }[]
}

interface ResidualRing {
  id: number
  centerX: number
  centerY: number
  radius: number
  maxRadius: number
  createdAt: number
  opacity: number
  color: string
}
type StatType = "chains" | "storms" | "absorptions" | "resistance" | "echoes"

interface Milestone {
  type: StatType
  required: number
  name: string
  description: string
}

interface MagneticStorm {
  isActive: boolean
  phase: "buildup" | "peak" | "cooldown"
  intensity: number
  startTime: number
  duration: number
  centerX: number
  centerY: number
  rotationSpeed: number
}

interface StormAftermath {
  isActive: boolean
  centerX: number
  centerY: number
  startTime: number
  duration: number
  intensity: number
}

interface StormEcho {
  id: number
  isActive: boolean
  centerX: number
  centerY: number
  startTime: number
  duration: number
  intensity: number
  radius: number
  maxRadius: number
  generation: number
  parentStormIntensity: number
}

export default function Component() {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [lightning, setLightning] = useState<Lightning[]>([])
  const [energyWisps, setEnergyWisps] = useState<EnergyWisp[]>([])
  const [energyBursts, setEnergyBursts] = useState<EnergyBurst[]>([])
  const [residualRings, setResidualRings] = useState<ResidualRing[]>([])
  const [magneticStorm, setMagneticStorm] = useState<MagneticStorm>({
    isActive: false,
    phase: "buildup",
    intensity: 0,
    startTime: 0,
    duration: 0,
    centerX: 0,
    centerY: 0,
    rotationSpeed: 0,
  })
  const [stormAftermath, setStormAftermath] = useState<StormAftermath>({
    isActive: false,
    centerX: 0,
    centerY: 0,
    startTime: 0,
    duration: 0,
    intensity: 0,
  })
  const [stormEchoes, setStormEchoes] = useState<StormEcho[]>([])
  const [echoCount, setEchoCount] = useState(0)
  const [chainReactionCount, setChainReactionCount] = useState(0)
  const [attractionCount, setAttractionCount] = useState(0)
  const [stormCount, setStormCount] = useState(0)
  const [absorptionCount, setAbsorptionCount] = useState(0)
  const [resistanceCount, setResistanceCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const donutRef = useRef<HTMLPreElement>(null)
  const sparkleIdRef = useRef(0)
  const lightningIdRef = useRef(0)
  const wispIdRef = useRef(0)
  const burstIdRef = useRef(0)
  const ringIdRef = useRef(0)
  const echoIdRef = useRef(0)
  const lastStormTime = useRef(0)
  const [unlockedVariations, setUnlockedVariations] = useState<string[]>(["donut"])
  const [currentVariation, setCurrentVariation] = useState("donut")
  const [newUnlocks, setNewUnlocks] = useState<string[]>([])


  const asciiVariations = {
    donut: `        .:::::.        
        .:::::::::::.      
      .::::::::::::::::    
     :::::::::::::::::::   
    :::::::::   :::::::::  
   ::::::::'     '::::::::: 
  ::::::::'       ':::::::: 
 ::::::::'         '::::::::
 ::::::::'         '::::::::
  ::::::::'       ':::::::: 
   ::::::::'     '::::::::: 
    :::::::::   :::::::::  
     :::::::::::::::::::   
      '::::::::::::::::    
        ':::::::::::'      
          '::::::'        `,

    star: `        ✦✧✦        
        ✧✦✧✦✧✦✧      
      ✦✧✦✧✦✧✦✧✦✧✦    
     ✧✦✧✦✧✦✧✦✧✦✧✦✧   
    ✦✧✦✧✦     ✦✧✦✧✦  
   ✧✦✧✦'         '✦✧✦✧ 
  ✦✧✦'           '✦✧✦ 
 ✧✦✧'             '✧✦✧
✦✧✦'             '✦✧✦
 ✧✦✧'           '✧✦✧ 
  ✦✧✦✧'         '✦✧✦✧ 
   ✧✦✧✦✧     ✧✦✧✦✧  
    ✦✧✦✧✦✧✦✧✦✧✦✧✦   
     ✧✦✧✦✧✦✧✦✧✦✧    
       ✦✧✦✧✦✧✦      
         ✧✦✧        `,

    diamond: `        ◆◇◆        
        ◇◆◇◆◇◆◇      
      ◆◇◆◇◆◇◆◇◆◇◆    
     ◇◆◇◆◇◆◇◆◇◆◇◆◇   
    ◆◇◆◇◆     ◆◇◆◇◆  
   ◇◆◇◆'         '◆◇◆◇ 
  ◆◇◆'           '◆◇◆ 
 ◇◆◇'             '◇◆◇
◆◇◆'             '◆◇◆
  ◇◆◇'           '◇◆◇ 
   ◆◇◆◇'         '◇◆◇◆ 
    ◇◆◇◆◇     ◇◆◇◆◇  
     ◆◇◆◇◆◇◆◇◆◇◆◇◆   
      ◇◆◇◆◇◆◇◆◇◆◇    
        ◆◇◆◇◆◇◆      
          ◇◆◇        `,

    lightning: `        ⚡⚡⚡        
        ⚡⚡⚡⚡⚡⚡⚡      
      ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡    
     ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡   
    ⚡⚡⚡⚡⚡     ⚡⚡⚡⚡⚡  
   ⚡⚡⚡⚡'         '⚡⚡⚡⚡ 
  ⚡⚡⚡'           '⚡⚡⚡ 
 ⚡⚡⚡'             '⚡⚡⚡
⚡⚡⚡'             '⚡⚡⚡
  ⚡⚡⚡'           '⚡⚡⚡ 
   ⚡⚡⚡⚡'         '⚡⚡⚡⚡ 
    ⚡⚡⚡⚡⚡     ⚡⚡⚡⚡⚡  
     ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡   
      ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡    
        ⚡⚡⚡⚡⚡⚡⚡      
          ⚡⚡⚡        `,

    spiral: `        ∞∞∞        
        ∞∞∞∞∞∞∞      
      ∞∞∞∞∞∞∞∞∞∞∞    
     ∞∞∞∞∞∞∞∞∞∞∞∞∞   
    ∞∞∞∞∞     ∞∞∞∞���  
   ∞∞∞∞'         '∞∞∞∞ 
  ∞∞∞'           '∞∞∞ 
 ∞∞∞'             '∞∞∞
∞∞∞'             '∞∞∞
  ∞∞∞'           '∞∞∞ 
   ∞∞∞∞'         '∞∞∞∞ 
    ∞∞∞∞∞     ∞∞∞∞∞  
     ∞∞∞∞∞∞∞∞∞∞∞∞∞   
      ∞∞∞∞∞∞∞∞∞∞∞    
        ∞∞∞∞∞∞∞      
          ∞∞∞        `,

    atom: `        ⚛⚛⚛        
        ⚛⚛⚛⚛⚛⚛⚛      
      ⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛    
     ⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛   
    ⚛⚛⚛⚛⚛     ⚛⚛⚛⚛⚛  
   ⚛⚛⚛⚛'         '⚛⚛⚛⚛ 
  ⚛⚛⚛'           '⚛⚛⚛ 
 ⚛⚛⚛'             '⚛⚛⚛
⚛⚛⚛'             '⚛⚛⚛
  ⚛⚛⚛'           '⚛⚛⚛ 
   ⚛⚛⚛⚛'         '⚛⚛⚛⚛ 
    ⚛⚛⚛⚛⚛     ⚛⚛⚛⚛⚛  
     ⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛   
      ⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛⚛    
        ⚛⚛⚛⚛⚛⚛⚛      
          ⚛⚛⚛        `,

    shield: `        🛡🛡🛡        
        🛡🛡🛡🛡🛡🛡🛡      
      🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡    
     🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡   
    🛡🛡🛡🛡🛡     🛡🛡🛡🛡🛡  
   🛡🛡🛡🛡'         '🛡🛡🛡🛡 
  🛡🛡🛡'           '🛡🛡🛡 
 🛡🛡🛡'             '🛡🛡🛡
🛡🛡🛡'             '🛡🛡🛡
  🛡🛡🛡'           '🛡🛡🛡 
   🛡🛡🛡🛡'         '🛡🛡🛡🛡 
    🛡🛡🛡🛡🛡     🛡🛡🛡🛡🛡  
     🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡   
      🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡🛡    
        🛡🛡🛡🛡🛡🛡🛡      
          🛡🛡🛡        `,

    portal: `        🌀🌀🌀        
        🌀🌀🌀🌀🌀🌀🌀      
      🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀    
     🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀   
    🌀🌀🌀🌀🌀     🌀🌀🌀🌀🌀  
   🌀🌀🌀🌀'         '🌀🌀🌀🌀 
  🌀🌀🌀'           '🌀🌀🌀 
 🌀🌀🌀'             '🌀🌀🌀
🌀🌀🌀'             '🌀🌀🌀
  🌀🌀🌀'           '🌀🌀🌀 
   🌀🌀🌀🌀'         '🌀🌀🌀🌀 
    🌀🌀🌀🌀🌀     🌀🌀🌀🌀🌀  
     🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀   
      🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀    
        🌀🌀🌀🌀🌀🌀🌀      
          🌀🌀🌀        `,

    flower: `        🌸🌸🌸        
        🌸🌸🌸🌸🌸🌸🌸      
      🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸    
     🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸   
    🌸🌸🌸🌸🌸     🌸🌸🌸🌸🌸  
   🌸🌸🌸🌸'         '🌸🌸🌸🌸 
  🌸🌸🌸'           '🌸🌸🌸 
 🌸🌸🌸'             '🌸🌸🌸
🌸🌸🌸'             '🌸🌸🌸
  🌸🌸🌸'           '🌸🌸🌸 
   🌸🌸🌸🌸'         '🌸🌸🌸🌸 
    🌸🌸🌸🌸🌸     🌸🌸🌸🌸🌸  
     🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸   
      🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸    
        🌸🌸🌸🌸🌸🌸🌸      
          🌸🌸🌸        `,

    mandala: `        ॐॐॐ        
        ॐॐॐॐॐॐॐ      
      ॐॐॐॐॐॐॐॐॐॐॐ    
     ॐॐॐॐॐॐॐॐॐॐॐॐॐ   
    ॐॐॐॐॐ     ॐॐॐॐॐ  
   ॐॐॐॐ'         'ॐॐॐॐ 
  ॐॐॐ'           'ॐॐॐ 
 ॐॐॐ'             'ॐॐॐ
ॐॐॐ'             'ॐॐॐ
  ॐॐॐ'           'ॐॐॐ 
   ॐॐॐॐ'         'ॐॐॐॐ 
    ॐॐॐॐॐ     ॐॐॐॐॐ  
     ॐॐॐॐॐॐॐॐॐॐॐॐॐ   
      ॐॐॐॐॐॐॐॐॐॐॐ    
        ॐॐॐॐॐॐॐ      
          ॐॐॐ        `,
  }

const milestones: Record<string, Milestone> = {
    star: { type: "chains", required: 50, name: "Stellar Chains", description: "Create 50 chain reactions" },
    diamond: { type: "chains", required: 100, name: "Diamond Chains", description: "Create 100 chain reactions" },
    lightning: { type: "storms", required: 10, name: "Storm Master", description: "Survive 10 magnetic storms" },
    spiral: { type: "storms", required: 25, name: "Spiral Galaxy", description: "Survive 25 magnetic storms" },
    atom: { type: "absorptions", required: 50, name: "Energy Atom", description: "Absorb 50 energy wisps" },
    portal: { type: "absorptions", required: 100, name: "Portal Master", description: "Absorb 100 energy wisps" },
    shield: { type: "resistance", required: 20, name: "Shield Bearer", description: "Build resistance 20 times" },
    flower: { type: "echoes", required: 30, name: "Echo Bloom", description: "Experience 30 storm echoes" },
    mandala: { type: "echoes", required: 75, name: "Echo Mandala", description: "Experience 75 storm echoes" },
  }

  const variationNames = {
    donut: "Classic Donut",
    star: "Stellar Formation",
    diamond: "Crystal Matrix",
    lightning: "Storm Core",
    spiral: "Spiral Galaxy",
    atom: "Atomic Structure",
    shield: "Protective Barrier",
    portal: "Dimensional Portal",
    flower: "Cosmic Bloom",
    mandala: "Sacred Geometry",
  }

  // Check for milestone unlocks
  const checkMilestones = () => {
    const currentStats = {
      chains: chainReactionCount,
      storms: stormCount,
      absorptions: absorptionCount,
      resistance: resistanceCount,
      echoes: echoCount,
    }

    const newUnlockedVariations: SetStateAction<string[]> = []

    Object.entries(milestones).forEach(([variation, milestone]) => {
      if (!unlockedVariations.includes(variation) && currentStats[milestone.type] >= milestone.required) {
        newUnlockedVariations.push(variation)
      }
    })

    if (newUnlockedVariations.length > 0) {
      setUnlockedVariations((prev) => [...prev, ...newUnlockedVariations])
      setNewUnlocks(newUnlockedVariations)

      // Clear new unlock notifications after 3 seconds
      setTimeout(() => {
        setNewUnlocks([])
      }, 3000)
    }
  }

  // Get progress for next milestone
  const getNextMilestoneProgress = () => {
    const currentStats = {
      chains: chainReactionCount,
      storms: stormCount,
      absorptions: absorptionCount,
      resistance: resistanceCount,
      echoes: echoCount,
    }

    const nextMilestones = Object.entries(milestones)
      .filter(([variation]) => !unlockedVariations.includes(variation))
      .map(([variation, milestone]) => ({
        variation,
        ...milestone,
        progress: currentStats[milestone.type],
        percentage: Math.min(100, (currentStats[milestone.type] / milestone.required) * 100),
      }))
      .sort((a, b) => a.required - a.progress)

    return nextMilestones.slice(0, 3) // Show next 3 milestones
  }

  // Initialize particles around the donut
  useEffect(() => {
    const particleChars = ["*", "·", "○", "◦", "∘", "•", "⋅", "✦", "✧", "⭐"]
    const colors = [
      "text-yellow-400",
      "text-orange-400",
      "text-red-400",
      "text-pink-400",
      "text-purple-400",
      "text-blue-400",
      "text-cyan-400",
      "text-emerald-400",
    ]

    const newParticles: Particle[] = []
    for (let i = 0; i < 25; i++) {
      const angle = (i / 25) * Math.PI * 2
      const radius = 150 + Math.random() * 60
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      newParticles.push({
        id: i,
        x,
        y,
        targetX: x,
        targetY: y,
        originalX: x,
        originalY: y,
        char: particleChars[Math.floor(Math.random() * particleChars.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
        velocity: { x: 0, y: 0 },
        lastCollisionTime: 0,
        lastSparkleHit: 0,
        magneticCharge: 0.5 + Math.random() * 0.5,
        stormVelocity: { x: 0, y: 0 },
        residualCharge: 0,
        lastStormExposure: 0,
        supercharge: 0,
        lastSuperchargeTime: 0,
        superchargeLevel: 0,
        lastEnergyBurst: 0,
        stormExposureHistory: [],
        resistanceLevel: 0,
        lastResistanceDecay: Date.now(),
        totalStormExposures: 0,
      })
    }
    setParticles(newParticles)
  }, [])

  // Create energy wisps
  const createEnergyWisps = (centerX: number, centerY: number, count: number) => {
    const wispChars = ["~", "≈", "∼", "◦", "∘", "·", "⋅", "✧", "✦"]
    const wispColors = ["text-cyan-300", "text-blue-300", "text-purple-300", "text-pink-300", "text-white"]

    const newWisps: EnergyWisp[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const distance = 20 + Math.random() * 80
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance

      const driftAngle = angle + (Math.random() - 0.5) * 0.5
      const driftSpeed = 0.3 + Math.random() * 0.7

      newWisps.push({
        id: wispIdRef.current++,
        x,
        y,
        velocityX: Math.cos(driftAngle) * driftSpeed,
        velocityY: Math.sin(driftAngle) * driftSpeed,
        createdAt: Date.now(),
        char: wispChars[Math.floor(Math.random() * wispChars.length)],
        color: wispColors[Math.floor(Math.random() * wispColors.length)],
        scale: 0.4 + Math.random() * 0.6,
        rotation: Math.random() * 360,
        targetX: centerX + Math.cos(driftAngle) * (distance + 200),
        targetY: centerY + Math.sin(driftAngle) * (distance + 200),
        isBeingAbsorbed: false,
        absorptionStartTime: 0,
        targetParticleId: null,
      })
    }

    setEnergyWisps((prev) => [...prev, ...newWisps])
  }

  // Create energy burst effect
  const createEnergyBurst = (x: number, y: number, intensity: number) => {
    const burstParticles = []
    const numParticles = 8 + Math.floor(intensity * 12)
    const burstChars = ["✦", "✧", "⭐", "💫", "✨", "🌟", "💥", "⚡"]

    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles + Math.random() * 0.3
      const speed = 2 + Math.random() * 4 * intensity
      burstParticles.push({
        x: 0,
        y: 0,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        char: burstChars[Math.floor(Math.random() * burstChars.length)],
      })
    }

    const newBurst: EnergyBurst = {
      id: burstIdRef.current++,
      x,
      y,
      createdAt: Date.now(),
      scale: 0.5 + intensity * 0.5,
      rotation: Math.random() * 360,
      particles: burstParticles,
    }

    setEnergyBursts((prev) => [...prev, newBurst])
  }

  // Create residual rings
  const createResidualRings = (centerX: number, centerY: number) => {
    const ringColors = ["rgba(34, 211, 238, 0.3)", "rgba(147, 51, 234, 0.2)", "rgba(236, 72, 153, 0.2)"]
    const newRings: ResidualRing[] = []

    for (let i = 0; i < 3; i++) {
      newRings.push({
        id: ringIdRef.current++,
        centerX,
        centerY,
        radius: 30 + i * 20,
        maxRadius: 150 + i * 50,
        createdAt: Date.now(),
        opacity: 0.6 - i * 0.15,
        color: ringColors[i],
      })
    }

    setResidualRings((prev) => [...prev, ...newRings])
  }

  // Create storm echoes
  const createStormEchoes = (originalCenterX: number, originalCenterY: number, originalIntensity: number) => {
    const numEchoes = 1 + Math.floor(originalIntensity * 3) // 1-4 echoes based on storm intensity
    const baseDelay = 2000 // 2 seconds after storm ends

    for (let i = 0; i < numEchoes; i++) {
      setTimeout(
        () => {
          // Random position near original storm center
          const offsetDistance = 50 + Math.random() * 100
          const offsetAngle = Math.random() * Math.PI * 2
          const echoX = originalCenterX + Math.cos(offsetAngle) * offsetDistance
          const echoY = originalCenterY + Math.sin(offsetAngle) * offsetDistance

          // Diminishing intensity for each echo
          const echoIntensity = originalIntensity * (0.3 + Math.random() * 0.3) * Math.pow(0.7, i)
          const echoDuration = 1500 + Math.random() * 1000 // 1.5-2.5 seconds
          const echoRadius = 80 + echoIntensity * 120

          const newEcho: StormEcho = {
            id: echoIdRef.current++,
            isActive: true,
            centerX: echoX,
            centerY: echoY,
            startTime: Date.now(),
            duration: echoDuration,
            intensity: echoIntensity,
            radius: 0,
            maxRadius: echoRadius,
            generation: i + 1,
            parentStormIntensity: originalIntensity,
          }

          setStormEchoes((prev) => [...prev, newEcho])
          setEchoCount((prev) => prev + 1)

          // Create gentle lightning for stronger echoes
          if (echoIntensity > 0.3) {
            createEchoLightning(echoX, echoY, echoIntensity)
          }
        },
        baseDelay + i * (1000 + Math.random() * 2000),
      ) // Staggered timing
    }
  }

  // Create echo lightning effect
  const createEchoLightning = (centerX: number, centerY: number, intensity: number) => {
    const numBolts = 1 + Math.floor(intensity * 2)
    const newLightning: Lightning[] = []

    for (let i = 0; i < numBolts; i++) {
      const angle = (Math.PI * 2 * i) / numBolts + Math.random() * 0.8
      const distance = 60 + Math.random() * 80 * intensity
      const endX = centerX + Math.cos(angle) * distance
      const endY = centerY + Math.sin(angle) * distance

      const branches: { x: number; y: number }[] = []
      const numBranches = 1 + Math.floor(Math.random() * 2)
      for (let j = 0; j < numBranches; j++) {
        const branchProgress = (j + 1) / (numBranches + 1)
        const branchX = centerX + (endX - centerX) * branchProgress + (Math.random() - 0.5) * 20
        const branchY = centerY + (endY - centerY) * branchProgress + (Math.random() - 0.5) * 20
        branches.push({ x: branchX, y: branchY })
      }

      newLightning.push({
        id: lightningIdRef.current++,
        startX: centerX,
        startY: centerY,
        endX,
        endY,
        createdAt: Date.now(),
        branches,
      })
    }

    setLightning((prev) => [...prev, ...newLightning])
  }

  // Check for wisp absorption
  const checkWispAbsorption = (particles: Particle[], wisps: EnergyWisp[]) => {
    const absorptionDistance = 30
    const currentTime = Date.now()

    wisps.forEach((wisp) => {
      if (wisp.isBeingAbsorbed) return

      particles.forEach((particle) => {
        const distance = Math.sqrt(Math.pow(wisp.x - particle.x, 2) + Math.pow(wisp.y - particle.y, 2))

        if (distance < absorptionDistance) {
          // Start absorption process
          wisp.isBeingAbsorbed = true
          wisp.absorptionStartTime = currentTime
          wisp.targetParticleId = particle.id

          // Enhance particle with supercharge
          const superchargeBoost = 0.3 + Math.random() * 0.4
          particle.supercharge = Math.min(1, particle.supercharge + superchargeBoost)
          particle.lastSuperchargeTime = currentTime
          particle.superchargeLevel = Math.min(5, particle.superchargeLevel + 1)

          // Create energy burst effect
          createEnergyBurst(particle.x, particle.y, particle.supercharge)

          // Generate supercharged sparkles
          const superSparkles = createSparkle(particle.x, particle.y, 0, false, false, false, true)
          setSparkles((prev) => [...prev, ...superSparkles])

          setAbsorptionCount((prev) => prev + 1)
        }
      })
    })
  }

  // Apply supercharge effects to particles
  const applySuperchargeEffects = (particles: Particle[]) => {
    const currentTime = Date.now()
    const superchargeDuration = 8000 // 8 seconds

    return particles.map((particle) => {
      if (particle.supercharge <= 0) return particle

      const superchargeAge = (currentTime - particle.lastSuperchargeTime) / superchargeDuration
      let newSupercharge = particle.supercharge

      if (superchargeAge >= 1) {
        // Supercharge expired
        newSupercharge = 0
        particle.superchargeLevel = 0
      } else {
        // Decay supercharge over time
        newSupercharge = particle.supercharge * (1 - superchargeAge * 0.3)
      }

      // Generate energy bursts periodically
      if (
        newSupercharge > 0.5 &&
        currentTime - particle.lastEnergyBurst > 2000 &&
        Math.random() < 0.1 * newSupercharge
      ) {
        createEnergyBurst(particle.x, particle.y, newSupercharge * 0.7)
        particle.lastEnergyBurst = currentTime

        // Generate mini wisps around supercharged particles
        if (Math.random() < 0.3) {
          createEnergyWisps(particle.x, particle.y, 1 + Math.floor(newSupercharge * 2))
        }
      }

      // Generate supercharged sparkles
      if (newSupercharge > 0.3 && Math.random() < 0.05 * newSupercharge) {
        const superSparkles = createSparkle(particle.x, particle.y, 0, false, false, false, true)
        setSparkles((prev) => [...prev, ...superSparkles])
      }

      return {
        ...particle,
        supercharge: newSupercharge,
      }
    })
  }

  // Trigger magnetic storm
  const triggerMagneticStorm = () => {
    const currentTime = Date.now()
    if (currentTime - lastStormTime.current < 3000) return

    const stormDuration = 4000 + Math.random() * 2000
    const centerX = (Math.random() - 0.5) * 100
    const centerY = (Math.random() - 0.5) * 100

    setMagneticStorm({
      isActive: true,
      phase: "buildup",
      intensity: 0,
      startTime: currentTime,
      duration: stormDuration,
      centerX,
      centerY,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    })

    setStormCount((prev) => prev + 1)
    lastStormTime.current = currentTime
    createLightning(centerX, centerY)
  }

  // Start storm aftermath
  const startStormAftermath = (centerX: number, centerY: number, stormIntensity: number) => {
    const aftermathDuration = 8000 + Math.random() * 4000

    setStormAftermath({
      isActive: true,
      centerX,
      centerY,
      startTime: Date.now(),
      duration: aftermathDuration,
      intensity: stormIntensity,
    })

    createEnergyWisps(centerX, centerY, 8 + Math.floor(stormIntensity * 6))
    createResidualRings(centerX, centerY)

    // Create storm echoes after major storms
    if (stormIntensity > 0.5) {
      createStormEchoes(centerX, centerY, stormIntensity)
    }

    setParticles((prev) =>
      prev.map((particle) => {
        const distanceToStorm = Math.sqrt(Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2))
        const exposure = Math.max(0, 1 - distanceToStorm / 300)
        return {
          ...particle,
          residualCharge: exposure * stormIntensity,
          lastStormExposure: Date.now(),
        }
      }),
    )
  }

  // Apply storm echo effects
  const applyStormEchoEffects = (particles: Particle[], echoes: StormEcho[]) => {
    if (echoes.length === 0) return particles

    const currentTime = Date.now()

    // Update echo states and remove expired ones
    const activeEchoes = echoes.filter((echo) => {
      if (!echo.isActive) return false

      const echoAge = (currentTime - echo.startTime) / echo.duration
      if (echoAge >= 1) {
        echo.isActive = false
        return false
      }

      // Update echo radius (expanding ripple effect)
      echo.radius = echo.maxRadius * echoAge
      return true
    })

    setStormEchoes(activeEchoes)

    // Generate echo sparkles occasionally
    activeEchoes.forEach((echo) => {
      if (Math.random() < 0.03 * echo.intensity) {
        const echoSparkles = createSparkle(echo.centerX, echo.centerY, 0, false, false, false, false, true)
        setSparkles((prev) => [...prev, ...echoSparkles])
      }
    })

    return particles.map((particle) => {
      const totalEchoEffect = { x: 0, y: 0 }

      activeEchoes.forEach((echo) => {
        const distanceToEcho = Math.sqrt(
          Math.pow(particle.x - echo.centerX, 2) + Math.pow(particle.y - echo.centerY, 2),
        )

        if (distanceToEcho < echo.radius) {
          const echoAge = (currentTime - echo.startTime) / echo.duration
          const pulseIntensity = Math.sin(echoAge * Math.PI) * echo.intensity // Sine wave pulse

          // Apply resistance to echo effects
          const resistanceMultiplier = 1 - particle.resistanceLevel * 0.5 // 50% max resistance to echoes
          const effectStrength = pulseIntensity * resistanceMultiplier * 0.15 // Gentler than main storms

          const angle = Math.atan2(particle.y - echo.centerY, particle.x - echo.centerX)
          const pushX = Math.cos(angle) * effectStrength * 15
          const pushY = Math.sin(angle) * effectStrength * 15

          totalEchoEffect.x += pushX
          totalEchoEffect.y += pushY
        }
      })

      return {
        ...particle,
        targetX: particle.targetX + totalEchoEffect.x,
        targetY: particle.targetY + totalEchoEffect.y,
      }
    })
  }

  // Auto-trigger storms periodically
  useEffect(() => {
    const stormInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        triggerMagneticStorm()
      }
    }, 8000)

    return () => clearInterval(stormInterval)
  }, [])

  // Handle mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        setMousePos({
          x: e.clientX - centerX,
          y: e.clientY - centerY,
        })
      }
    }

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        triggerMagneticStorm()
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Create lightning effect
  const createLightning = (centerX: number, centerY: number) => {
    const numBolts = 3 + Math.floor(Math.random() * 5)
    const newLightning: Lightning[] = []

    for (let i = 0; i < numBolts; i++) {
      const angle = (Math.PI * 2 * i) / numBolts + Math.random() * 0.5
      const distance = 100 + Math.random() * 150
      const endX = centerX + Math.cos(angle) * distance
      const endY = centerY + Math.sin(angle) * distance

      const branches: { x: number; y: number }[] = []
      const numBranches = 2 + Math.floor(Math.random() * 4)
      for (let j = 0; j < numBranches; j++) {
        const branchProgress = (j + 1) / (numBranches + 1)
        const branchX = centerX + (endX - centerX) * branchProgress + (Math.random() - 0.5) * 30
        const branchY = centerY + (endY - centerY) * branchProgress + (Math.random() - 0.5) * 30
        branches.push({ x: branchX, y: branchY })
      }

      newLightning.push({
        id: lightningIdRef.current++,
        startX: centerX,
        startY: centerY,
        endX,
        endY,
        createdAt: Date.now(),
        branches,
      })
    }

    setLightning((prev) => [...prev, ...newLightning])
  }

  // Create sparkle effect
  const createSparkle = (
    x: number,
    y: number,
    generation = 0,
    isChainReaction = false,
    isStormSparkle = false,
    isResidualSparkle = false,
    isSupercharged = false,
    isEcho = false,
  ): Sparkle[] => {
    const sparkleChars = isEcho
      ? ["◦", "∘", "·", "⋅", "✧", "✦", "○", "◯"]
      : isSupercharged
        ? ["⚡", "💥", "🌟", "✨", "💫", "🔥", "💎", "⭐", "✦", "✧"]
        : generation === 0
          ? ["✨", "⭐", "💫", "✦", "✧", "⚡", "💥", "🌟", "✴️", "❇️", "🔥", "💎"]
          : ["✨", "⭐", "✦", "✧", "💫", "🌟", "✴️", "❇️"]

    const sparkleColors = isEcho
      ? ["text-gray-300", "text-slate-300", "text-zinc-300", "text-neutral-300", "text-stone-300"]
      : isSupercharged
        ? ["text-white", "text-yellow-200", "text-orange-200", "text-red-200", "text-pink-200"]
        : isResidualSparkle
          ? ["text-cyan-200", "text-blue-200", "text-purple-200", "text-pink-200", "text-white"]
          : isStormSparkle
            ? ["text-white", "text-cyan-200", "text-blue-200", "text-purple-200", "text-pink-200"]
            : generation === 0
              ? [
                  "text-white",
                  "text-yellow-300",
                  "text-orange-300",
                  "text-pink-300",
                  "text-purple-300",
                  "text-blue-300",
                  "text-cyan-300",
                  "text-emerald-300",
                  "text-red-300",
                ]
              : [
                  "text-yellow-200",
                  "text-orange-200",
                  "text-pink-200",
                  "text-purple-200",
                  "text-cyan-200",
                  "text-white",
                ]

    const maxSparkles = isEcho ? 3 : isSupercharged ? 6 : isStormSparkle ? 5 : Math.max(1, 4 - generation)
    const numSparkles = isEcho
      ? 1 + Math.floor(Math.random() * 2)
      : isSupercharged
        ? 4 + Math.floor(Math.random() * 3)
        : isResidualSparkle
          ? 1
          : isStormSparkle
            ? 3 + Math.floor(Math.random() * 3)
            : isChainReaction
              ? Math.min(maxSparkles, Math.random() > 0.6 ? 2 : 1)
              : Math.random() > 0.7
                ? 3
                : Math.random() > 0.4
                  ? 2
                  : 1

    const newSparkles: Sparkle[] = []

    for (let i = 0; i < numSparkles; i++) {
      const angle = (Math.PI * 2 * i) / numSparkles + Math.random() * 0.8
      const distance = isEcho
        ? Math.random() * 25
        : isSupercharged
          ? Math.random() * 50
          : isStormSparkle
            ? Math.random() * 40
            : isResidualSparkle
              ? Math.random() * 15
              : isChainReaction
                ? Math.random() * 15
                : Math.random() * 20
      const sparkleX = x + Math.cos(angle) * distance
      const sparkleY = y + Math.sin(angle) * distance

      const baseScale = isEcho
        ? 0.4 + Math.random() * 0.3
        : isSupercharged
          ? 1.0 + Math.random() * 0.8
          : isStormSparkle
            ? 0.8 + Math.random() * 0.6
            : isResidualSparkle
              ? 0.3 + Math.random() * 0.3
              : isChainReaction
                ? 0.3 + Math.random() * 0.4
                : 0.5 + Math.random() * 0.8

      const velocityMultiplier = isEcho
        ? 0.8 + Math.random() * 0.7
        : isSupercharged
          ? 4 + Math.random() * 3
          : isStormSparkle
            ? 3 + Math.random() * 2
            : isResidualSparkle
              ? 0.5 + Math.random() * 0.5
              : isChainReaction
                ? 2 + generation * 0.5
                : 1

      newSparkles.push({
        id: sparkleIdRef.current++,
        x: sparkleX,
        y: sparkleY,
        char: sparkleChars[Math.floor(Math.random() * sparkleChars.length)],
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        createdAt: Date.now(),
        scale: baseScale,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 4 * velocityMultiplier,
        velocityY: (Math.random() - 0.5) * 4 * velocityMultiplier,
        generation,
        hasTriggeredChain: false,
        isBeingAttracted: false,
        targetParticleId: null,
        attractionStrength: isEcho
          ? 0.3 + Math.random() * 0.2
          : isSupercharged
            ? 2.0 + Math.random() * 0.8
            : isStormSparkle
              ? 1.5 + Math.random() * 0.5
              : isResidualSparkle
                ? 0.4 + Math.random() * 0.3
                : 0.8 + Math.random() * 0.4,
      })
    }

    return newSparkles
  }

  // Calculate resistance level based on storm exposure history
  const calculateResistanceLevel = (exposureHistory: { timestamp: number; intensity: number; duration: number }[]) => {
    const currentTime = Date.now()
    const memoryDuration = 60000 // 1 minute memory window

    // Filter recent exposures within memory window
    const recentExposures = exposureHistory.filter((exposure) => currentTime - exposure.timestamp < memoryDuration)

    if (recentExposures.length === 0) return 0

    // Calculate resistance based on number and intensity of recent exposures
    const exposureScore = recentExposures.reduce((score, exposure) => {
      const ageMultiplier = 1 - (currentTime - exposure.timestamp) / memoryDuration
      return score + ((exposure.intensity * exposure.duration) / 1000) * ageMultiplier
    }, 0)

    // Convert to resistance level (0-1 scale)
    return Math.min(1, exposureScore / 10)
  }

  // Apply resistance decay over time
  const applyResistanceDecay = (particles: Particle[]) => {
    const currentTime = Date.now()
    const decayInterval = 5000 // Decay every 5 seconds
    const decayRate = 0.1 // 10% decay per interval

    return particles.map((particle) => {
      if (currentTime - particle.lastResistanceDecay > decayInterval) {
        // Remove old exposures from history
        const memoryDuration = 60000
        const filteredHistory = particle.stormExposureHistory.filter(
          (exposure) => currentTime - exposure.timestamp < memoryDuration,
        )

        // Calculate new resistance level
        const newResistanceLevel = calculateResistanceLevel(filteredHistory)

        return {
          ...particle,
          stormExposureHistory: filteredHistory,
          resistanceLevel: newResistanceLevel,
          lastResistanceDecay: currentTime,
        }
      }
      return particle
    })
  }

  // Apply magnetic storm effects
  const applyStormEffects = (particles: Particle[], storm: MagneticStorm) => {
    if (!storm.isActive) return particles

    const currentTime = Date.now()
    const stormAge = (currentTime - storm.startTime) / storm.duration

    let newPhase = storm.phase
    let newIntensity = storm.intensity

    if (stormAge < 0.2) {
      newPhase = "buildup"
      newIntensity = Math.min(1, stormAge / 0.2)
    } else if (stormAge < 0.7) {
      newPhase = "peak"
      newIntensity = 1
    } else if (stormAge < 1) {
      newPhase = "cooldown"
      newIntensity = Math.max(0, (1 - stormAge) / 0.3)
    } else {
      startStormAftermath(storm.centerX, storm.centerY, storm.intensity)
      setMagneticStorm((prev) => ({ ...prev, isActive: false, intensity: 0 }))
      return particles
    }

    setMagneticStorm((prev) => ({ ...prev, phase: newPhase, intensity: newIntensity }))

    if (newPhase === "peak" && Math.random() < 0.1) {
      const stormSparkles = createSparkle(storm.centerX, storm.centerY, 0, false, true, false, false)
      setSparkles((prev) => [...prev, ...stormSparkles])
    }

    if ((newPhase === "buildup" || newPhase === "peak") && Math.random() < 0.05) {
      createLightning(storm.centerX, storm.centerY)
    }

    return particles.map((particle) => {
      const distanceToCenter = Math.sqrt(
        Math.pow(particle.x - storm.centerX, 2) + Math.pow(particle.y - storm.centerY, 2),
      )

      // Record storm exposure in particle's history
      const isNewExposure = currentTime - particle.lastStormExposure > 1000 // Only record if 1+ seconds since last
      if (isNewExposure && distanceToCenter < 300) {
        const exposureIntensity = Math.max(0, 1 - distanceToCenter / 300) * newIntensity
        if (exposureIntensity > 0.1) {
          particle.stormExposureHistory.push({
            timestamp: currentTime,
            intensity: exposureIntensity,
            duration: storm.duration,
          })
          particle.totalStormExposures += 1
          particle.lastStormExposure = currentTime

          // Update resistance counter for UI
          if (particle.totalStormExposures % 3 === 0) {
            setResistanceCount((prev) => prev + 1)
          }
        }
      }

      // Calculate current resistance level
      particle.resistanceLevel = calculateResistanceLevel(particle.stormExposureHistory)

      const angle = Math.atan2(particle.y - storm.centerY, particle.x - storm.centerX)
      const swirlingAngle = angle + storm.rotationSpeed * newIntensity

      // Apply resistance to storm effects
      const resistanceMultiplier = 1 - particle.resistanceLevel * 0.7 // Up to 70% resistance
      const swirlingForce = newIntensity * 0.3 * (1 + particle.supercharge * 0.5) * resistanceMultiplier

      const attractionForce =
        newIntensity *
        0.2 *
        (300 / Math.max(distanceToCenter, 50)) *
        (1 + particle.supercharge * 0.3) *
        resistanceMultiplier

      const swirlingVelX = Math.cos(swirlingAngle + Math.PI / 2) * swirlingForce
      const swirlingVelY = Math.sin(swirlingAngle + Math.PI / 2) * swirlingForce

      const attractionVelX = ((storm.centerX - particle.x) / distanceToCenter) * attractionForce
      const attractionVelY = ((storm.centerY - particle.y) / distanceToCenter) * attractionForce

      const stormVelX = swirlingVelX + attractionVelX
      const stormVelY = swirlingVelY + attractionVelY

      return {
        ...particle,
        stormVelocity: { x: stormVelX, y: stormVelY },
      }
    })
  }

  // Apply aftermath effects
  const applyAftermathEffects = (particles: Particle[], aftermath: StormAftermath) => {
    if (!aftermath.isActive) return particles

    const currentTime = Date.now()
    const aftermathAge = (currentTime - aftermath.startTime) / aftermath.duration

    if (aftermathAge >= 1) {
      setStormAftermath((prev) => ({ ...prev, isActive: false }))
      return particles
    }

    if (Math.random() < 0.02 * aftermath.intensity * (1 - aftermathAge)) {
      const residualSparkles = createSparkle(aftermath.centerX, aftermath.centerY, 0, false, false, true, false)
      setSparkles((prev) => [...prev, ...residualSparkles])
    }

    if (Math.random() < 0.01 * aftermath.intensity * (1 - aftermathAge)) {
      createEnergyWisps(aftermath.centerX, aftermath.centerY, 1 + Math.floor(Math.random() * 3))
    }

    return particles.map((particle) => {
      const chargeDecay = 1 - aftermathAge * 0.3
      const newResidualCharge = Math.max(0, particle.residualCharge * chargeDecay)

      return {
        ...particle,
        residualCharge: newResidualCharge,
      }
    })
  }

  // Apply magnetic attraction to sparkles
const applyMagneticAttraction = (sparkles: Sparkle[], particles: Particle[]) => {
    const baseAttractionRadius = 80
    const stormMultiplier = magneticStorm.isActive ? 1.5 : 1
    const aftermathMultiplier = stormAftermath.isActive ? 1.2 : 1
    const attractionRadius = baseAttractionRadius * stormMultiplier * aftermathMultiplier

    const maxAttractionForce = magneticStorm.isActive ? 0.5 : stormAftermath.isActive ? 0.35 : 0.3
    const minAttractionForce = 0.05

return sparkles.map((sparkle) => {
let nearestParticle: Particle | null = null
  let nearestDistance = Number.POSITIVE_INFINITY
  let isCurrentlyAttracted = false

  particles.forEach((particle) => {
    const distance = Math.sqrt(Math.pow(sparkle.x - particle.x, 2) + Math.pow(sparkle.y - particle.y, 2))
    const superchargeRadius = attractionRadius * (1 + particle.supercharge * 0.8)

    if (distance < superchargeRadius && distance < nearestDistance) {
      nearestDistance = distance
      nearestParticle = particle
    }
  })

  let newVelocityX = sparkle.velocityX
  let newVelocityY = sparkle.velocityY

if (nearestParticle !== null && nearestDistance > 15) {
    // Tell TS this is definitely Particle now
    const p = nearestParticle

    isCurrentlyAttracted = true

    const residualMultiplier = 1 + p.residualCharge * 0.5
    const superchargeMultiplier = 1 + p.supercharge * 1.5

  const attractionStrength =
    Math.max(minAttractionForce, maxAttractionForce * (1 - nearestDistance / attractionRadius)) *
    sparkle.attractionStrength *
    p.magneticCharge *
    stormMultiplier *
    aftermathMultiplier *
    residualMultiplier *
    superchargeMultiplier

    const dx = p.x - sparkle.x
    const dy = p.y - sparkle.y
    const normalizedDx = dx / nearestDistance
    const normalizedDy = dy / nearestDistance

    newVelocityX += normalizedDx * attractionStrength
    newVelocityY += normalizedDy * attractionStrength

    const maxVelocity = magneticStorm.isActive ? 10 : stormAftermath.isActive ? 7 : 6
    const superchargeMaxVelocity = maxVelocity * (1 + p.supercharge * 0.5)
    const currentSpeed = Math.sqrt(newVelocityX ** 2 + newVelocityY ** 2)
    if (currentSpeed > superchargeMaxVelocity) {
      newVelocityX = (newVelocityX / currentSpeed) * superchargeMaxVelocity
      newVelocityY = (newVelocityY / currentSpeed) * superchargeMaxVelocity
    }

    if (!sparkle.isBeingAttracted) {
      setAttractionCount((prev) => prev + 1)
    }
  }

  return {
    ...sparkle,
    velocityX: newVelocityX,
    velocityY: newVelocityY,
    isBeingAttracted: isCurrentlyAttracted,
    targetParticleId: nearestParticle?.id || null,
  }
})

  }

  // Check for particle collisions
  const checkCollisions = (particles: Particle[]) => {
    const currentTime = Date.now()
    const collisionDistance = 25
    const baseCooldown = 300
    const stormCooldown = magneticStorm.isActive ? 150 : baseCooldown
    const aftermathCooldown = stormAftermath.isActive ? 200 : baseCooldown
    const collisionCooldown = Math.min(stormCooldown, aftermathCooldown)

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const particle1 = particles[i]
        const particle2 = particles[j]

        if (
          currentTime - particle1.lastCollisionTime < collisionCooldown ||
          currentTime - particle2.lastCollisionTime < collisionCooldown
        ) {
          continue
        }

        const distance = Math.sqrt(Math.pow(particle1.x - particle2.x, 2) + Math.pow(particle1.y - particle2.y, 2))

        if (distance < collisionDistance) {
          const collisionX = (particle1.x + particle2.x) / 2
          const collisionY = (particle1.y + particle2.y) / 2

          const isResidualCollision = particle1.residualCharge > 0.3 || particle2.residualCharge > 0.3
          const isSuperchargedCollision = particle1.supercharge > 0.3 || particle2.supercharge > 0.3
          const newSparkles = createSparkle(
            collisionX,
            collisionY,
            0,
            false,
            magneticStorm.isActive,
            isResidualCollision,
            isSuperchargedCollision,
          )
          setSparkles((prev) => [...prev, ...newSparkles])

          // Supercharged particles create energy bursts on collision
          if (isSuperchargedCollision) {
            const burstIntensity = Math.max(particle1.supercharge, particle2.supercharge)
            createEnergyBurst(collisionX, collisionY, burstIntensity)
          }

          particle1.lastCollisionTime = currentTime
          particle2.lastCollisionTime = currentTime

          const baseRepulsion = 0.3
          const stormRepulsion = magneticStorm.isActive ? 0.5 : baseRepulsion
          const aftermathRepulsion = stormAftermath.isActive ? 0.4 : baseRepulsion
          const superchargeRepulsion = isSuperchargedCollision ? 0.6 : baseRepulsion
          const repulsionStrength = Math.max(stormRepulsion, aftermathRepulsion, superchargeRepulsion)

          const dx = particle1.x - particle2.x
          const dy = particle1.y - particle2.y
          const normalizedDx = dx / distance
          const normalizedDy = dy / distance

          particle1.targetX += normalizedDx * repulsionStrength * 10
          particle1.targetY += normalizedDy * repulsionStrength * 10
          particle2.targetX -= normalizedDx * repulsionStrength * 10
          particle2.targetY -= normalizedDy * repulsionStrength * 10
        }
      }
    }
  }

  // Check for sparkle-particle collisions
  const checkSparkleCollisions = (particles: Particle[], sparkles: Sparkle[]) => {
    const currentTime = Date.now()
    const sparkleCollisionDistance = 20
    const baseHitCooldown = 200
    const stormHitCooldown = magneticStorm.isActive ? 100 : baseHitCooldown
    const aftermathHitCooldown = stormAftermath.isActive ? 150 : baseHitCooldown
    const sparkleHitCooldown = Math.min(stormHitCooldown, aftermathHitCooldown)

    const baseMaxGeneration = 3
    const stormMaxGeneration = magneticStorm.isActive ? 4 : baseMaxGeneration
    const aftermathMaxGeneration = stormAftermath.isActive ? 4 : baseMaxGeneration
    const maxGeneration = Math.max(stormMaxGeneration, aftermathMaxGeneration)

    const newChainSparkles: Sparkle[] = []

    sparkles.forEach((sparkle) => {
      if (sparkle.hasTriggeredChain || sparkle.generation >= maxGeneration) {
        return
      }

      particles.forEach((particle) => {
        if (currentTime - particle.lastSparkleHit < sparkleHitCooldown) {
          return
        }

        const distance = Math.sqrt(Math.pow(sparkle.x - particle.x, 2) + Math.pow(sparkle.y - particle.y, 2))

        if (distance < sparkleCollisionDistance) {
          const isResidualChain = particle.residualCharge > 0.2
          const isSuperchargedChain = particle.supercharge > 0.3
          const chainSparkles = createSparkle(
            particle.x,
            particle.y,
            sparkle.generation + 1,
            true,
            magneticStorm.isActive,
            isResidualChain,
            isSuperchargedChain,
          )
          newChainSparkles.push(...chainSparkles)

          sparkle.hasTriggeredChain = true
          particle.lastSparkleHit = currentTime

          const baseReaction = 0.2
          const stormReaction = magneticStorm.isActive ? 0.4 : baseReaction
          const aftermathReaction = stormAftermath.isActive ? 0.3 : baseReaction
          const superchargeReaction = particle.supercharge > 0.3 ? 0.5 : baseReaction
          const reactionStrength = Math.max(stormReaction, aftermathReaction, superchargeReaction)

          const dx = particle.x - sparkle.x
          const dy = particle.y - sparkle.y
          const normalizedDx = dx / distance
          const normalizedDy = dy / distance

          particle.targetX += normalizedDx * reactionStrength * 8
          particle.targetY += normalizedDy * reactionStrength * 8

          setChainReactionCount((prev) => prev + 1)
        }
      })
    })

    if (newChainSparkles.length > 0) {
      setSparkles((prev) => [...prev, ...newChainSparkles])
    }
  }

  // Update particle positions, trails, and sparkles
  useEffect(() => {
    const updateParticles = () => {
      setParticles((prevParticles) => {
        let updatedParticles = applyStormEffects(prevParticles, magneticStorm)
        updatedParticles = applyAftermathEffects(updatedParticles, stormAftermath)
        updatedParticles = applySuperchargeEffects(updatedParticles)
        updatedParticles = applyResistanceDecay(updatedParticles)
        updatedParticles = applyStormEchoEffects(updatedParticles, stormEchoes)

        updatedParticles = updatedParticles.map((particle) => {
          const currentTime = Date.now()
          let newTargetX = particle.originalX
          let newTargetY = particle.originalY

          if (magneticStorm.isActive) {
            newTargetX += particle.stormVelocity.x * 20
            newTargetY += particle.stormVelocity.y * 20
          }

          // Apply residual charge effects
          if (particle.residualCharge > 0) {
            const residualAge = (currentTime - particle.lastStormExposure) / 10000
            const residualEffect = particle.residualCharge * Math.max(0, 1 - residualAge)
            const residualAngle = (currentTime / 1000) * residualEffect
            newTargetX += Math.cos(residualAngle) * residualEffect * 15
            newTargetY += Math.sin(residualAngle) * residualEffect * 15
          }

          // Apply supercharge effects
          if (particle.supercharge > 0) {
            const superchargeAngle = (currentTime / 500) * particle.supercharge
            const superchargeRadius = particle.supercharge * 25
            newTargetX += Math.cos(superchargeAngle) * superchargeRadius * 0.3
            newTargetY += Math.sin(superchargeAngle) * superchargeRadius * 0.3
          }

          if (isDragging) {
            const distanceToMouse = Math.sqrt(
              Math.pow(mousePos.x - particle.x, 2) + Math.pow(mousePos.y - particle.y, 2),
            )

            if (distanceToMouse < 250) {
              const attractionStrength = Math.max(0, 1 - distanceToMouse / 250)
              newTargetX = particle.originalX + (mousePos.x - particle.originalX) * attractionStrength * 0.8
              newTargetY = particle.originalY + (mousePos.y - particle.originalY) * attractionStrength * 0.8
            }
          }

          const baseMaxDistance = 280
          const stormMaxDistance = magneticStorm.isActive ? 400 : baseMaxDistance
          const aftermathMaxDistance = stormAftermath.isActive ? 350 : baseMaxDistance
          const superchargeMaxDistance =
            particle.supercharge > 0 ? baseMaxDistance + particle.supercharge * 100 : baseMaxDistance
          const maxDistance = Math.max(stormMaxDistance, aftermathMaxDistance, superchargeMaxDistance)

          const distanceFromOriginal = Math.sqrt(
            Math.pow(newTargetX - particle.originalX, 2) + Math.pow(newTargetY - particle.originalY, 2),
          )

          if (distanceFromOriginal > maxDistance) {
            newTargetX = particle.originalX
            newTargetY = particle.originalY
          }

          const prevX = particle.x
          const prevY = particle.y

          const baseDampening = 0.08
          const stormDampening = magneticStorm.isActive ? 0.25 : baseDampening
          const aftermathDampening = stormAftermath.isActive ? 0.15 : baseDampening
          const dragDampening = isDragging ? 0.15 : baseDampening
          const superchargeDampening = particle.supercharge > 0 ? 0.2 : baseDampening
          const dampening = Math.max(stormDampening, aftermathDampening, dragDampening, superchargeDampening)

          const newX = particle.x + (newTargetX - particle.x) * dampening
          const newY = particle.y + (newTargetY - particle.y) * dampening

          const velocityX = newX - prevX
          const velocityY = newY - prevY

          const newTrail = [{ x: particle.x, y: particle.y, timestamp: currentTime }, ...particle.trail]

          const baseTrailLength = 8
          const stormTrailLength = magneticStorm.isActive ? 20 : baseTrailLength
          const aftermathTrailLength = stormAftermath.isActive ? 15 : baseTrailLength
          const dragTrailLength = isDragging ? 15 : baseTrailLength
          const superchargeTrailLength =
            particle.supercharge > 0 ? baseTrailLength + Math.floor(particle.supercharge * 10) : baseTrailLength
          const maxTrailLength = Math.max(
            stormTrailLength,
            aftermathTrailLength,
            dragTrailLength,
            superchargeTrailLength,
          )

          const baseTrailLifetime = 500
          const stormTrailLifetime = magneticStorm.isActive ? 1200 : baseTrailLifetime
          const aftermathTrailLifetime = stormAftermath.isActive ? 900 : baseTrailLifetime
          const dragTrailLifetime = isDragging ? 800 : baseTrailLifetime
          const superchargeTrailLifetime =
            particle.supercharge > 0 ? baseTrailLifetime + particle.supercharge * 800 : baseTrailLifetime
          const trailLifetime = Math.max(
            stormTrailLifetime,
            aftermathTrailLifetime,
            dragTrailLifetime,
            superchargeTrailLifetime,
          )

          const filteredTrail = newTrail
            .filter((point) => currentTime - point.timestamp < trailLifetime)
            .slice(0, maxTrailLength)

          return {
            ...particle,
            x: newX,
            y: newY,
            targetX: newTargetX,
            targetY: newTargetY,
            velocity: { x: velocityX, y: velocityY },
            trail: filteredTrail,
          }
        })

        checkCollisions(updatedParticles)
        return updatedParticles
      })

      // Check for wisp absorption
      checkWispAbsorption(particles, energyWisps)

      // Update sparkles with magnetic attraction
      setSparkles((prevSparkles) => {
        const currentTime = Date.now()

        const attractedSparkles = applyMagneticAttraction(prevSparkles, particles)

        const updatedSparkles = attractedSparkles
          .map((sparkle) => ({
            ...sparkle,
            x: sparkle.x + sparkle.velocityX,
            y: sparkle.y + sparkle.velocityY,
            velocityX: sparkle.velocityX * (sparkle.isBeingAttracted ? 0.98 : 0.95),
            velocityY: sparkle.velocityY * (sparkle.isBeingAttracted ? 0.98 : 0.95),
            rotation:
              sparkle.rotation +
              (5 +
                sparkle.generation * 2 +
                (sparkle.isBeingAttracted ? 3 : 0) +
                (magneticStorm.isActive ? 5 : 0) +
                (stormAftermath.isActive ? 2 : 0)),
          }))
          .filter((sparkle) => {
            const baseLifetime = sparkle.generation === 0 ? 1500 : 1000 - sparkle.generation * 200
            const stormLifetime = magneticStorm.isActive ? 2000 : baseLifetime
            const aftermathLifetime = stormAftermath.isActive ? 1800 : baseLifetime
            const superchargeLifetime = sparkle.attractionStrength > 1.5 ? baseLifetime * 1.5 : baseLifetime
            const lifetime = Math.max(stormLifetime, aftermathLifetime, superchargeLifetime)
            return currentTime - sparkle.createdAt < lifetime
          })

        checkSparkleCollisions(particles, updatedSparkles)
        return updatedSparkles
      })
function notNull<T>(value: T | null): value is T {
  return value !== null
}

      // Update energy wisps
setEnergyWisps((prevWisps) => {
  const currentTime = Date.now()
  return prevWisps
    .map((wisp) => {
            if (wisp.isBeingAbsorbed && wisp.targetParticleId !== null) {
              // Move wisp towards target particle
              const targetParticle = particles.find((p) => p.id === wisp.targetParticleId)
              if (targetParticle) {
                const absorptionAge = (currentTime - wisp.absorptionStartTime) / 500 // 0.5 second absorption
                if (absorptionAge >= 1) {
                  // Absorption complete - remove wisp
                  return null
                }

                const dx = targetParticle.x - wisp.x
                const dy = targetParticle.y - wisp.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance > 5) {
                  const speed = 8 + absorptionAge * 12 // Accelerate towards particle
                  wisp.velocityX = (dx / distance) * speed
                  wisp.velocityY = (dy / distance) * speed
                }

                return {
                  ...wisp,
                  x: wisp.x + wisp.velocityX,
                  y: wisp.y + wisp.velocityY,
                  scale: wisp.scale * (1 - absorptionAge * 0.8), // Shrink during absorption
                  rotation: wisp.rotation + 10 + absorptionAge * 20,
                }
              }
            }

            return {
              ...wisp,
              x: wisp.x + wisp.velocityX,
              y: wisp.y + wisp.velocityY,
              velocityX: wisp.velocityX * 0.99,
              velocityY: wisp.velocityY * 0.99,
              rotation: wisp.rotation + 1,
            }
          })
    .filter((wisp) => wisp !== null && currentTime - wisp.createdAt < 12000)
    .filter(notNull)
      })

      // Update energy bursts
      setEnergyBursts((prevBursts) => {
        const currentTime = Date.now()
        return prevBursts
          .map((burst) => {
            const age = (currentTime - burst.createdAt) / 1000 // 1 second lifetime
            if (age >= 1) return null

            return {
              ...burst,
              scale: burst.scale * (1 + age * 2),
              rotation: burst.rotation + 5,
              particles: burst.particles.map((particle) => ({
                ...particle,
                x: particle.x + particle.velocityX,
                y: particle.y + particle.velocityY,
                velocityX: particle.velocityX * 0.95,
                velocityY: particle.velocityY * 0.95,
              })),
            }
          })
          .filter((burst) => burst !== null)
      })

      // Update residual rings
      setResidualRings((prevRings) => {
        const currentTime = Date.now()
        return prevRings
          .map((ring) => {
            const age = (currentTime - ring.createdAt) / 8000
            const newRadius = ring.radius + (ring.maxRadius - ring.radius) * age
            const newOpacity = ring.opacity * Math.max(0, 1 - age)
            return {
              ...ring,
              radius: newRadius,
              opacity: newOpacity,
            }
          })
          .filter((ring) => ring.opacity > 0.01)
      })

      // Update lightning
      setLightning((prevLightning) => {
        const currentTime = Date.now()
        return prevLightning.filter((bolt) => currentTime - bolt.createdAt < 300)
      })
    }

    const interval = setInterval(updateParticles, 16)
    return () => clearInterval(interval)
  }, [isDragging, mousePos, particles, magneticStorm, stormAftermath, energyWisps, stormEchoes])

  // Check milestones when stats change
  useEffect(() => {
    checkMilestones()
  }, [chainReactionCount, stormCount, absorptionCount, resistanceCount, echoCount, unlockedVariations])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-green-400 p-8 overflow-hidden">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-300">ASCII Donut with Energy Absorption</h1>
        <div className="flex justify-center gap-4 text-sm mb-4">
          <div className="text-yellow-300">
            Chains: <span className="font-bold text-yellow-400">{chainReactionCount}</span>
          </div>
          <div className="text-purple-300">
            Attractions: <span className="font-bold text-purple-400">{attractionCount}</span>
          </div>
          <div className="text-cyan-300">
            Storms: <span className="font-bold text-cyan-400">{stormCount}</span>
          </div>
          <div className="text-orange-300">
            Absorptions: <span className="font-bold text-orange-400">{absorptionCount}</span>
          </div>
          <div className="text-emerald-300">
            Resistance: <span className="font-bold text-emerald-400">{resistanceCount}</span>
          </div>
          <div className="text-gray-300">
            Echoes: <span className="font-bold text-gray-400">{echoCount}</span>
          </div>
        </div>

        {magneticStorm.isActive && (
          <div className="mb-4 p-2 bg-blue-900 rounded-lg border border-cyan-400">
            <div className="text-cyan-300 font-bold">⚡ MAGNETIC STORM ACTIVE ⚡</div>
            <div className="text-sm text-cyan-200">
              Phase: {magneticStorm.phase.toUpperCase()} | Intensity: {Math.round(magneticStorm.intensity * 100)}%
            </div>
          </div>
        )}

        {stormAftermath.isActive && !magneticStorm.isActive && (
          <div className="mb-4 p-2 bg-purple-900 rounded-lg border border-purple-400">
            <div className="text-purple-300 font-bold">🌀 STORM AFTERMATH 🌀</div>
            <div className="text-sm text-purple-200">
              Residual effects fading... Intensity:{" "}
              {Math.round(
                stormAftermath.intensity *
                  (1 - (Date.now() - stormAftermath.startTime) / stormAftermath.duration) *
                  100,
              )}
              %
            </div>
          </div>
        )}

        {/* Variation Selector */}
        {unlockedVariations.length > 1 && (
          <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-green-800">
            <h3 className="text-sm font-semibold mb-2 text-green-300">Unlocked Variations:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {unlockedVariations.map((variation) => (
                <button
                  key={variation}
                  onClick={() => setCurrentVariation(variation)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    currentVariation === variation
                      ? "bg-green-600 text-white border border-green-400"
                      : "bg-gray-700 text-green-300 border border-gray-600 hover:bg-gray-600"
                  }`}
                >
                  {variationNames[variation]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Unlock Notifications */}
        {newUnlocks.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg border border-yellow-400 animate-pulse">
            <div className="text-yellow-300 font-bold text-center">
              🎉 NEW UNLOCK{newUnlocks.length > 1 ? "S" : ""}! 🎉
            </div>
            {newUnlocks.map((variation) => (
              <div key={variation} className="text-yellow-200 text-sm text-center">
                {variationNames[variation]} - {milestones[variation].name}
              </div>
            ))}
          </div>
        )}

        {/* Milestone Progress */}
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-green-800">
          <h3 className="text-sm font-semibold mb-2 text-green-300">Next Milestones:</h3>
          {getNextMilestoneProgress().map((milestone) => (
            <div key={milestone.variation} className="mb-2">
              <div className="flex justify-between text-xs text-green-400 mb-1">
                <span>{milestone.name}</span>
                <span>
                  {milestone.progress}/{milestone.required}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${milestone.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{milestone.description}</div>
            </div>
          ))}
          {getNextMilestoneProgress().length === 0 && (
            <div className="text-center text-green-400 text-sm">🏆 All variations unlocked! 🏆</div>
          )}
        </div>

        <div
          ref={containerRef}
          className="relative inline-block cursor-pointer select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ width: "500px", height: "500px" }}
        >
          {/* Resistance Shields */}
          {particles
            .filter((particle) => particle.resistanceLevel > 0.2)
            .map((particle) => {
              const shieldRadius = 15 + particle.resistanceLevel * 20
              const shieldOpacity = particle.resistanceLevel * 0.3
              const shieldColor =
                particle.resistanceLevel > 0.7
                  ? "rgba(34, 197, 94, 0.4)" // Green for high resistance
                  : particle.resistanceLevel > 0.4
                    ? "rgba(59, 130, 246, 0.3)" // Blue for medium resistance
                    : "rgba(156, 163, 175, 0.2)" // Gray for low resistance

              return (
                <div
                  key={`shield-${particle.id}`}
                  className="absolute pointer-events-none rounded-full border animate-pulse"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${shieldRadius * 2}px`,
                    height: `${shieldRadius * 2}px`,
                    transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px)`,
                    borderColor: shieldColor,
                    opacity: shieldOpacity,
                    boxShadow: `0 0 ${10 * particle.resistanceLevel}px ${shieldColor}`,
                    zIndex: 4,
                    animationDuration: `${2 - particle.resistanceLevel}s`,
                  }}
                />
              )
            })}

          {/* Residual Rings */}
          {residualRings.map((ring) => (
            <div
              key={ring.id}
              className="absolute pointer-events-none rounded-full border"
              style={{
                left: "50%",
                top: "50%",
                width: `${ring.radius * 2}px`,
                height: `${ring.radius * 2}px`,
                transform: `translate(-50%, -50%) translate(${ring.centerX}px, ${ring.centerY}px)`,
                borderColor: ring.color,
                opacity: ring.opacity,
                zIndex: 1,
              }}
            />
          ))}

          {/* Energy Bursts */}
          {energyBursts.map((burst) => {
            const age = (Date.now() - burst.createdAt) / 1000
            const opacity = Math.max(0, 1 - age)

            return (
              <div
                key={burst.id}
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(${burst.x}px, ${burst.y}px)`,
                  zIndex: 30,
                }}
              >
                {burst.particles.map((particle, index) => (
                  <div
                    key={index}
                    className="absolute font-mono text-white pointer-events-none"
                    style={{
                      transform: `translate(${particle.x}px, ${particle.y}px) scale(${burst.scale}) rotate(${burst.rotation}deg)`,
                      opacity,
                      textShadow: `0 0 ${20 * opacity}px currentColor`,
                      filter: `brightness(${2 + opacity}) saturate(3) hue-rotate(${age * 180}deg)`,
                      fontSize: "1rem",
                      animation: "energy-burst 1s ease-out",
                    }}
                  >
                    {particle.char}
                  </div>
                ))}
              </div>
            )
          })}

          {/* Energy Wisps */}
          {energyWisps.map((wisp) => {
            const age = (Date.now() - wisp.createdAt) / 12000
            const opacity = wisp.isBeingAbsorbed
              ? Math.max(0, 1 - (Date.now() - wisp.absorptionStartTime) / 500)
              : Math.max(0, 1 - age)
            const scale = wisp.scale * (1 - age * 0.3)

            return (
              <div
                key={wisp.id}
                className={`absolute font-mono pointer-events-none ${wisp.color}`}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(${wisp.x}px, ${wisp.y}px) scale(${scale}) rotate(${wisp.rotation}deg)`,
                  opacity,
                  textShadow: `0 0 ${10 * opacity * (wisp.isBeingAbsorbed ? 2 : 1)}px currentColor`,
                  filter: `brightness(${1 + opacity * (wisp.isBeingAbsorbed ? 2 : 1)}) blur(${age * 2}px) hue-rotate(${wisp.isBeingAbsorbed ? "60deg" : "0deg"})`,
                  fontSize: "0.8rem",
                  zIndex: 15,
                  animation: wisp.isBeingAbsorbed
                    ? "wisp-absorption 0.5s ease-in"
                    : "wisp-float 3s ease-in-out infinite alternate",
                }}
              >
                {wisp.char}
              </div>
            )
          })}

          {/* Storm Center Visualization */}
          {magneticStorm.isActive && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${magneticStorm.centerX}px, ${magneticStorm.centerY}px)`,
                zIndex: 1,
              }}
            >
              <div
                className="w-16 h-16 border-2 border-cyan-400 rounded-full opacity-60 animate-pulse"
                style={{
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 ${30 * magneticStorm.intensity}px rgba(34, 211, 238, 0.8)`,
                }}
              />
              <div
                className="absolute w-32 h-32 border border-blue-400 rounded-full opacity-40 animate-ping"
                style={{
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%",
                }}
              />
              <div
                className="absolute w-48 h-48 border border-purple-400 rounded-full opacity-20 animate-pulse"
                style={{
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%",
                  animationDelay: "0.5s",
                }}
              />
            </div>
          )}

          {/* Aftermath Center Visualization */}
          {stormAftermath.isActive && !magneticStorm.isActive && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${stormAftermath.centerX}px, ${stormAftermath.centerY}px)`,
                zIndex: 1,
              }}
            >
              <div
                className="w-12 h-12 border border-purple-400 rounded-full opacity-30 animate-pulse"
                style={{
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 ${15 * stormAftermath.intensity}px rgba(147, 51, 234, 0.5)`,
                  animationDuration: "2s",
                }}
              />
              <div
                className="absolute w-24 h-24 border border-pink-400 rounded-full opacity-20 animate-pulse"
                style={{
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%",
                  animationDelay: "1s",
                  animationDuration: "3s",
                }}
              />
            </div>
          )}

          {/* Storm Echo Visualizations */}
          {stormEchoes.map((echo) => {
            const echoAge = (Date.now() - echo.startTime) / echo.duration
            const pulseIntensity = Math.sin(echoAge * Math.PI)
            const opacity = pulseIntensity * echo.intensity * 0.4

            return (
              <div
                key={echo.id}
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(${echo.centerX}px, ${echo.centerY}px)`,
                  zIndex: 2,
                }}
              >
                {/* Echo ripple rings */}
                <div
                  className="absolute border border-gray-400 rounded-full animate-pulse"
                  style={{
                    width: `${echo.radius * 2}px`,
                    height: `${echo.radius * 2}px`,
                    transform: "translate(-50%, -50%)",
                    opacity: opacity * 0.6,
                    borderColor: `rgba(156, 163, 175, ${opacity})`,
                    boxShadow: `0 0 ${15 * echo.intensity}px rgba(156, 163, 175, ${opacity * 0.5})`,
                    animationDuration: `${2 - echo.intensity}s`,
                  }}
                />

                {/* Inner echo core */}
                <div
                  className="absolute border-2 border-slate-300 rounded-full"
                  style={{
                    width: `${Math.max(8, echo.radius * 0.3)}px`,
                    height: `${Math.max(8, echo.radius * 0.3)}px`,
                    transform: "translate(-50%, -50%)",
                    opacity: opacity,
                    borderColor: `rgba(203, 213, 225, ${opacity})`,
                    boxShadow: `0 0 ${10 * echo.intensity}px rgba(203, 213, 225, ${opacity})`,
                  }}
                />

                {/* Echo generation indicator */}
                <div
                  className="absolute text-xs font-mono text-gray-400 pointer-events-none"
                  style={{
                    transform: "translate(-50%, -200%)",
                    opacity: opacity * 0.8,
                  }}
                >
                  Echo {echo.generation}
                </div>
              </div>
            )
          })}

          {/* Lightning Effects */}
          {lightning.map((bolt) => {
            const age = (Date.now() - bolt.createdAt) / 300
            const opacity = Math.max(0, 1 - age)

            return (
              <div
                key={bolt.id}
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  zIndex: 25,
                }}
              >
                <svg
                  width="500"
                  height="500"
                  style={{
                    position: "absolute",
                    left: "-250px",
                    top: "-250px",
                    overflow: "visible",
                  }}
                >
                  <line
                    x1={250 + bolt.startX}
                    y1={250 + bolt.startY}
                    x2={250 + bolt.endX}
                    y2={250 + bolt.endY}
                    stroke="rgba(34, 211, 238, 1)"
                    strokeWidth="2"
                    opacity={opacity}
                    filter="drop-shadow(0 0 5px rgba(34, 211, 238, 0.8))"
                  />
                  {bolt.branches.map((branch, index) => (
                    <line
                      key={index}
                      x1={250 + branch.x}
                      y1={250 + branch.y}
                      x2={250 + branch.x + (Math.random() - 0.5) * 40}
                      y2={250 + branch.y + (Math.random() - 0.5) * 40}
                      stroke="rgba(34, 211, 238, 0.7)"
                      strokeWidth="1"
                      opacity={opacity * 0.7}
                    />
                  ))}
                </svg>
              </div>
            )
          })}

          {/* Magnetic Field Lines */}
          {sparkles
            .filter((sparkle) => sparkle.isBeingAttracted && sparkle.targetParticleId !== null)
            .map((sparkle) => {
              const targetParticle = particles.find((p) => p.id === sparkle.targetParticleId)
              if (!targetParticle) return null

              const baseOpacity = 0.3 - (Date.now() - sparkle.createdAt) / 5000
              const stormMultiplier = magneticStorm.isActive ? 2 : 1
              const aftermathMultiplier = stormAftermath.isActive ? 1.5 : 1
              const residualMultiplier = 1 + targetParticle.residualCharge
              const superchargeMultiplier = 1 + targetParticle.supercharge * 2
              const opacity = Math.max(
                0,
                baseOpacity * stormMultiplier * aftermathMultiplier * residualMultiplier * superchargeMultiplier,
              )

              return (
                <div
                  key={`field-${sparkle.id}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(${sparkle.x}px, ${sparkle.y}px)`,
                    zIndex: 2,
                  }}
                >
                  <svg
                    width="200"
                    height="200"
                    style={{
                      position: "absolute",
                      left: "-100px",
                      top: "-100px",
                      overflow: "visible",
                    }}
                  >
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + (targetParticle.x - sparkle.x)}
                      y2={100 + (targetParticle.y - sparkle.y)}
                      stroke={
                        targetParticle.supercharge > 0.5
                          ? "rgba(255, 255, 255, 0.8)"
                          : magneticStorm.isActive
                            ? "rgba(34, 211, 238, 0.6)"
                            : stormAftermath.isActive
                              ? "rgba(147, 51, 234, 0.5)"
                              : "rgba(147, 51, 234, 0.4)"
                      }
                      strokeWidth={
                        targetParticle.supercharge > 0.5
                          ? "3"
                          : magneticStorm.isActive
                            ? "2"
                            : stormAftermath.isActive
                              ? "1.5"
                              : "1"
                      }
                      strokeDasharray="2,2"
                      opacity={opacity}
                    >
                      <animate attributeName="stroke-dashoffset" values="0;4" dur="0.5s" repeatCount="indefinite" />
                    </line>
                  </svg>
                </div>
              )
            })}

          {/* Supercharge Auras */}
          {particles
            .filter((particle) => particle.supercharge > 0.3)
            .map((particle) => {
              const auraRadius = 20 + particle.supercharge * 30
              const auraOpacity = particle.supercharge * 0.4

              return (
                <div
                  key={`aura-${particle.id}`}
                  className="absolute pointer-events-none rounded-full border-2 border-white animate-pulse"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${auraRadius * 2}px`,
                    height: `${auraRadius * 2}px`,
                    transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px)`,
                    opacity: auraOpacity,
                    boxShadow: `0 0 ${20 * particle.supercharge}px rgba(255, 255, 255, 0.8)`,
                    zIndex: 3,
                    animationDuration: `${1 - particle.supercharge * 0.5}s`,
                  }}
                />
              )
            })}

          {/* Sparkle Effects */}
          {sparkles.map((sparkle) => {
            const baseLifetime = magneticStorm.isActive
              ? 2000
              : stormAftermath.isActive
                ? 1800
                : sparkle.generation === 0
                  ? 1500
                  : 1000
            const superchargeLifetime = sparkle.attractionStrength > 1.5 ? baseLifetime * 1.5 : baseLifetime
            const age = (Date.now() - sparkle.createdAt) / superchargeLifetime
            const opacity = Math.max(0, 1 - age)
            const scale = sparkle.scale * (1 + age * 0.5)
            const brightness = 1 + (1 - age) * (2 - sparkle.generation * 0.3)
            const isChainSparkle = sparkle.generation > 0
            const isSupercharged = sparkle.attractionStrength > 1.5
            const magneticGlow = sparkle.isBeingAttracted ? 1.5 : 1
            const stormGlow = magneticStorm.isActive ? 1.5 : 1
            const aftermathGlow = stormAftermath.isActive ? 1.3 : 1
            const superchargeGlow = isSupercharged ? 2 : 1

            return (
              <div
                key={sparkle.id}
                className={`absolute font-mono pointer-events-none ${sparkle.color}`}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(${sparkle.x}px, ${sparkle.y}px) scale(${scale * magneticGlow * stormGlow * aftermathGlow * superchargeGlow}) rotate(${sparkle.rotation}deg)`,
                  opacity,
                  textShadow: `0 0 ${15 * opacity * magneticGlow * stormGlow * aftermathGlow * superchargeGlow}px currentColor`,
                  filter: `brightness(${brightness * magneticGlow * stormGlow * aftermathGlow * superchargeGlow}) saturate(${
                    (isChainSparkle ? 2 : 1.5) * magneticGlow * stormGlow * aftermathGlow * superchargeGlow
                  }) hue-rotate(${
                    sparkle.generation * 30 +
                    (sparkle.isBeingAttracted ? 30 : 0) +
                    (magneticStorm.isActive ? 60 : 0) +
                    (stormAftermath.isActive ? 30 : 0) +
                    (isSupercharged ? 90 : 0)
                  }deg)`,
                  fontSize: isChainSparkle ? "0.8rem" : isSupercharged ? "1.4rem" : "1.2rem",
                  zIndex: 20 + sparkle.generation + (isSupercharged ? 5 : 0),
                  animation: isSupercharged
                    ? "supercharge-sparkle 0.2s ease-in-out infinite alternate"
                    : magneticStorm.isActive
                      ? "storm-sparkle 0.3s ease-in-out infinite alternate"
                      : stormAftermath.isActive
                        ? "aftermath-sparkle 0.8s ease-in-out infinite alternate"
                        : sparkle.isBeingAttracted
                          ? "magnetic-pulse 0.5s ease-in-out infinite alternate"
                          : age < 0.1
                            ? `sparkle-pop-${sparkle.generation} 0.15s ease-out`
                            : "none",
                }}
              >
                {sparkle.char}
              </div>
            )
          })}

          {/* Particle Trails */}
          {particles.map((particle) =>
            particle.trail.map((trailPoint, index) => {
              const age = index / particle.trail.length
              const opacity = Math.max(0, 1 - age)
              const scale = Math.max(0.3, 1 - age * 0.7)
              const currentTime = Date.now()
              const baseLifetime = magneticStorm.isActive
                ? 1200
                : stormAftermath.isActive
                  ? 900
                  : isDragging
                    ? 800
                    : 500
              const superchargeLifetime =
                particle.supercharge > 0 ? baseLifetime + particle.supercharge * 800 : baseLifetime
              const pointAge = (currentTime - trailPoint.timestamp) / superchargeLifetime
              const fadeOpacity = Math.max(0, (1 - pointAge) * opacity)
              const recentSparkleHit = currentTime - particle.lastSparkleHit < 200
              const magneticField = sparkles.some((s) => s.isBeingAttracted && s.targetParticleId === particle.id)
              const stormEffect = magneticStorm.isActive
              const aftermathEffect = stormAftermath.isActive
              const residualEffect = particle.residualCharge > 0.2
              const superchargeEffect = particle.supercharge > 0.3
              const resistanceEffect = particle.resistanceLevel > 0.3

              return (
                <div
                  key={`${particle.id}-trail-${index}`}
                  className={`absolute font-mono transition-all duration-75 ${particle.color} pointer-events-none`}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(${trailPoint.x}px, ${trailPoint.y}px) scale(${scale})`,
                    opacity: fadeOpacity,
                    textShadow:
                      (isDragging && index < 3) ||
                      recentSparkleHit ||
                      magneticField ||
                      stormEffect ||
                      aftermathEffect ||
                      residualEffect ||
                      superchargeEffect ||
                      resistanceEffect
                        ? `0 0 ${8 * opacity * (stormEffect ? 2 : aftermathEffect ? 1.5 : superchargeEffect ? 2.5 : 1)}px currentColor`
                        : "none",
                    filter: `brightness(${
                      0.6 +
                      opacity * 0.4 +
                      (recentSparkleHit ? 0.5 : 0) +
                      (magneticField ? 0.3 : 0) +
                      (stormEffect ? 0.7 : 0) +
                      (aftermathEffect ? 0.4 : 0) +
                      (residualEffect ? particle.residualCharge * 0.3 : 0) +
                      (superchargeEffect ? particle.supercharge * 0.8 : 0)
                    }) blur(${age * 1}px) hue-rotate(${
                      magneticField
                        ? "20deg"
                        : stormEffect
                          ? "60deg"
                          : aftermathEffect
                            ? "30deg"
                            : residualEffect
                              ? `${particle.residualCharge * 30}deg`
                              : superchargeEffect
                                ? `${particle.supercharge * 180}deg`
                                : resistanceEffect
                                  ? `${particle.resistanceLevel * -90}deg` // Green shift for resistance
                                  : "0deg"
                    })`,
                    fontSize: `${0.6 + scale * 0.4}rem`,
                    zIndex: 5,
                  }}
                >
                  {index === 0 ? particle.char : "·"}
                </div>
              )
            }),
          )}

          {/* Main Particles */}
          {particles.map((particle) => {
            const speed = Math.sqrt(particle.velocity.x ** 2 + particle.velocity.y ** 2)
            const isMovingFast = speed > 2
            const recentCollision = Date.now() - particle.lastCollisionTime < 300
            const recentSparkleHit = Date.now() - particle.lastSparkleHit < 200
            const isBeingTargeted = sparkles.some((s) => s.isBeingAttracted && s.targetParticleId === particle.id)
            const stormEffect = magneticStorm.isActive
            const aftermathEffect = stormAftermath.isActive
            const residualEffect = particle.residualCharge > 0.2
            const superchargeEffect = particle.supercharge > 0.3
            const resistanceEffect = particle.resistanceLevel > 0.3

            return (
              <div
                key={particle.id}
                className={`absolute font-mono text-lg transition-all duration-100 ${particle.color} pointer-events-none`}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(${particle.x}px, ${particle.y}px) scale(${
                    isMovingFast ||
                    recentCollision ||
                    recentSparkleHit ||
                    isBeingTargeted ||
                    stormEffect ||
                    aftermathEffect ||
                    residualEffect ||
                    superchargeEffect ||
                    resistanceEffect
                      ? 1.4 +
                        (stormEffect ? 0.3 * (1 - particle.resistanceLevel * 0.5) : 0) +
                        (aftermathEffect ? 0.2 : 0) +
                        (residualEffect ? particle.residualCharge * 0.2 : 0) +
                        (superchargeEffect ? particle.supercharge * 0.5 : 0) +
                        (resistanceEffect ? particle.resistanceLevel * 0.3 : 0)
                      : 1
                  })`,
                  textShadow:
                    isDragging ||
                    isMovingFast ||
                    recentCollision ||
                    recentSparkleHit ||
                    isBeingTargeted ||
                    stormEffect ||
                    aftermathEffect ||
                    residualEffect ||
                    superchargeEffect ||
                    resistanceEffect
                      ? `0 0 ${15 * (stormEffect ? 2 * (1 - particle.resistanceLevel * 0.3) : aftermathEffect ? 1.5 : 1) * (1 + particle.residualCharge) * (1 + particle.supercharge * 2) * (1 + particle.resistanceLevel * 0.5)}px currentColor`
                      : "none",
                  filter: `brightness(${
                    isDragging ||
                    isMovingFast ||
                    recentCollision ||
                    recentSparkleHit ||
                    isBeingTargeted ||
                    stormEffect ||
                    aftermathEffect ||
                    residualEffect ||
                    superchargeEffect ||
                    resistanceEffect
                      ? 2.5 +
                        (stormEffect ? 1 * (1 - particle.resistanceLevel * 0.4) : 0) +
                        (aftermathEffect ? 0.5 : 0) +
                        (residualEffect ? particle.residualCharge : 0) +
                        (superchargeEffect ? particle.supercharge * 1.5 : 0) +
                        (resistanceEffect ? particle.resistanceLevel * 0.8 : 0)
                      : 1
                  }) saturate(${
                    isMovingFast ||
                    recentCollision ||
                    recentSparkleHit ||
                    isBeingTargeted ||
                    stormEffect ||
                    aftermathEffect ||
                    residualEffect ||
                    superchargeEffect ||
                    resistanceEffect
                      ? 2 +
                        (stormEffect ? 0.5 : 0) +
                        (aftermathEffect ? 0.3 : 0) +
                        (residualEffect ? particle.residualCharge * 0.5 : 0) +
                        (superchargeEffect ? particle.supercharge * 1.2 : 0) +
                        (resistanceEffect ? particle.resistanceLevel * 0.6 : 0)
                      : 1
                  }) hue-rotate(${
                    recentSparkleHit
                      ? "60deg"
                      : isBeingTargeted
                        ? "20deg"
                        : stormEffect
                          ? "120deg"
                          : aftermathEffect
                            ? "60deg"
                            : residualEffect
                              ? `${particle.residualCharge * 30}deg`
                              : superchargeEffect
                                ? `${particle.supercharge * 180}deg`
                                : resistanceEffect
                                  ? `${particle.resistanceLevel * -90}deg` // Green shift for resistance
                                  : "0deg"
                  })`,
                  zIndex: 10,
                  animation: resistanceEffect
                    ? "resistance-glow 1.5s ease-in-out infinite alternate"
                    : superchargeEffect
                      ? "supercharge-particle 0.3s ease-in-out infinite alternate"
                      : stormEffect
                        ? "storm-particle 0.5s ease-in-out infinite alternate"
                        : aftermathEffect
                          ? "aftermath-particle 1s ease-in-out infinite alternate"
                          : recentCollision || recentSparkleHit
                            ? `particle-flash-${recentSparkleHit ? "chain" : "normal"} 0.3s ease-out`
                            : isBeingTargeted
                              ? "magnetic-target 1s ease-in-out infinite alternate"
                              : residualEffect
                                ? "residual-glow 2s ease-in-out infinite alternate"
                                : "none",
                }}
              >
                {particle.char}
              </div>
            )
          })}

          {/* Main Donut */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
            <pre
              ref={donutRef}
              className={`
                font-mono text-sm leading-tight transition-all duration-300 ease-in-out
                animate-spin
                ${isHovered ? "text-yellow-400 scale-110 drop-shadow-[0_0_15px_rgba(255,255,0,0.8)]" : "text-green-400"}
                ${isDragging ? "text-orange-400 scale-125" : ""}
                ${magneticStorm.isActive ? "text-cyan-400 scale-130" : ""}
                ${stormAftermath.isActive && !magneticStorm.isActive ? "text-purple-400 scale-115" : ""}
              `}
              style={{
                animationDuration: magneticStorm.isActive
                  ? "0.3s"
                  : stormAftermath.isActive
                    ? "0.8s"
                    : isHovered
                      ? "1s"
                      : isDragging
                        ? "0.5s"
                        : "3s",
                textShadow:
                  isHovered || isDragging || magneticStorm.isActive || stormAftermath.isActive
                    ? `0 0 ${15 * (magneticStorm.isActive ? 2 : stormAftermath.isActive ? 1.5 : 1)}px currentColor`
                    : "none",
                filter: magneticStorm.isActive
                  ? `brightness(2) saturate(2) hue-rotate(${magneticStorm.intensity * 60}deg)`
                  : stormAftermath.isActive
                    ? `brightness(1.5) saturate(1.5) hue-rotate(${stormAftermath.intensity * 30}deg)`
                    : "none",
              }}
            >
              {asciiVariations[currentVariation]}
            </pre>
          </div>

          {/* Enhanced glow effects */}
          {(isDragging || magneticStorm.isActive || stormAftermath.isActive) && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
              <div
                className={`w-80 h-80 border-2 ${
                  magneticStorm.isActive
                    ? "border-cyan-400"
                    : stormAftermath.isActive
                      ? "border-purple-400"
                      : "border-orange-400"
                } rounded-full opacity-15 animate-pulse`}
              ></div>
              <div
                className={`absolute w-64 h-64 border ${
                  magneticStorm.isActive
                    ? "border-blue-400"
                    : stormAftermath.isActive
                      ? "border-pink-400"
                      : "border-yellow-400"
                } rounded-full opacity-25 animate-ping`}
              ></div>
              <div
                className={`absolute w-96 h-96 border ${
                  magneticStorm.isActive
                    ? "border-purple-400"
                    : stormAftermath.isActive
                      ? "border-blue-400"
                      : "border-red-400"
                } rounded-full opacity-10 animate-pulse`}
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-green-300 text-sm">🍩 Drag particles • Press SPACE for magnetic storm! ⚡</p>
          <p className="text-gray-400 text-xs">
            Particles absorb energy wisps to become supercharged with enhanced abilities!
          </p>
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-green-800">
          <h2 className="text-lg font-semibold mb-2 text-green-300">Storm Resistance Features:</h2>
          <ul className="text-sm text-green-400 space-y-1 text-left">
            <li>• 🛡️ **Memory System**: Particles remember storm exposures for 1 minute</li>
            <li>• 📈 **Resistance Building**: Each exposure increases resistance to future storms</li>
            <li>• 🌊 **Reduced Impact**: Resistant particles experience 70% less storm displacement</li>
            <li>• 🔰 **Visual Shields**: Resistance levels shown with colored protective auras</li>
            <li>• ⏰ **Gradual Decay**: Resistance fades over time without reinforcement</li>
            <li>• 🎯 **Veteran Status**: Highly resistant particles glow with green energy</li>
            <li>• 📊 **Exposure Tracking**: System tracks total storm exposures per particle</li>
            <li>• 🏆 **Resistance Milestones**: Counter increases every 3rd exposure milestone</li>
          </ul>
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-green-800">
          <h2 className="text-lg font-semibold mb-2 text-green-300">Storm Echo Features:</h2>
          <ul className="text-sm text-green-400 space-y-1 text-left">
            <li>• 🌊 **Echo Generation**: Major storms (&gt;50% intensity) create 1-4 aftershock echoes</li>
            <li>• ⏱️ **Staggered Timing**: Echoes appear 2+ seconds after storm with random delays</li>
            <li>• 📍 **Scattered Positions**: Each echo appears near but offset from original storm center</li>
            <li>• 📉 **Diminishing Intensity**: Each successive echo is 30% weaker than the previous</li>
            <li>• 🌀 **Ripple Effects**: Echoes create expanding circular pulses with sine wave intensity</li>
            <li>• ⚡ **Gentle Lightning**: Stronger echoes generate subtle lightning effects</li>
            <li>• ✨ **Echo Sparkles**: Unique gray-toned sparkles with ghostly appearance</li>
            <li>• 🛡️ **Resistance Applies**: Resistant particles experience 50% reduced echo effects</li>
          </ul>
        </div>

        <style jsx>{`
          @keyframes sparkle-pop-0 {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
            100% { transform: scale(1) rotate(360deg); opacity: 1; }
          }
          @keyframes sparkle-pop-1 {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(120deg); opacity: 1; }
            100% { transform: scale(0.8) rotate(240deg); opacity: 1; }
          }
          @keyframes sparkle-pop-2 {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1) rotate(90deg); opacity: 1; }
            100% { transform: scale(0.6) rotate(180deg); opacity: 1; }
          }
          @keyframes particle-flash-normal {
            0% { filter: brightness(1) saturate(1); }
            50% { filter: brightness(3) saturate(2); }
            100% { filter: brightness(1) saturate(1); }
          }
          @keyframes particle-flash-chain {
            0% { filter: brightness(1) saturate(1) hue-rotate(0deg); }
            50% { filter: brightness(4) saturate(3) hue-rotate(60deg); }
            100% { filter: brightness(1) saturate(1) hue-rotate(0deg); }
          }
          @keyframes magnetic-pulse {
            0% { transform: scale(1) rotate(0deg); }
            100% { transform: scale(1.1) rotate(5deg); }
          }
          @keyframes magnetic-target {
            0% { filter: brightness(1) saturate(1) hue-rotate(0deg); }
            100% { filter: brightness(1.5) saturate(1.5) hue-rotate(20deg); }
          }
          @keyframes storm-sparkle {
            0% { transform: scale(1) rotate(0deg); filter: brightness(1.5) saturate(2); }
            100% { transform: scale(1.3) rotate(10deg); filter: brightness(2.5) saturate(3); }
          }
          @keyframes storm-particle {
            0% { filter: brightness(2) saturate(2) hue-rotate(120deg); }
            100% { filter: brightness(3) saturate(3) hue-rotate(180deg); }
          }
          @keyframes aftermath-sparkle {
            0% { transform: scale(1) rotate(0deg); filter: brightness(1.3) saturate(1.8); }
            100% { transform: scale(1.2) rotate(8deg); filter: brightness(2) saturate(2.5); }
          }
          @keyframes aftermath-particle {
            0% { filter: brightness(1.5) saturate(1.5) hue-rotate(60deg); }
            100% { filter: brightness(2) saturate(2) hue-rotate(90deg); }
          }
          @keyframes residual-glow {
            0% { filter: brightness(1) saturate(1) hue-rotate(0deg); }
            100% { filter: brightness(1.3) saturate(1.3) hue-rotate(15deg); }
          }
          @keyframes wisp-float {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-5px); }
          }
          @keyframes wisp-absorption {
            0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
            100% { transform: scale(0.3) rotate(180deg); filter: brightness(3); }
          }
          @keyframes energy-burst {
            0% { transform: scale(0) rotate(0deg); opacity: 1; }
            50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
            100% { transform: scale(3) rotate(360deg); opacity: 0; }
          }
          @keyframes supercharge-sparkle {
            0% { transform: scale(1) rotate(0deg); filter: brightness(2) saturate(3); }
            100% { transform: scale(1.4) rotate(15deg); filter: brightness(4) saturate(4); }
          }
          @keyframes supercharge-particle {
            0% { filter: brightness(2.5) saturate(2.5) hue-rotate(120deg); }
            100% { filter: brightness(4) saturate(4) hue-rotate(240deg); }
          }
          @keyframes resistance-glow {
            0% { filter: brightness(1) saturate(1) hue-rotate(-90deg); }
            100% { filter: brightness(1.5) saturate(1.5) hue-rotate(-60deg); }
          }
          @keyframes echo-pulse {
            0% { transform: scale(0.8) rotate(0deg); opacity: 0.3; }
            50% { transform: scale(1.1) rotate(2deg); opacity: 0.7; }
            100% { transform: scale(0.9) rotate(0deg); opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  )
}
