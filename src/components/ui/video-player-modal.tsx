"use client";

import { useRef, useEffect } from "react";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
}

export function VideoPlayerModal({
  open,
  onOpenChange,
  videoUrl,
  title = "Recorded Session",
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) {
      videoRef.current?.pause();
    }
  }, [open]);

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden bg-black">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-white text-left">{title}</DialogTitle>
        </DialogHeader>
        <div className="relative p-4 pt-2">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full aspect-video rounded-lg bg-black"
            playsInline
            onEnded={() => {}}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute bottom-6 right-6 rounded-full shadow-lg"
            onClick={handleFullscreen}
            aria-label="Full screen"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
