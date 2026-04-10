"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, useMotionValue, animate } from "framer-motion";
import { PRICE_FLASH_MS } from "./constants";

export function useCountUp(target: number, options: { decimals?: number } = {}) {
  const { decimals = 2 } = options;
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const [display, setDisplay] = useState(target.toFixed(decimals));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      motionValue.set(0);
    }
    const controls = animate(motionValue, target, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [target, motionValue]);

  useEffect(() => {
    const unsub = springValue.on("change", (v) => setDisplay(v.toFixed(decimals)));
    return unsub;
  }, [springValue, decimals]);

  return display;
}

export function usePriceFlash(value: number): string {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"none" | "up" | "down">("none");

  useEffect(() => {
    if (prev.current !== value) {
      setFlash(value > prev.current ? "up" : "down");
      prev.current = value;
      const t = setTimeout(() => setFlash("none"), PRICE_FLASH_MS);
      return () => clearTimeout(t);
    }
  }, [value]);

  if (flash === "up") return "animate-flash-green";
  if (flash === "down") return "animate-flash-red";
  return "";
}

export function useAnimatedPercentage(targetPercent: number, delay = 0.3) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      animate(motionValue, targetPercent, { duration: 1.0, ease: [0.16, 1, 0.3, 1] });
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [targetPercent, motionValue, delay]);

  useEffect(() => {
    const unsub = springValue.on("change", (v) => setCurrent(v));
    return unsub;
  }, [springValue]);

  return current;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
