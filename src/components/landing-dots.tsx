"use client";

import { useEffect, useRef } from "react";

const SPACING = 46;
const JITTER = 12;
const DOT_RADIUS = 1.3;
const REACH = 170;
const PUSH = 10;
const STRETCH = 30;
const EASE = 9;

type Dot = { x: number; y: number; ox: number; oy: number };

function noise(seed: number) {
  const value = Math.sin(seed) * 43758.5453;
  return value - Math.floor(value);
}

export function LandingDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const color = getComputedStyle(canvas).color;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 };
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;

    const layout = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots = [];
      for (let row = 0; row * SPACING < height + SPACING; row++)
        for (let column = 0; column * SPACING < width + SPACING; column++) {
          const shiftX = (noise(column * 12.9898 + row * 78.233) - 0.5) * 2 * JITTER;
          const shiftY = (noise(column * 39.3468 + row * 11.135) - 0.5) * 2 * JITTER;
          dots.push({
            x: (column + 0.5) * SPACING + shiftX,
            y: (row + 0.5) * SPACING + shiftY,
            ox: 0,
            oy: 0,
          });
        }
    };

    const draw = (time: number) => {
      const step = last ? Math.min((time - last) / 1000, 0.05) : 1 / 60;
      const blend = 1 - Math.exp(-EASE * step);
      last = time;
      pointer.x += (pointer.tx - pointer.x) * blend;
      pointer.y += (pointer.ty - pointer.y) * blend;
      pointer.strength += (pointer.target - pointer.strength) * blend;
      if (Math.abs(pointer.target - pointer.strength) < 0.002) pointer.strength = pointer.target;
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      context.strokeStyle = color;
      context.lineWidth = DOT_RADIUS * 2;
      context.lineCap = "round";
      let moving =
        Math.abs(pointer.target - pointer.strength) > 0.002 ||
        Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.1;
      const lines = new Path2D();
      const points = new Path2D();
      for (const dot of dots) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const pull = distance < REACH ? (1 - distance / REACH) ** 2 * pointer.strength : 0;
        const tx = (dx / distance) * PUSH * pull;
        const ty = (dy / distance) * PUSH * pull;
        dot.ox += (tx - dot.ox) * blend;
        dot.oy += (ty - dot.oy) * blend;
        if (Math.abs(tx - dot.ox) + Math.abs(ty - dot.oy) > 0.05) moving = true;
        else {
          dot.ox = tx;
          dot.oy = ty;
        }
        const x = dot.x + dot.ox;
        const y = dot.y + dot.oy;
        const toX = pointer.x - x;
        const toY = pointer.y - y;
        const gap = Math.hypot(toX, toY) || 1;
        const length = gap < REACH ? STRETCH * (1 - gap / REACH) ** 2 * pointer.strength : 0;
        if (length > 0.5) {
          lines.moveTo(x, y);
          lines.lineTo(x + (toX / gap) * length, y + (toY / gap) * length);
        } else {
          points.moveTo(x + DOT_RADIUS, y);
          points.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        }
      }
      context.stroke(lines);
      context.fill(points);
      frame = moving ? requestAnimationFrame(draw) : 0;
      if (!frame) last = 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      if (!pointer.target) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.target = 1;
      wake();
    };

    const leave = () => {
      pointer.target = 0;
      wake();
    };

    const resize = () => {
      layout();
      wake();
    };

    layout();
    wake();
    window.addEventListener("resize", resize);
    if (!still) {
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      window.addEventListener("blur", leave);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-dots" />;
}
