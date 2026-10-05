"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient 3D wave mesh behind the sign-in card (ported from the scrapper app).
 * Monochrome slate wireframe, gentle waves, ripples where you click.
 * Draws one still frame for people who prefer reduced motion.
 */
export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;

    const rotX = 0.38;
    let touchX = 0;
    let touchZ = 0;
    let touchEnergy = 0;
    let isTouching = false;
    const rings: { x: number; z: number; radius: number; amplitude: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) draw(0);
    };

    const cols = 34;
    const rows = 26;
    const spacing = 58;
    const originX = -((cols - 1) * spacing) / 2;
    const originZ = -220;

    const project = (x: number, y: number, z: number) => {
      const y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
      const z2 = z * Math.cos(rotX) + y * Math.sin(rotX);
      const depth = z2 + 650;
      if (depth <= 20) return null;
      const scale = 520 / depth;
      return { x: width / 2 + x * scale, y: height / 2 + y2 * scale, depth };
    };

    const toGround = (sx: number, sy: number) => {
      const scale = 520 / (320 + 650);
      return { x: (sx - width / 2) / scale, z: 320 + ((sy - height / 2) / scale) * 0.6 };
    };

    const onMove = (e: PointerEvent) => {
      const p = toGround(e.clientX, e.clientY);
      touchX = p.x;
      touchZ = p.z;
      isTouching = true;
      touchEnergy = Math.min(1.4, touchEnergy + 0.15);
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("input, button, a, label, form")) return;
      const p = toGround(e.clientX, e.clientY);
      touchX = p.x;
      touchZ = p.z;
      touchEnergy = 1.6;
      rings.push({ x: p.x, z: p.z, radius: 5, amplitude: 18 });
    };
    const onLeave = () => {
      isTouching = false;
    };

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);

      const bg = ctx!.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, Math.max(width, height) * 0.8);
      bg.addColorStop(0, "#f8fafc");
      bg.addColorStop(0.45, "#f1f5f9");
      bg.addColorStop(1, "#e2e8f0");
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, width, height);

      const glow = ctx!.createRadialGradient(width / 2, height * 0.75, 40, width / 2, height * 0.75, 500);
      glow.addColorStop(0, "rgba(148, 163, 184, 0.16)");
      glow.addColorStop(1, "rgba(148, 163, 184, 0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);

      const pts: (ReturnType<typeof project>)[][] = [];
      for (let r = 0; r < rows; r++) {
        pts[r] = [];
        for (let c = 0; c < cols; c++) {
          const wx = originX + c * spacing;
          const wz = originZ + r * spacing;
          const dist = Math.hypot(wx, wz) * 0.003;
          let y =
            220 + Math.sin(c * 0.36 + time * 1.2) * 24 + Math.cos(r * 0.3 + time * 0.9) * 20 + Math.sin(dist * 5.8 - time * 1.5) * 16;

          if (touchEnergy > 0 || isTouching) {
            const d = Math.hypot(wx - touchX, wz - touchZ);
            if (d < 260) y += Math.sin(d * 0.18 - time * 28) * 9 * touchEnergy * Math.cos((d / 260) * (Math.PI / 2));
          }
          for (const ring of rings) {
            const front = Math.hypot(wx - ring.x, wz - ring.z) - ring.radius;
            if (Math.abs(front) < 80) y += Math.sin(front * 0.35 - time * 35) * ring.amplitude * Math.cos((front / 80) * Math.PI);
          }
          pts[r][c] = project(wx, y, wz);
        }
      }

      ctx!.lineWidth = 1;
      const line = (a: ReturnType<typeof project>, b: ReturnType<typeof project>) => {
        if (!a || !b) return;
        const alpha = Math.max(0.04, Math.min(0.35, 1 - ((a.depth + b.depth) / 2 - 300) / 780));
        ctx!.strokeStyle = `rgba(15, 23, 42, ${alpha * 0.75})`;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      };
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols - 1; c++) line(pts[r][c], pts[r][c + 1]);
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows - 1; r++) line(pts[r][c], pts[r + 1][c]);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduceMotion) return () => window.removeEventListener("resize", resize);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerleave", onLeave);

    let time = 0;
    const loop = () => {
      time += 0.015;
      touchEnergy = touchEnergy * 0.94 < 0.005 ? 0 : touchEnergy * 0.94;
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].radius += 13;
        rings[i].amplitude *= 0.94;
        if (rings[i].radius > 600 || rings[i].amplitude < 0.2) rings.splice(i, 1);
      }
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true" />;
}
