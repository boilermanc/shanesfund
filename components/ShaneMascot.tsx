
import React from 'react';
import { motion } from 'framer-motion';

interface ShaneMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const ShaneMascot: React.FC<ShaneMascotProps> = ({ size = 'md', animate = false }) => {
  const [hasError, setHasError] = React.useState(false);
  
  const dimensions = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const borderWeights = {
    xs: 'border-2',
    sm: 'border-[3px]',
    md: 'border-4',
    lg: 'border-[6px]',
    xl: 'border-[8px]',
  };

  return (
    <motion.div
      animate={animate ? {
        rotate: [0, -3, 3, 0],
        y: [0, -2, 0]
      } : {}}
      transition={animate ? {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
      className={`relative ${dimensions[size]} rounded-full ${borderWeights[size]} border-[#4A5D4E] bg-[#4A5D4E] overflow-hidden mascot-shadow`}
    >
      {!hasError ? (
        <img 
          src="shane_logo.png" 
          className="w-full h-full object-cover scale-[1.35] translate-y-[-5%]" 
          alt="Shane Mascot"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#4A5D4E]">
          {/* A stylized silhouette placeholder that still feels branded */}
          <div className="w-full h-full relative flex flex-col items-center justify-end">
            <div className="w-[60%] h-[60%] bg-[#F2E9D4]/20 rounded-full mb-[-10%]" />
            <div className="w-[85%] h-[40%] bg-[#F2E9D4]/10 rounded-t-[100%]" />
            <span className="absolute inset-0 flex items-center justify-center text-[#F2E9D4]/30 font-black text-4xl shane-serif">S</span>
          </div>
        </div>
      )}
      
      {/* Premium Glassy Reflection Overlay to match 3D render vibe */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
      <div className="absolute top-1 left-2 w-1/2 h-1/2 bg-white/10 rounded-full blur-xl pointer-events-none" />
    </motion.div>
  );
};

export default ShaneMascot;
