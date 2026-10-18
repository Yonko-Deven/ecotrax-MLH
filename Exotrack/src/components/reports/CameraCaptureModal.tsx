"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, RefreshCw, X, Check, AlertCircle, FlipHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resizeImage } from '@/lib/image-utils';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (!isOpen || typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    }).catch(() => {
      setHasMultipleCameras(false);
    });
  }, [isOpen]);

  // Start / restart camera stream
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingCamera(true);
    setCameraError(null);

    const startCamera = async () => {
      stopStream();

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraError('No camera device was detected on this system.');
          } else {
            setCameraError(err.message || 'Unable to access camera.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingCamera(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [isOpen, facingMode]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;

    // Visual flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for mirror preview
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const optimized = await resizeImage(rawDataUrl, 1280, 1280, 0.85);
      setCapturedPhoto(optimized);
    } catch {
      setCapturedPhoto(rawDataUrl);
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopStream();
      onClose();
    }
  };

  const handleAddAndTakeAnother = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-6"
      onClick={() => {
        stopStream();
        onClose();
      }}
    >
      <div
        className="bg-card w-full max-w-xl rounded-3xl p-5 md:p-6 shadow-2xl border border-white/10 flex flex-col space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Camera Capture</h3>
              <p className="text-xs text-muted-foreground">Take a photo of the environmental incident</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
            onClick={() => {
              stopStream();
              onClose();
            }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
          {/* Flash animation */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-20 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <CameraOff className="w-6 h-6" />
              </div>
              <p className="text-sm text-red-200 font-medium">{cameraError}</p>
              <p className="text-xs text-muted-foreground">
                You can also upload images directly from your device file picker or native camera.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder crosshair overlay */}
              <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary/40 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              </div>

              {isLoadingCamera && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">Starting camera...</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Camera switch button */}
          {!capturedPhoto && !cameraError && hasMultipleCameras && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all z-10"
              title="Switch camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {capturedPhoto ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="flex-1 rounded-xl border-white/10 hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retake
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddAndTakeAnother}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Add & Next
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 rounded-xl neon-glow font-bold"
              >
                <Check className="w-4 h-4 mr-2" /> Done
              </Button>
            </>
          ) : cameraError ? (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                stopStream();
                onClose();
              }}
              className="w-full rounded-xl"
            >
              Close Camera
            </Button>
          ) : (
            <div className="w-full flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="rounded-xl text-muted-foreground"
              >
                Cancel
              </Button>

              {/* Big shutter button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={isLoadingCamera}
                className="w-16 h-16 rounded-full border-4 border-primary p-1 bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50"
                title="Take photo"
              >
                <div className="w-full h-full rounded-full bg-primary group-hover:scale-105 transition-transform" />
              </button>

              {hasMultipleCameras ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleFacingMode}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <FlipHorizontal className="w-4 h-4" /> Flip
                </Button>
              ) : (
                <div className="w-16" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
