"use client";

import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";

interface Marker {
  id: string;
  location: [number, number];
  label: string;
}

interface Arc {
  id: string;
  from: [number, number];
  to: [number, number];
  label?: string;
}

interface GlobeProps {
  markers?: Marker[];
  arcs?: Arc[];
  className?: string;
  markerColor?: [number, number, number];
  baseColor?: [number, number, number];
  arcColor?: [number, number, number];
  glowColor?: [number, number, number];
  dark?: number;
  mapBrightness?: number;
  markerSize?: number;
  markerElevation?: number;
  arcWidth?: number;
  arcHeight?: number;
  speed?: number;
  theta?: number;
  diffuse?: number;
  mapSamples?: number;
}

const GLOBE_SCALE = 1.15;
const SPHERE_RADIUS_FACTOR = 0.8;
const LABEL_OFFSET_Y = -10;

function projectToScreen(
  location: [number, number],
  phi: number,
  theta: number,
  size: number,
): { x: number; y: number; vz: number; visible: boolean } {
  const [lat, lon] = location;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);

  const wx = -cosLat * Math.cos(lonRad);
  const wy = Math.sin(latRad);
  const wz = cosLat * Math.sin(lonRad);

  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);

  const vx = wx * cp + wz * sp;
  const vy = wx * sp * st + wy * ct - wz * cp * st;
  const vz = -wx * sp * ct + wy * st + wz * cp * ct;

  const r = SPHERE_RADIUS_FACTOR * GLOBE_SCALE * (size / 2);

  return {
    x: size / 2 + vx * r,
    y: size / 2 - vy * r,
    vz,
    visible: vz > 0,
  };
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0.3, 0.45, 0.85],
  baseColor = [1, 1, 1],
  arcColor = [0.3, 0.45, 0.85],
  glowColor = [0.94, 0.93, 0.91],
  dark = 0,
  mapBrightness = 10,
  markerSize = 0.025,
  markerElevation = 0.01,
  arcWidth = 0.5,
  arcHeight = 0.25,
  speed = 0.003,
  theta = 0.2,
  diffuse = 1.5,
  mapSamples = 16000,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const arcPathElsRef = useRef<Map<string, SVGPathElement>>(new Map());
  const arcLabelElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const velocity = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x;
      const deltaY = e.clientY - pointerInteracting.current.y;
      dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 };
      const now = Date.now();
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.t, 1);
        const cap = 0.15;
        velocity.current = {
          phi: Math.max(-cap, Math.min(cap, ((e.clientX - lastPointer.current.x) / dt) * 0.3)),
          theta: Math.max(-cap, Math.min(cap, ((e.clientY - lastPointer.current.y) / dt) * 0.08)),
        };
      }
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
      lastPointer.current = null;
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let phi = 0;
    let resizeObserver: ResizeObserver | null = null;

    const localMarkers = markers;
    const localArcs = arcs;
    const localArcHeight = arcHeight;

    function updateOverlay(currentPhi: number, currentTheta: number) {
      const size = canvas.offsetWidth;
      if (!size) return;

      localMarkers.forEach((m) => {
        const el = markerElsRef.current.get(m.id);
        if (!el) return;
        const p = projectToScreen(m.location, currentPhi, currentTheta, size);
        const opacity = p.visible ? Math.min(1, p.vz * 3) : 0;
        el.style.transform = `translate3d(${p.x}px, ${p.y + LABEL_OFFSET_Y}px, 0) translate(-50%, -100%)`;
        el.style.opacity = String(opacity * 0.95);
      });

      localArcs.forEach((arc) => {
        const pathEl = arcPathElsRef.current.get(arc.id);
        const labelEl = arcLabelElsRef.current.get(arc.id);
        const from = projectToScreen(arc.from, currentPhi, currentTheta, size);
        const to = projectToScreen(arc.to, currentPhi, currentTheta, size);
        const bothVisible = from.visible && to.visible;

        if (pathEl) {
          if (bothVisible) {
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const curve = Math.min(80, len * 0.35) * Math.max(0.2, localArcHeight);
            const cx = midX + nx * curve;
            const cy = midY + ny * curve;

            pathEl.setAttribute(
              "d",
              `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
            );
            const arcOpacity = Math.min(from.vz, to.vz) * 2.5;
            pathEl.style.opacity = String(Math.min(0.8, arcOpacity));

            if (labelEl) {
              labelEl.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -140%)`;
              labelEl.style.opacity = String(Math.min(0.9, arcOpacity));
            }
          } else {
            pathEl.style.opacity = "0";
            if (labelEl) labelEl.style.opacity = "0";
          }
        }
      });
    }

    function init() {
      const cssWidth = canvas.offsetWidth;
      if (cssWidth === 0 || globe) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scaledWidth = cssWidth * dpr;

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: scaledWidth,
        height: scaledWidth,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markers: localMarkers.map((m) => ({
          location: m.location,
          size: markerSize,
        })),
        scale: GLOBE_SCALE,
        opacity: 0.7,
        onRender: (state) => {
          if (!isPausedRef.current) {
            phi += speed;
            if (
              Math.abs(velocity.current.phi) > 0.0001 ||
              Math.abs(velocity.current.theta) > 0.0001
            ) {
              phiOffsetRef.current += velocity.current.phi;
              thetaOffsetRef.current += velocity.current.theta;
              velocity.current.phi *= 0.95;
              velocity.current.theta *= 0.95;
            }
            const thetaMin = -0.4;
            const thetaMax = 0.4;
            if (thetaOffsetRef.current < thetaMin) {
              thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1;
            } else if (thetaOffsetRef.current > thetaMax) {
              thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1;
            }
          }

          const currentPhi = phi + phiOffsetRef.current + dragOffset.current.phi;
          const currentTheta = theta + thetaOffsetRef.current + dragOffset.current.theta;
          state.phi = currentPhi;
          state.theta = currentTheta;
          state.dark = dark;
          state.diffuse = diffuse;
          state.mapSamples = mapSamples;
          state.mapBrightness = mapBrightness;
          state.baseColor = baseColor;
          state.markerColor = markerColor;
          state.glowColor = glowColor;
          state.markers = localMarkers.map((m) => ({
            location: m.location,
            size: markerSize,
          }));

          updateOverlay(currentPhi, currentTheta);
        },
      });

      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObserver?.disconnect();
          init();
        }
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      resizeObserver?.disconnect();
      globe?.destroy();
    };
  }, [
    markers,
    arcs,
    markerColor,
    baseColor,
    arcColor,
    glowColor,
    dark,
    mapBrightness,
    markerSize,
    markerElevation,
    arcWidth,
    arcHeight,
    speed,
    theta,
    diffuse,
    mapSamples,
  ]);

  const strokeColor = `rgb(${Math.round(arcColor[0] * 255)} ${Math.round(arcColor[1] * 255)} ${Math.round(arcColor[2] * 255)})`;

  return (
    <div className={`relative aspect-square w-full max-w-[600px] select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />

      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {arcs.map((arc) => (
          <path
            key={arc.id}
            ref={(el) => {
              if (el) arcPathElsRef.current.set(arc.id, el);
              else arcPathElsRef.current.delete(arc.id);
            }}
            fill="none"
            stroke={strokeColor}
            strokeWidth={Math.max(1, arcWidth * 2)}
            strokeDasharray="8 6"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
        ))}
      </svg>

      {markers.map((m) => (
        <div
          key={m.id}
          ref={(el) => {
            if (el) markerElsRef.current.set(m.id, el);
            else markerElsRef.current.delete(m.id);
          }}
          className="pointer-events-none absolute left-0 top-0 will-change-transform"
          style={{ opacity: 0 }}
        >
          <div
            style={{
              padding: "2px 8px",
              background: "#1a1a2e",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              borderRadius: "2px",
              position: "relative",
            }}
          >
            {m.label}
            <span
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #1a1a2e",
              }}
            />
          </div>
        </div>
      ))}

      {arcs
        .filter((a) => a.label)
        .map((a) => (
          <div
            key={`${a.id}-label`}
            ref={(el) => {
              if (el) arcLabelElsRef.current.set(a.id, el);
              else arcLabelElsRef.current.delete(a.id);
            }}
            className="pointer-events-none absolute left-0 top-0 will-change-transform"
            style={{ opacity: 0 }}
          >
            <div
              style={{
                padding: "2px 6px",
                background: "#fff",
                color: "#1a1a2e",
                fontFamily: "monospace",
                fontSize: "clamp(0.45rem, 1vw, 0.55rem)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                borderRadius: "2px",
              }}
            >
              {a.label}
            </div>
          </div>
        ))}

      <style jsx>{`
        @keyframes cobeArcDash {
          to {
            stroke-dashoffset: -28;
          }
        }
      `}</style>
    </div>
  );
}
