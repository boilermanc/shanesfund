import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Keyboard, ArrowRight, User as UserIcon, Check, Users } from 'lucide-react';
import ShaneMascot from './ShaneMascot';

interface JoinPoolScreenProps {
  onClose: () => void;
  onJoinSuccess: (poolName: string) => void;
}

const JoinPoolScreen: React.FC<JoinPoolScreenProps> = ({ onClose, onJoinSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (mode === 'scan') {
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
          setMode('manual');
        }
      }
      setupCamera();
    }

    // Demo: Auto-success for QR scan after 3s
    let timer: any;
    if (mode === 'scan') {
      timer = setTimeout(() => {
        setShowConfirmation(true);
      }, 3000);
    }

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      if (timer) clearTimeout(timer);
    };
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length >= 6) {
      setShowConfirmation(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[750] bg-black flex flex-col"
    >
      {mode === 'scan' ? (
        <div className="absolute inset-0 overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
          />
          
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm" />
            <div className="flex h-[220px] sm:h-[280px]">
              <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm" />
              <div className="w-[220px] sm:w-[280px] relative">
                {/* Scanner Frame */}
                <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem] sm:rounded-[3rem]" />
                <div className="absolute top-0 left-0 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-l-4 border-[#006D77] rounded-tl-[1.5rem] sm:rounded-tl-[2rem]" />
                <div className="absolute top-0 right-0 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-r-4 border-[#006D77] rounded-tr-[1.5rem] sm:rounded-tr-[2rem]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-l-4 border-[#006D77] rounded-bl-[1.5rem] sm:rounded-bl-[2rem]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-r-4 border-[#006D77] rounded-br-[1.5rem] sm:rounded-br-[2rem]" />
                
                {/* Laser */}
                <motion.div 
                  initial={{ top: '5%' }}
                  animate={{ top: ['5%', '95%', '5%'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute left-4 right-4 h-1 bg-[#E29578] shadow-[0_0_15px_#E29578]"
                />
              </div>
              <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm" />
            </div>
            <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm flex flex-col items-center pt-6 sm:pt-10">
              <p className="text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] animate-pulse">Scanning Pool QR...</p>
              
              <button 
                onClick={() => setMode('manual')}
                className="mt-6 sm:mt-8 bg-white/20 backdrop-blur-md px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border border-white/30 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Keyboard size={14} /> Enter Code Manually
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#EDF6F9] flex flex-col items-center justify-center p-6 sm:p-8">
           <div className="w-full max-w-sm space-y-6 sm:space-y-8">
             <div className="text-center">
               <h3 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">Enter Pool Code</h3>
               <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mt-2">Check your invite message</p>
             </div>
             
             <form onSubmit={handleManualSubmit} className="space-y-4 sm:space-y-6">
                <input 
                  type="text" 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="SHANE-X"
                  className="w-full bg-white border-none rounded-[1.5rem] sm:rounded-[2rem] py-4 sm:py-6 px-6 sm:px-8 text-xl sm:text-2xl font-black text-[#006D77] outline-none warm-shadow text-center uppercase font-mono tracking-widest"
                />
                
                <button 
                  type="submit"
                  disabled={manualCode.length < 4}
                  className="w-full py-4 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  Join Pool <ArrowRight size={20} />
                </button>
             </form>

             <button 
                onClick={() => setMode('scan')}
                className="w-full text-[#83C5BE] font-black text-[9px] sm:text-[10px] uppercase tracking-widest"
              >
                Switch to QR Scan
              </button>
           </div>
        </div>
      )}

      {/* Header UI */}
      <div className="absolute left-0 right-0 px-6 sm:px-8 flex justify-between items-center z-[760] safe-area-top" style={{ top: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}>
        <button 
          onClick={onClose}
          className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white text-[#006D77] shadow-xl border border-[#FFDDD2]"
        >
          <X size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-[#006D77]/50 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-[#FFDDD2] shadow-2xl text-center"
            >
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="scale-75 sm:scale-100">
                  <ShaneMascot size="lg" expression="confident" animate />
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 sm:mt-6 space-y-2"
                >
                  <h3 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight leading-tight">
                    You've been invited to<br/>
                    <span className="text-[#E29578] leading-normal">The Office Syndicate</span>
                  </h3>
                  
                  <div className="flex items-center justify-center gap-3 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-[#EDF6F9] border border-[#FFDDD2]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm overflow-hidden">
                        <img src="https://picsum.photos/seed/captain/64" className="w-full h-full object-cover" alt="" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-wider">Captain Sarah</p>
                    </div>
                    <div className="h-4 w-[1px] bg-[#83C5BE]/30" />
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[#83C5BE]">
                      <Users size={12} />
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">12 Members</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#EDF6F9] text-[#006D77] font-black text-[10px] sm:text-xs uppercase tracking-widest"
                >
                  Later
                </button>
                <button 
                  onClick={() => onJoinSuccess('The Office Syndicate')}
                  className="flex-1 py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#E29578] text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2 btn-shimmer"
                >
                  Jump In! <Check size={16} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default JoinPoolScreen;