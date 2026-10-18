"use client";

import React, { useState } from 'react';
import { 
  X, MapPin, Calendar, User, Tag, ChevronLeft, ChevronRight, 
  Maximize2, Image as ImageIcon, Camera, AlertTriangle 
} from 'lucide-react';
import { Report } from '@/lib/db/reports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReportDetailModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  initialImageIndex?: number;
}

export function ReportDetailModal({
  report,
  isOpen,
  onClose,
  initialImageIndex = 0,
}: ReportDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(initialImageIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen || !report) return null;

  const images: string[] = (report.images && report.images.length > 0)
    ? report.images
    : (report.image ? [report.image] : []);

  const currentImage = images[activeImageIndex] || images[0];

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const statusClass = (status: string) => {
    if (status === 'completed' || status === 'resolved') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (status === 'in-progress') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <div 
          className="bg-card w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border', statusClass(report.status))}>
                  {report.status}
                </span>
                <span className="text-xs uppercase tracking-widest text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full">
                  #{report.issueType}
                </span>
              </div>
              <h2 className="text-2xl font-bold font-headline">{report.name}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Image Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Camera className="w-4 h-4 text-primary" />
                Image Evidence Section
              </h3>
              {images.length > 0 && (
                <span className="text-xs text-muted-foreground font-mono">
                  Photo {activeImageIndex + 1} of {images.length}
                </span>
              )}
            </div>

            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Main Featured Photo Viewport */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-video group flex items-center justify-center">
                  <img
                    src={currentImage}
                    alt={`Evidence photo ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => setIsLightboxOpen(true)}
                  />

                  {/* Navigation Arrows for Multiple Images */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/10"
                        title="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/10"
                        title="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Expand button */}
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-all border border-white/10 flex items-center gap-1.5 text-xs backdrop-blur-sm"
                  >
                    <Maximize2 className="w-4 h-4" /> Expand
                  </button>
                </div>

                {/* Thumbnails strip for multiple photos */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={cn(
                          "relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                          idx === activeImageIndex
                            ? "border-primary ring-2 ring-primary/30 scale-105"
                            : "border-white/10 opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white bg-black/70 px-1 rounded">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass p-6 rounded-2xl border border-white/10 text-center py-8">
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">No photos or camera evidence attached to this report.</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Description</h3>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap bg-white/5 p-4 rounded-2xl border border-white/5">
              {report.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-muted-foreground p-3 rounded-xl bg-white/5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider block text-white/50">Location</span>
                <span className="truncate text-foreground font-medium block">{report.location || 'Unknown Location'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground p-3 rounded-xl bg-white/5">
              <User className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider block text-white/50">Submitted By</span>
                <span className="truncate text-foreground font-medium block">
                  {report.userId && report.userId !== 'anonymous' && report.userId !== 'guest' ? 'Registered Member' : 'Guest Contributor'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground p-3 rounded-xl bg-white/5">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider block text-white/50">Reported On</span>
                <span className="truncate text-foreground font-medium block">
                  {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground p-3 rounded-xl bg-white/5">
              <Tag className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider block text-white/50">Report Reference</span>
                <span className="truncate text-foreground font-mono block">
                  {report.id || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image Viewer */}
      {isLightboxOpen && currentImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[80] flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[92vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentImage}
              alt="High-res preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full bg-black/60 hover:bg-black/90 text-white"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs text-white border border-white/10">
                  {activeImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
