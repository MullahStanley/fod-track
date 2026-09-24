"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  depth: number; // 0 = far (shifts slow), 1 = mid, 2 = near (shifts fast)
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<number>(0);
  const targetScrollRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palette for cosmic stars
    const starColors = [
      "#ffffff", // Crisp white
      "#e0f2fe", // Ice blue
      "#fef08a", // Warm starlight gold
      "#c084fc", // Nebula purple
      "#67e8f9", // Cyan pulsar
    ];

    // Generate starry cosmos
    const starCount = Math.min(220, Math.floor((width * height) / 6000));
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      const depth = Math.random() < 0.6 ? 0.3 : Math.random() < 0.85 ? 0.7 : 1.2;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height + 1200), // Extended vertical field for scrolling
        size: Math.random() * 1.8 + (depth > 1 ? 0.8 : 0.4),
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        depth,
      });
    }

    // Scroll listener with passive flag
    const handleScroll = () => {
      targetScrollRef.current = window.scrollY || window.pageYOffset || 0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    targetScrollRef.current = window.scrollY || 0;
    scrollRef.current = targetScrollRef.current;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 1;

      // Smooth scroll interpolation (lerp)
      scrollRef.current += (targetScrollRef.current - scrollRef.current) * 0.1;
      const currentScroll = scrollRef.current;

      ctx.clearRect(0, 0, width, height);

      // Render stars with scroll parallax shift
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Shift y position based on scroll and depth layer
        const parallaxShift = currentScroll * (star.depth * 0.45);
        // Wrap vertically so stars endlessly flow on scroll
        const virtualHeight = height + 800;
        let drawY = (star.y - parallaxShift) % virtualHeight;
        if (drawY < -50) drawY += virtualHeight;

        // Only draw if within visible viewport bounds
        if (drawY > -20 && drawY < height + 20) {
          // Twinkle effect
          const alpha =
            star.baseAlpha +
            Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.25;
          const clampedAlpha = Math.max(0.1, Math.min(1, alpha));

          ctx.fillStyle = star.color;
          ctx.globalAlpha = clampedAlpha;
          ctx.beginPath();
          ctx.arc(star.x, drawY, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Extra subtle glow flare for larger foreground stars
          if (star.size > 1.6) {
            ctx.fillStyle = star.color;
            ctx.globalAlpha = clampedAlpha * 0.2;
            ctx.beginPath();
            ctx.arc(star.x, drawY, star.size * 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-700"
    >
      {/* Dynamic Cosmic Gradient Nebulae (parallax shifting via CSS transform) */}
      <div className="absolute inset-0 bg-[#070b16] dark:bg-[#070b16] [transition:background-color_0.5s]">
        {/* Nebula Cloud 1: Deep Violet / Indigo */}
        <div
          className="absolute -top-[20%] -left-[10%] h-[75vw] w-[75vw] max-w-[900px] rounded-full opacity-35 dark:opacity-40 blur-[130px] mix-blend-screen transition-transform duration-300 ease-out"
          style={{
            background: "radial-gradient(circle, #4f46e5 0%, #1e1b4b 65%, transparent 100%)",
            transform: "translateY(calc(var(--scroll-y, 0px) * -0.15))",
          }}
        />

        {/* Nebula Cloud 2: Cosmic Cyan / Emerald Glow */}
        <div
          className="absolute top-[35%] -right-[15%] h-[65vw] w-[65vw] max-w-[800px] rounded-full opacity-25 dark:opacity-30 blur-[140px] mix-blend-screen transition-transform duration-300 ease-out"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, #064e3b 65%, transparent 100%)",
            transform: "translateY(calc(var(--scroll-y, 0px) * -0.25))",
          }}
        />

        {/* Nebula Cloud 3: Magenta / Stellar Rose Dust */}
        <div
          className="absolute top-[75%] left-[20%] h-[70vw] w-[70vw] max-w-[850px] rounded-full opacity-20 dark:opacity-25 blur-[150px] mix-blend-screen transition-transform duration-300 ease-out"
          style={{
            background: "radial-gradient(circle, #c026d3 0%, #311042 65%, transparent 100%)",
            transform: "translateY(calc(var(--scroll-y, 0px) * -0.2))",
          }}
        />

        {/* Subtle Stardust Grain Vignette */}
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      </div>

      {/* Interactive Parallax Starfield Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </div>
  );
}
