"use client";

import { useEffect, useRef } from "react";

const BLUE = "47,111,237";
const CYAN = "72,216,232";

/**
 * Dynamic ICT Technology Field — ambient canvas background (approved
 * enhancement, §15-22 of the brief). Slowly-drifting nodes form faint
 * connection lines when nearby, evoking a "living" technology ecosystem
 * rather than a static gradient or an icon wallpaper. Purely decorative:
 * fixed, pointer-events: none, masked so it's strongest near the top of
 * the page and fades before it can compete with body copy. Node count
 * scales down on narrow viewports; collapses to a single static frame
 * under prefers-reduced-motion (no RAF loop at all, not just slower).
 * Mounted once in app/layout.tsx so it's consistent site-wide.
 */
export function TechField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0, height = 0;
    let nodes: { x: number; y: number; vx: number; vy: number; r: number; cyan: boolean; phase: number }[] = [];

    function nodeCount() {
      if (width < 640) return 16;
      if (width < 1100) return 30;
      return 52;
    }

    function init() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from({ length: nodeCount() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 1 + Math.random() * 1.6,
        cyan: Math.random() > 0.7,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const linkDist = width < 640 ? 90 : 140;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!, b = nodes[j]!;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx!.strokeStyle = `rgba(${CYAN},${(1 - dist / linkDist) * 0.12})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const n of nodes) {
        n.phase += 0.01;
        const twinkle = 0.35 + Math.sin(n.phase) * 0.15;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = n.cyan ? `rgba(${CYAN},${twinkle})` : `rgba(${BLUE},${twinkle + 0.1})`;
        ctx!.fill();

        if (!reduceMotion) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < -10) n.x = width + 10; if (n.x > width + 10) n.x = -10;
          if (n.y < -10) n.y = height + 10; if (n.y > height + 10) n.y = -10;
        }
      }
    }

    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }

    init();
    if (reduceMotion) draw();
    else loop();

    function handleResize() { init(); if (reduceMotion) draw(); }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0, opacity: 0.55,
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 85%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 85%)",
      }}
    />
  );
}
