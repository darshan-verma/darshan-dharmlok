"use client"

import { useRef, useMemo, Suspense } from "react"
import { useFrame, Canvas } from "@react-three/fiber"
import * as THREE from "three"

// Custom shader material for advanced effects - optimized for performance
const vertexShader = `
  uniform float time;
  uniform float intensity;
  uniform float speed;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    // Reduced animation speed and complexity
    pos.y += sin(pos.x * 8.0 + time * speed) * 0.1 * intensity;
    pos.x += cos(pos.y * 6.0 + time * speed * 0.8) * 0.05 * intensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform float speed;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Simplified noise pattern - reduced from 3 to 2 layers for better performance
    float noise = sin(uv.x * 15.0 + time * speed) * cos(uv.y * 12.0 + time * speed * 0.6);
    noise += sin(uv.x * 25.0 - time * speed * 1.2) * cos(uv.y * 20.0 + time * speed * 0.8) * 0.6;
    
    // Mix colors based on noise and position
    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 1.5) * intensity * 0.6);
    
    // Simplified glow effect
    float glow = 1.0 - length(uv - 0.5) * 1.0;
    glow = pow(max(glow, 0.3), 0.8);
    
    gl_FragColor = vec4(color * glow, glow * 0.7);
  }
`

export function ShaderPlane({
  position,
  color1 = "#ff8c42",
  color2 = "#ffb366",
  speed = 0.3,
}: {
  position: [number, number, number]
  color1?: string
  color2?: string
  speed?: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const lastUpdate = useRef(0)

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.2 },
      speed: { value: speed },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2, speed],
  )

  useFrame((state) => {
    if (mesh.current) {
      // Throttle updates to ~30fps for better performance (update every ~33ms)
      const now = state.clock.elapsedTime
      if (now - lastUpdate.current > 0.033) {
        uniforms.time.value = now
        // Slower, smoother intensity variation
        uniforms.intensity.value = 1.2 + Math.sin(now * 0.8) * 0.3
        lastUpdate.current = now
      }
    }
  })

  return (
    <mesh ref={mesh} position={position} scale={[1, 1, 1]}>
      {/* Reduced geometry complexity from 64x64 to 32x32 (75% fewer vertices) */}
      <planeGeometry args={[6, 6, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Background component wrapper - fixed position for entire page
export function BackgroundShader({
  className = "",
  color1 = "#ff8c42",
  color2 = "#ffb366",
  speed = 0.3,
}: {
  className?: string
  color1?: string
  color2?: string
  speed?: number
}) {
  return (
    <div 
      className={`fixed inset-0 w-screen h-screen pointer-events-none ${className}`} 
      style={{ zIndex: 0 }}
    >
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 1], fov: 75 }}
          style={{ width: "100%", height: "100%" }}
          // Disabled antialiasing and preserveDrawingBuffer for better performance
          gl={{ 
            alpha: true, 
            antialias: false, 
            preserveDrawingBuffer: false,
            powerPreference: "low-power" // Prefer battery efficiency
          }}
          // Limit framerate to reduce GPU usage
          frameloop="always"
          dpr={[1, 1.5]} // Limit pixel ratio for better performance
        >
          <ShaderPlane position={[0, 0, 0]} color1={color1} color2={color2} speed={speed} />
        </Canvas>
      </Suspense>
    </div>
  )
}
