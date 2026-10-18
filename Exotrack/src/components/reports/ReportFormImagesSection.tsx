"use client";

import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Plus, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraCaptureModal } from './CameraCaptureModal';
import { resizeImage } from '@/lib/image-utils';

interface ReportFormImagesSectionProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ReportFormImagesSection({
  images,
  onChange,
  maxImages = 6,
}: ReportFormImagesSectionProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddImage = (dataUrl: string) => {
    if (images.length >= maxImages) return;
    onChange([...images, dataUrl]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const remainingSlots = maxImages - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      const processedImages: string[] = [];
      for (const file of filesToProcess) {
        try {
          const resized = await resizeImage(file, 1280, 1280, 0.82);
          processedImages.push(resized);
        } catch (err) {
          console.error("Failed to process image:", err);
        }
      }

      if (processedImages.length > 0) {
        onChange([...images, ...processedImages]);
      }
    } finally {
      setIsProcessing(false);
      // Reset input value so same files can be re-selected if removed
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (directCameraInputRef.current) directCameraInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <ImageIcon className="w-4 h-4 text-primary" />
            Report Images & Evidence
          </label>
          <p className="text-xs text-muted-foreground">
            Take photos with your camera or select from device ({images.length}/{maxImages})
          </p>
        </div>

        {images.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-bold">
            {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
          </span>
        )}
      </div>

      {/* Action Buttons: Camera & Upload */}
      <div className="grid grid-cols-2 gap-3">
        {/* Camera capture button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCameraOpen(true)}
          disabled={images.length >= maxImages || isProcessing}
          className="h-16 rounded-2xl border-white/10 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold"
        >
          <Camera className="w-5 h-5 text-primary" />
          <span>Take with Camera</span>
        </Button>

        {/* File upload button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages || isProcessing}
          className="h-16 rounded-2xl border-white/10 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-primary" />
              <span>Upload Photos</span>
            </>
          )}
        </Button>

        {/* Hidden file input for standard multi-file picking */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Hidden file input for native mobile camera capture */}
        <input
          ref={directCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Alternative mobile native camera trigger */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => directCameraInputRef.current?.click()}
          disabled={images.length >= maxImages || isProcessing}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <Camera className="w-3 h-3" /> Or launch native device camera
        </button>
      </div>

      {/* Thumbnails Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-sm"
            >
              <img
                src={imgUrl}
                alt={`Evidence ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Photo badge */}
              <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white">
                {index === 0 ? 'Cover' : `#${index + 1}`}
              </div>

              {/* Hover Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                <button
                  type="button"
                  onClick={() => setActivePreview(imgUrl)}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/40 text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-1.5 rounded-xl bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more button tile if slots are available */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-medium">Add Photo</span>
            </button>
          )}
        </div>
      )}

      {/* Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleAddImage}
      />

      {/* Lightbox Preview Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4"
          onClick={() => setActivePreview(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePreview}
              alt="Enlarged preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 rounded-full bg-black/60 hover:bg-black/90 text-white"
              onClick={() => setActivePreview(null)}
            >
              <Trash2 className="hidden" />
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
