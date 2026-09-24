"use client";

import { useEffect, useRef, useState } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  colorDark: string;
  colorLight: string;
  depth: number; // 0 = far (shifts slow), 1 = mid, 2 = near (shifts fast)
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<number>(0);
  const targetScrollRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);

  // Monitor theme changes on <html>
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dark mode cosmic stars vs Light mode celestial prism stars
    const darkPalette = [
      "#ffffff", // Crisp diamond white
      "#e0f2fe", // Ice blue
      "#fef08a", // Warm starlight gold
      "#c084fc", // Nebula purple
      "#67e8f9", // Cyan pulsar
    ];

    const lightPalette = [
      "#3b82f6", // Sapphire blue
      "#6366f1", // Cosmic indigo
      "#0891b2", // Stellar teal
      "#d97706", // Celestial gold
      "#64748b", // Starlight slate
    ];

    // Generate starry cosmos
    const starCount = Math.min(200, Math.floor((width * height) / 6500));
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      const depth = Math.random() < 0.6 ? 0.35 : Math.random() < 0.85 ? 0.75 : 1.25;
      const paletteIdx = Math.floor(Math.random() * darkPalette.length);
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height + 1400), // Extended vertical field for scrolling
        size: Math.random() * 1.8 + (depth > 1 ? 0.9 : 0.4),
        baseAlpha: Math.random() * 0.55 + 0.35,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        colorDark: darkPalette[paletteIdx],
        colorLight: lightPalette[paletteIdx],
        depth,
      });
    }

    // Passive scroll listener
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

      const currentlyDark = document.documentElement.classList.contains("dark");

      // Render stars with scroll parallax shift
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Shift y position based on scroll and depth layer
        const parallaxShift = currentScroll * (star.depth * 0.45);
        const virtualHeight = height + 1000;
        let drawY = (star.y - parallaxShift) % virtualHeight;
        if (drawY < -50) drawY += virtualHeight;

        // Only draw if within visible viewport bounds
        if (drawY > -20 && drawY < height + 20) {
          const alpha =
            star.baseAlpha +
            Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.25;
          const clampedAlpha = Math.max(0.12, Math.min(currentlyDark ? 1 : 0.75, alpha));

          const color = currentlyDark ? star.colorDark : star.colorLight;

          ctx.fillStyle = color;
          ctx.globalAlpha = clampedAlpha;
          ctx.beginPath();
          ctx.arc(star.x, drawY, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Subtle glow flare for larger foreground stars
          if (star.size > 1.6) {
            ctx.fillStyle = color;
            ctx.globalAlpha = clampedAlpha * 0.25;
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-500"
    >
      {/* Dynamic Cosmic Gradient Nebulae that shifts on scroll */}
      <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-[#060a16]" : "bg-slate-50"}`}>
        {isDark ? (
          <>
            {/* Dark Mode Nebulae: Deep Violet & Cosmic Indigo */}
            <div
              className="absolute -top-[20%] -left-[10%] h-[75vw] w-[75vw] max-w-[900px] rounded-full opacity-40 blur-[130px] mix-blend-screen transition-transform duration-300 ease-out"
              style={{
                background: "radial-gradient(circle, #4f46e5 0%, #1e1b4b 65%, transparent 100%)",
                transform: "translateY(calc(var(--scroll-y, 0px) * -0.15))",
              }}
            />

            {/* Cosmic Cyan / Emerald Dust */}
            <div
              className="absolute top-[35%] -right-[15%] h-[65vw] w-[65vw] max-w-[800px] rounded-full opacity-30 blur-[140px] mix-blend-screen transition-transform duration-300 ease-out"
              style={{
                background: "radial-gradient(circle, #06b6d4 0%, #064e3b 65%, transparent 100%)",
                transform: "translateY(calc(var(--scroll-y, 0px) * -0.25))",
              }}
            />

            {/* Stellar Magenta Flare */}
            <div
              className="absolute top-[75%] left-[20%] h-[70vw] w-[70vw] max-w-[850px] rounded-full opacity-25 blur-[150px] mix-blend-screen transition-transform duration-300 ease-out"
              style={{
                background: "radial-gradient(circle, #c026d3 0%, #311042 65%, transparent 100%)",
                transform: "translateY(calc(var(--scroll-y, 0px) * -0.2))",
              }}
            />
          </>
        ) : (
          <>
            {/* Light Mode Celestial Aura: Soft Lavender & Sky Blue */}
            <div
              className="absolute -top-[15%] -left-[10%] h-[70vw] w-[70vw] max-w-[850px] rounded-full opacity-60 blur-[120px] mix-blend-multiply transition-transform duration-300 ease-out"
              style={{
                background: "radial-gradient(circle, #c7d2fe 0%, #e0e7ff 50%, transparent 100%)",
                transform: "translateY(calc(var(--scroll-y, 0px) * -0.15))",
              }}
            />

            {/* Light Mode Soft Cyan Shimmer */}
            <div
              className="absolute top-[35%] -right-[15%] h-[65vw] w-[65vw] max-w-[800px] rounded-full opacity-50 blur-[130px] mix-blend-multiply transition-transform duration-300 ease-out"
              style={{
                background: "radial-gradient(circle, #bae6fd 0%, #e0f2fe 50%, transparent 100%)",
                transform: "translateY(calc(var(--scroll-y, 0px) * -0.25))",
              }}
            />

            {/* Light Mode Soft Coral/Blush Horizon */}
            <div
              className="absolute top-[70%] left-[15%] h-[65vw] w-[65vw] max-w-[800px] rounded-full opacity-40 blur-[130px] mix-blend-multiply transition-transform duration-300 ease-out"
              style={{
                background: "radial-gradient(circle, #fbcfe8 0%, #fce7f3 50%, transparent 100%)",
                transform: "translateY(calc(var(--scroll-y, 0px) * -0.2))",
              }}
            />
          </>
        )}
      </div>

      {/* Interactive Parallax Starfield Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </div>
  );
}
