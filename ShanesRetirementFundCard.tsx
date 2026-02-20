/**
 * SHANE'S RETIREMENT FUND — Portfolio Card for Sweetwater Technology
 *
 * VISUAL IDENTITY EXTRACTED FROM CODEBASE:
 *
 * Colors:
 *   Primary Teal:      #006D77 — brand anchor, headings, CTAs
 *   Accent Teal:       #83C5BE — secondary elements, glass tints
 *   Light Background:  #EDF6F9 — card/page backgrounds
 *   Cream Background:  #F2E9D4 — warm section fills
 *   Coral Accent:      #E29578 — primary action color, energy
 *   Coral Light:       #FFDDD2 — borders, glows, warm shadows
 *   Mascot Green:      #4A5D4E — Shane character accents
 *
 * Typography:
 *   Inter (300–900) — UI body text
 *   Fraunces (700, 900, variable opsz) — serif display headlines
 *
 * Mood: Premium yet playful. Trustworthy teal grounded by warm coral
 * energy. Glass morphism, generous rounded corners (2.5rem+), warm
 * coral-glow shadows. Celebratory animations — this is an app about
 * pooling luck together and winning as a group.
 *
 * Design Concept: "The Lucky Ticket"
 * The card evokes a premium lottery ticket / golden pass — a coral-to-teal
 * gradient wash with floating lottery ball accents, a subtle perforated
 * ticket edge, and a celebratory shimmer on hover. It says: "come pool
 * your luck with friends."
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Ticket,
  Trophy,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface AppProject {
  id: string;
  title: string;
  category: string;
  description: string;
  longDescription: string;
  image: string;
  tags: string[];
  link: string;
  color: string;
}

interface ShanesRetirementFundCardProps {
  app: AppProject;
  index: number;
  onClick: () => void;
}

// Lottery ball decorations — small circles that float in the background
const LotteryBall: React.FC<{
  number: number;
  x: string;
  y: string;
  size: string;
  delay: number;
  accent?: boolean;
}> = ({ number, x, y, size, delay, accent }) => (
  <motion.div
    className="absolute flex items-center justify-center rounded-full font-black text-white select-none pointer-events-none"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      fontSize: `calc(${size} * 0.38)`,
      background: accent
        ? "linear-gradient(135deg, #E29578 0%, #FFDDD2 100%)"
        : "linear-gradient(135deg, #006D77 0%, #83C5BE 100%)",
      boxShadow: accent
        ? "0 4px 12px rgba(226, 149, 120, 0.4)"
        : "0 4px 12px rgba(0, 109, 119, 0.3)",
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 0.7, scale: 1 }}
    transition={{ delay: 0.4 + delay * 0.12, type: "spring", stiffness: 200 }}
  >
    {number}
  </motion.div>
);

const ShanesRetirementFundCard: React.FC<ShanesRetirementFundCardProps> = ({
  app,
  index,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative cursor-pointer group w-full"
      style={{ perspective: "1000px" }}
    >
      {/* Outer glow on hover */}
      <motion.div
        className="absolute -inset-2 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 221, 210, 0.6) 0%, transparent 70%)",
        }}
      />

      {/* Main card */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-[#FFDDD2]"
        style={{
          background:
            "linear-gradient(165deg, #EDF6F9 0%, #FFFFFF 35%, #FFDDD2 100%)",
          boxShadow:
            "0 15px 40px -10px rgba(255, 221, 210, 0.5), 0 5px 15px -5px rgba(0, 109, 119, 0.08)",
        }}
      >
        {/* Ticket perforation edge — decorative dashed line */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #E29578 0px, #E29578 6px, transparent 6px, transparent 12px)",
          }}
        />

        {/* Floating lottery balls */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <LotteryBall number={7} x="78%" y="8%" size="28px" delay={0} accent />
          <LotteryBall number={21} x="85%" y="42%" size="22px" delay={1} />
          <LotteryBall
            number={33}
            x="6%"
            y="65%"
            size="24px"
            delay={2}
            accent
          />
          <LotteryBall number={44} x="72%" y="72%" size="20px" delay={3} />
          <LotteryBall number={9} x="12%" y="18%" size="18px" delay={4} />
        </div>

        {/* Decorative gradient blobs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#83C5BE]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#FFDDD2]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-7">
          {/* Top row: image preview + category badge */}
          <div className="flex items-start justify-between mb-5 sm:mb-6">
            {/* App preview thumbnail */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.25rem] overflow-hidden border-2 border-white/80 flex-shrink-0"
              style={{
                boxShadow: "0 4px 16px rgba(0, 109, 119, 0.15)",
              }}
            >
              <img
                src={app.image}
                alt={app.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Category badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006D77]/10 text-[#006D77]">
              <Sparkles size={12} />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {app.category}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-xl sm:text-2xl font-black tracking-tight text-[#006D77] leading-tight mb-2"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {app.title}
          </h3>

          {/* Description */}
          <p className="text-sm sm:text-[15px] text-[#006D77]/65 font-medium leading-relaxed mb-5 sm:mb-6 line-clamp-2">
            {app.description}
          </p>

          {/* Feature highlights — quick glance at what makes it special */}
          <div className="flex flex-wrap gap-2 mb-5 sm:mb-6">
            {[
              { icon: Users, label: "Pool with friends" },
              { icon: Ticket, label: "Scan tickets" },
              { icon: Trophy, label: "Auto win-check" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/70 border border-[#83C5BE]/20 text-[#006D77]/80"
              >
                <feature.icon size={12} className="text-[#E29578]" />
                <span className="text-[10px] sm:text-xs font-semibold">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5 sm:mb-6">
            {app.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide"
                style={{
                  backgroundColor: "rgba(0, 109, 119, 0.07)",
                  color: "#006D77",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Demo link */}
            <a
              href={app.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white transition-colors duration-200"
              style={{
                background:
                  "linear-gradient(135deg, #E29578 0%, #e8a78e 100%)",
                boxShadow: "0 4px 14px rgba(226, 149, 120, 0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "linear-gradient(135deg, #006D77 0%, #1a8a94 100%)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 4px 14px rgba(0, 109, 119, 0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "linear-gradient(135deg, #E29578 0%, #e8a78e 100%)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 4px 14px rgba(226, 149, 120, 0.35)";
              }}
            >
              <ExternalLink size={14} />
              Live Demo
            </a>

            {/* Learn More */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-[#006D77] bg-[#EDF6F9] hover:bg-[#006D77] hover:text-white border border-[#83C5BE]/20 hover:border-[#006D77] transition-all duration-200"
            >
              Learn More
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        {/* Bottom gradient accent bar — mimics the app's modal top gradient */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, #E29578 0%, #83C5BE 50%, #E29578 100%)",
          }}
        />

        {/* Hover shimmer overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.15) 55%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["200% 0", "-200% 0"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear",
          }}
        />
      </div>
    </motion.div>
  );
};

export default ShanesRetirementFundCard;

/*
 * SWEETWATER CONSTANTS.TSX ENTRY:
 *
 * {
 *   id: "shanes-retirement-fund",
 *   title: "Shane's Retirement Fund",
 *   category: "Social Finance",
 *   description: "Pool together, win together. The easiest way to manage lottery pools with friends, family, and coworkers.",
 *   longDescription: "Shane's Retirement Fund is a mobile-first lottery pool web app that lets users create syndicates, invite friends, scan tickets with OCR, and automatically check for wins. It replaces messy spreadsheets and group chats with a transparent, trustworthy platform — so everyone knows what tickets were bought, what the odds are, and who won.",
 *   image: "/images/shanes-retirement-fund-preview.svg",
 *   tags: ["React 19", "TypeScript", "Supabase", "Zustand", "Framer Motion", "Vite", "Tailwind CSS"],
 *   link: "https://shanesfund.vercel.app",
 *   color: "#006D77"
 * }
 */
