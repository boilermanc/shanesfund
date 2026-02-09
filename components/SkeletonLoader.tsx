import React from 'react';

interface SkeletonLoaderProps {
  type: 'header' | 'carousel' | 'card';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
  if (type === 'header') {
    return (
      <div className="w-full h-40 sm:h-48 rounded-[2rem] sm:rounded-[2.5rem] bg-white p-6 sm:p-8 overflow-hidden relative border border-[#FFDDD2]">
        <div className="shimmer absolute inset-0 opacity-40" />
        <div className="w-1/3 h-2.5 sm:h-3 bg-[#EDF6F9] rounded mx-auto mb-3 sm:mb-4" />
        <div className="w-2/3 h-8 sm:h-10 bg-[#EDF6F9] rounded mx-auto mb-5 sm:mb-6" />
        <div className="w-28 sm:w-32 h-5 sm:h-6 bg-[#EDF6F9] rounded-xl sm:rounded-2xl mx-auto" />
      </div>
    );
  }

  if (type === 'carousel') {
    const skeletonCard = (i: number) => (
      <div key={i} className="min-w-[260px] sm:min-w-[300px] md:min-w-0 h-[320px] sm:h-[380px] rounded-[2.5rem] sm:rounded-[3rem] bg-white relative overflow-hidden border border-[#FFDDD2]">
        <div className="shimmer absolute inset-0 opacity-40" />
        <div className="p-5 sm:p-7 space-y-6 sm:space-y-8">
          <div className="flex justify-between">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#EDF6F9]" />
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#EDF6F9]" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="w-3/4 h-6 sm:h-8 bg-[#EDF6F9] rounded" />
            <div className="w-1/2 h-3 sm:h-4 bg-[#EDF6F9] rounded" />
          </div>
          <div className="absolute bottom-5 sm:bottom-7 left-5 sm:left-7 right-5 sm:right-7 space-y-4 sm:space-y-6">
            <div className="w-full h-1 bg-[#EDF6F9] rounded" />
            <div className="w-full h-12 sm:h-14 bg-[#EDF6F9] rounded-2xl sm:rounded-3xl" />
          </div>
        </div>
      </div>
    );

    return (
      <>
        {/* Mobile: horizontal scroll skeleton */}
        <div className="md:hidden flex gap-4 sm:gap-6 overflow-hidden pt-2">
          {[1, 2].map(skeletonCard)}
        </div>
        {/* Desktop: grid skeleton */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3].map(skeletonCard)}
        </div>
      </>
    );
  }

  if (type === 'card') {
    return (
      <div className="w-full h-32 sm:h-36 rounded-[1.5rem] sm:rounded-[2rem] bg-white relative overflow-hidden border border-[#FFDDD2]">
        <div className="shimmer absolute inset-0 opacity-40" />
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#EDF6F9]" />
          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-1/2 h-2.5 sm:h-3 bg-[#EDF6F9] rounded" />
            <div className="w-3/4 h-4 sm:h-5 bg-[#EDF6F9] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;