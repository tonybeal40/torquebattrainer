import { useEffect, useRef } from "react";

export function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#06b6d4", "#10b981", "#3b82f6"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const drawGrid = (time: number) => {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
      ctx.lineWidth = 0.5;

      const gridSize = 60;
      const offsetX = (time * 0.01) % gridSize;
      const offsetY = (time * 0.008) % gridSize;

      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(time);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${p.alpha})`).replace("rgb", "rgba").replace("#", "");
        
        const hex = p.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

export function GlowCard({ children, className = "", glowColor = "cyan", ...props }: {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "emerald" | "amber" | "rose";
  [key: string]: any;
}) {
  const glowMap = {
    cyan: "shadow-[0_0_15px_rgba(6,182,212,0.15)] border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]",
    emerald: "shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    amber: "shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-500/20 hover:border-amber-400/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    rose: "shadow-[0_0_15px_rgba(244,63,94,0.15)] border-rose-500/20 hover:border-rose-400/40 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]",
  };

  return (
    <div
      className={`relative bg-slate-950/80 backdrop-blur-xl border rounded-xl transition-all duration-300 ${glowMap[glowColor]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function RadialGauge({ value, max = 100, size = 160, label, sublabel }: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const percentage = Math.min(value / max, 1);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  const getColor = () => {
    if (percentage >= 0.7) return { stroke: "#10b981", glow: "rgba(16,185,129,0.4)" };
    if (percentage >= 0.5) return { stroke: "#f59e0b", glow: "rgba(245,158,11,0.4)" };
    return { stroke: "#f43f5e", glow: "rgba(244,63,94,0.4)" };
  };

  const color = getColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 6px ${color.glow})`,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white font-mono" style={{ textShadow: `0 0 10px ${color.glow}` }}>
          {value}
        </span>
        {label && <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
      </div>
    </div>
  );
}

export function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
      <div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
        style={{
          animation: "scanline 3s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes scanline {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function HudCorners({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40 rounded-br-lg" />
    </div>
  );
}

export function PulsingDot({ color = "cyan" }: { color?: "cyan" | "emerald" | "amber" | "rose" }) {
  const colorMap = {
    cyan: "bg-cyan-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  };

  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorMap[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colorMap[color]}`} />
    </span>
  );
}
