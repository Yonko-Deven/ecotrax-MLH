"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportCardImageGalleryProps {
  images?: string[];
  fallbackImage?: string | null;
  reportName: string;
  onImageClick?: (index: number) => void;
}

export function ReportCardImageGallery({
  images = [],
  fallbackImage,
  reportName,
  onImageClick,
}: ReportCardImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize image list
  const allImages = images.length > 0
    ? images
    : (fallbackImage ? [fallbackImage] : []);

  if (allImages.length === 0) return null;

  const currentImg = allImages[currentIndex] || allImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onImageClick) {
      onImageClick(currentIndex);
    }
  };

  return (
    <div className="mb-4 relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40 group cursor-pointer" onClick={handleClick}>
      <img
        src={currentImg}
        alt={`${reportName} - image ${currentIndex + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Multi-image indicators and controls */}
      {allImages.length > 1 && (
        <>
          {/* Badge */}
          <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
            <Camera className="w-3 h-3 text-primary" />
            <span>{currentIndex + 1}/{allImages.length}</span>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
            title="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
            title="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Bottom Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            {allImages.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  idx === currentIndex ? "w-3 bg-primary" : "bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}

      {allImages.length === 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-primary" /> 1 photo
        </div>
      )}
    </div>
  );
}
