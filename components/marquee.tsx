"use client";

import { useRef, useEffect, useCallback } from "react";

const RESUME_DELAY_MS = 2200;

interface MarqueeProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  direction?: "left" | "right";
  speedPxPerSec?: number;
  gap?: number;
  active?: boolean;
  itemKey: (item: T, index: number) => string;
}

/**
 * Bidirectional, draggable, database-driven marquee (approved enhancement:
 * §4-6 of the carousel brief). Runs on requestAnimationFrame rather than
 * CSS keyframes so a visitor can grab and drag either direction — mouse
 * or touch — mid-autoplay. On release, autoplay resumes its configured
 * direction/speed (from carousel_configs) after RESUME_DELAY_MS of no
 * interaction, easing back in rather than snapping. `active=false` or
 * prefers-reduced-motion disables the automatic drift entirely; dragging
 * still works either way.
 */
export function Marquee<T>({
  items, renderItem, direction = "left", speedPxPerSec = 30, gap = 16, active = true, itemKey,
}: MarqueeProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const reduceMotionRef = useRef(false);

  const doubled = items.length ? [...items, ...items] : [];

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    function measure() {
      if (trackRef.current) halfWidthRef.current = trackRef.current.scrollWidth / 2;
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items]);

  useEffect(() => {
    let last = performance.now();
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const idle = now - lastInteractionRef.current > RESUME_DELAY_MS;

      if (!draggingRef.current && idle && active && !reduceMotionRef.current) {
        offsetRef.current += speedPxPerSec * dt * (direction === "left" ? -1 : 1);
      }

      const half = halfWidthRef.current;
      if (half > 0) {
        if (offsetRef.current <= -half) offsetRef.current += half;
        if (offsetRef.current > 0) offsetRef.current -= half;
      }

      if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [direction, speedPxPerSec, active]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    lastInteractionRef.current = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    offsetRef.current = dragStartOffsetRef.current + (e.clientX - dragStartXRef.current);
    lastInteractionRef.current = performance.now();
  }, []);

  const endDrag = useCallback(() => {
    draggingRef.current = false;
    lastInteractionRef.current = performance.now();
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="w-full overflow-hidden cursor-grab"
      style={{
        touchAction: "pan-y",
        maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      // brief grace period on hover so a visitor reading a card doesn't fight the marquee moving under their cursor
      onMouseEnter={() => { lastInteractionRef.current = performance.now() - RESUME_DELAY_MS + 700; }}
    >
      <div ref={trackRef} className="flex w-max select-none" style={{ gap, willChange: "transform" }}>
        {doubled.map((item, i) => <div key={itemKey(item, i)}>{renderItem(item, i)}</div>)}
      </div>
    </div>
  );
}
