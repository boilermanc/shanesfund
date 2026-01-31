
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, Zap, RefreshCw, Keyboard } from 'lucide-react';

interface TicketScannerProps {
  onClose: () => void;
}

const GhostNumber: React.FC<{ x: string; y: string; delay: number }> = ({ x, y, delay }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ 
      opacity: [0, 0.6, 0],
      scale: [0.5, 1.2, 0.8],
      x: [0, (Math.random() - 0.5) * 40, 0],
      y: [0, (Math.random() - 0.5) * 40, 0]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    className="absolute text-[#006D77] font-black text-xl pointer-events-none select-none"
    style={{ left: x, top: y }}
  >
    {Math.floor(Math.random() * 60) + 1}
  </motion.span>
);

const TicketScanner: React.FC<TicketScannerProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [detectedData, setDetectedData] = useState<number[] | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed", err);
      }
    }

    setupCamera();

    // Simulate OCR success after 4 seconds
    const timer = setTimeout(() => {
      setIsScanning(false);
      setDetectedData([12, 24, 31, 48, 59, 15]);
    }, 4000);

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      clearTimeout(timer);
    };
  }, []);

  const ghostNumbers = Array.from({ length: 12 }).map((_, i) => ({
    x: `${15 + Math.random() * 70}%`,
    y: `${20 + Math.random() * 50}%`,
    delay: i * 0.3
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col"
    >
      {/* Camera Viewport */}
      <div className="absolute inset-0 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
        />
        
        {/* Alice Blue Tint Overlay with Hole */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px]" />
          <div className="flex h-[280px]">
            <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px]" />
            <div className="w-[320px] relative">
              {/* Target Area Box Corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#006D77] rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#006D77] rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#006D77] rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#006D77] rounded-br-xl" />
              
              {/* Laser Line */}
              {isScanning && (
                <motion.div 
                  initial={{ top: '5%' }}
                  animate={{ top: ['5%', '95%', '5%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-2 right-2 h-1 bg-[#E29578] z-10 shadow-[0_0_15px_#E29578,0_0_30px_#E29578]"
                />
              )}
            </div>
            <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px]" />
          </div>
          <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px] flex flex-col items-center pt-8">
            {isScanning && (
              <p className="text-[#83C5BE] text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                Align ticket within the frame...
              </p>
            )}
          </div>
        </div>

        {/* Ghost Numbers */}
        {isScanning && ghostNumbers.map((gn, i) => (
          <GhostNumber key={i} x={gn.x} y={gn.y} delay={gn.delay} />
        ))}
      </div>

      {/* Header UI */}
      <div className="absolute top-14 left-0 right-0 px-8 flex justify-between items-center z-[410]">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-3.5 rounded-2xl bg-white text-[#006D77] shadow-xl border border-[#FFDDD2]"
        >
          <X size={24} strokeWidth={3} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-6 py-3 rounded-2xl bg-[#83C5BE]/20 backdrop-blur-md border border-[#83C5BE]/40 text-[#006D77] text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          <Keyboard size={16} />
          Enter Manually
        </motion.button>
      </div>

      {/* Bottom Sheet Data Capture Card */}
      <AnimatePresence>
        {!isScanning && detectedData && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] border-t-8 border-[#83C5BE] p-8 shadow-[0_-15px_50px_rgba(0,0,0,0.2)] z-[420]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-[#E29578]/10 text-[#E29578]">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-black text-[#006D77] tracking-tight">Powerball Detected</h3>
                </div>
                <p className="text-sm font-bold text-[#83C5BE]">Draw Date: Jan 31, 2026</p>
              </div>
              <div className="bg-[#EDF6F9] px-3 py-1.5 rounded-xl border border-[#FFDDD2]">
                <p className="text-[10px] font-black text-[#006D77] uppercase tracking-wider italic">Verified OCR</p>
              </div>
            </div>

            {/* Captured Numbers Display */}
            <div className="flex justify-center gap-3 mb-10">
              {detectedData.slice(0, 5).map((num, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="w-12 h-12 rounded-full bg-[#006D77] flex items-center justify-center font-black text-white text-sm shadow-lg border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                  {num}
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, rotate: 20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8 }}
                className="w-12 h-12 rounded-full bg-[#E29578] flex items-center justify-center font-black text-white text-sm shadow-lg border border-white/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                {detectedData[5]}
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-5 rounded-[2rem] bg-[#E29578] text-white font-black text-lg shadow-xl shadow-[#FFDDD2] btn-shimmer flex items-center justify-center gap-3"
              >
                Confirm & Save
                <Check size={20} strokeWidth={3} />
              </motion.button>
              
              <button
                onClick={() => setIsScanning(true)}
                className="w-full py-4 rounded-[2rem] bg-[#FFDDD2] text-[#006D77] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Retake Scan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Scanning Label */}
      {isScanning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Camera size={32} className="text-white opacity-40" />
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Neural Engine Active</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TicketScanner;
