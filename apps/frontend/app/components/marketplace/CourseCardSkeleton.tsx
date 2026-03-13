import React from 'react';

export default function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full w-[280px] md:w-full shrink-0 animate-pulse">
      {/* Thumbnail */}
      <div className="h-44 w-full bg-gray-200" />
      
      {/* Content */}
      <div className="p-4 flex flex-col grow">
        
        {/* Category & Rating Row */}
        <div className="flex justify-between items-center mb-2">
          <div className="w-16 h-5 bg-gray-200 rounded-full" />
          <div className="w-12 h-4 bg-gray-200 rounded-full" />
        </div>
        
        {/* Title (2 lines) */}
        <div className="w-full h-5 bg-gray-200 rounded mb-1.5" />
        <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
        
        {/* Short Description (1-2 lines) */}
        <div className="w-full h-3 bg-gray-100 rounded mb-1.5 mt-2" />
        <div className="w-4/5 h-3 bg-gray-100 rounded mb-3" />
        
        {/* Info Chips */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          <div className="w-14 h-5 bg-gray-200 rounded-full" />
          <div className="w-16 h-5 bg-gray-200 rounded-full" />
          <div className="w-12 h-5 bg-gray-200 rounded-full" />
        </div>
        
        {/* Progress bar placeholder (ONSITE/LIVE) */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="w-6 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full" />
        </div>

        {/* Tutor row */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-gray-200" />
          <div className="w-24 h-3 bg-gray-200 rounded" />
        </div>
        
        {/* Price & CTA */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-end">
          {/* Price */}
          <div className="w-20 h-6 bg-gray-200 rounded" />
          {/* CTA Buttons */}
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
            <div className="w-[88px] h-9 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
