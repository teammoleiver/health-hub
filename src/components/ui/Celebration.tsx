import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f472b6", "#38bdf8", "#4ade80"];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
  }));
}

interface CelebrationProps {
  show: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Auto-dismiss after ms (default 5000) */
  duration?: number;
}

export function Celebration({ show, title, subtitle, onClose, duration = 5000 }: CelebrationProps) {
  const [particles] = useState(() => generateParticles(40));

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-sm"
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size * (0.6 + Math.random() * 0.8),
                  backgroundColor: p.color,
                }}
                initial={{ y: "-10vh", rotate: 0, opacity: 1 }}
                animate={{
                  y: "110vh",
                  rotate: p.rotation + 720,
                  opacity: [1, 1, 1, 0],
                  x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: p.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>

          {/* Central celebration card */}
          <motion.div
            className="relative z-10 bg-card border-2 border-primary/30 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 pointer-events-auto"
            initial={{ scale: 0.3, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {/* Glowing ring */}
            <motion.div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-primary/20 to-blue-500/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative">
              {/* Trophy icon */}
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/15 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              >
                <Trophy className="w-8 h-8 text-primary" />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-xl font-display font-bold text-foreground mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {title}
              </motion.h2>

              {/* Subtitle */}
              {subtitle && (
                <motion.p
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {subtitle}
                </motion.p>
              )}

              {/* Dismiss hint */}
              <motion.p
                className="text-[10px] text-muted-foreground/50 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                Tap anywhere to dismiss
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
