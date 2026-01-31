
import React from 'react';

interface SkeletonLoaderProps {
  type: 'header' | 'carousel' | 'card';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
  if (type === 'header') {
    return (
      <div className="w-full h-48 rounded-[2.5rem] bg-white p-8 overflow-hidden relative border border-[#FFDDD2]">
        <div className="shimmer absolute inset-0 opacity-40" />
        <div className="w-1/3 h-3 bg-[#EDF6F9] rounded mx-auto mb-4" />
        <div className="w-2/3 h-10 bg-[#EDF6F9] rounded mx-auto mb-6" />
        <div className="w-32 h-6 bg-[#EDF6F9] rounded-2xl mx-auto" />
      </div>
    );
  }

  if (type === 'carousel') {
    return (
      <div className="flex gap-6 overflow-hidden pt-2">
        {[1, 2].map((i) => (
          <div key={i} className="min-w-[300px] h-[380px] rounded-[3rem] bg-white relative overflow-hidden border border-[#FFDDD2]">
             <div className="shimmer absolute inset-0 opacity-40" />
             <div className="p-7 space-y-8">
                <div className="flex justify-between">
                  <div className="w-14 h-14 rounded-3xl bg-[#EDF6F9]" />
                  <div className="w-10 h-10 rounded-2xl bg-[#EDF6F9]" />
                </div>
                <div className="space-y-3">
                  <div className="w-3/4 h-8 bg-[#EDF6F9] rounded" />
                  <div className="w-1/2 h-4 bg-[#EDF6F9] rounded" />
                </div>
                <div className="absolute bottom-7 left-7 right-7 space-y-6">
                  <div className="w-full h-1 bg-[#EDF6F9] rounded" />
                  <div className="w-full h-14 bg-[#EDF6F9] rounded-3xl" />
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="w-full h-36 rounded-[2rem] bg-white relative overflow-hidden border border-[#FFDDD2]">
        <div className="shimmer absolute inset-0 opacity-40" />
        <div className="p-5 space-y-5">
          <div className="w-10 h-10 rounded-2xl bg-[#EDF6F9]" />
          <div className="space-y-2">
            <div className="w-1/2 h-3 bg-[#EDF6F9] rounded" />
            <div className="w-3/4 h-5 bg-[#EDF6F9] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
