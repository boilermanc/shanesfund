import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

const VideoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#EDF6F9]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-10"
        >
          <h2 className="shane-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] mb-3 sm:mb-4">
            Watch Shane Win Big
          </h2>
          <p className="text-base sm:text-lg text-[#006D77]/70 font-medium max-w-xl mx-auto">
            See what happens when your pool hits the jackpot
          </p>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative aspect-video rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-black shadow-2xl shadow-[#006D77]/20"
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src="/hero.mp4"
            className="w-full h-full object-cover"
            onEnded={handleVideoEnd}
            playsInline
          />

          {/* Play/Pause Overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
            } bg-black/30`}
            onClick={togglePlay}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl"
            >
              {isPlaying ? (
                <Pause className="text-[#006D77]" size={32} fill="#006D77" />
              ) : (
                <Play className="text-[#006D77] ml-1" size={32} fill="#006D77" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
