"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

export interface HeroSlide {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string;
  sortOrder: number;
}

const DEFAULT_SLIDE_FORM = {
  heading: "Discover Divine",
  subheading: "Your Spiritual Journey Begins Here",
  description:
    "Connect with spiritual guides, book pooja services, explore sacred temples, and plan your pilgrimage journey with Dharmlok - your trusted companion for spiritual growth.",
  mediaUrl: "/landing-page/13656424_3840_2160_30fps.mp4",
  mediaType: "video" as "image" | "video",
};

interface HeroSlidesManagerProps {
  slides: HeroSlide[];
  onSlidesChange: (slides: HeroSlide[]) => void;
}

export function HeroSlidesManager({ slides, onSlidesChange }: HeroSlidesManagerProps) {
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [displayOrder, setDisplayOrder] = useState<HeroSlide[]>(() => [...slides]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    heading: "",
    subheading: "",
    description: "",
    mediaUrl: "",
    mediaType: "image" as "image" | "video",
    imageFile: null as File | null,
    videoFile: null as File | null,
  });

  const openAdd = () => {
    setEditingSlide(null);
    setForm({
      heading: "",
      subheading: "",
      description: "",
      mediaUrl: "",
      mediaType: "image",
      imageFile: null,
      videoFile: null,
    });
    setIsFormOpen(true);
  };

  const openAddDefault = () => {
    setEditingSlide(null);
    setForm({
      ...DEFAULT_SLIDE_FORM,
      mediaUrl: DEFAULT_SLIDE_FORM.mediaUrl,
      imageFile: null,
      videoFile: null,
    });
    setIsFormOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({
      heading: slide.heading,
      subheading: slide.subheading ?? "",
      description: slide.description ?? "",
      mediaUrl: slide.mediaUrl ?? "",
      mediaType: (slide.mediaType === "video" ? "video" : "image") as "image" | "video",
      imageFile: null,
      videoFile: null,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.heading.trim()) {
      toast.error("Heading is required");
      return;
    }
    setIsSubmitting(true);
    try {
      let mediaUrl = form.mediaUrl.trim() || null;
      if (form.mediaType === "video" && form.videoFile) {
        const fd = new FormData();
        fd.append("file", form.videoFile);
        fd.append("userId", "unknown");
        const res = await fetch("/api/upload/video", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Video upload failed");
        }
        const data = await res.json();
        mediaUrl = data.videoUrl;
      } else if (form.mediaType === "image" && form.imageFile) {
        const fd = new FormData();
        fd.append("file", form.imageFile);
        const res = await fetch("/api/upload/image", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }
        const data = await res.json();
        mediaUrl = data.imageUrl;
      }
      const payload = {
        heading: form.heading.trim(),
        subheading: form.subheading.trim() || null,
        description: form.description.trim() || null,
        mediaUrl,
        mediaType: form.mediaType,
      };
      if (editingSlide) {
        const res = await fetch(`/api/homepage/hero/${editingSlide.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        onSlidesChange(
          slides.map((s) => (s.id === editingSlide.id ? updated : s))
        );
        toast.success("Slide updated");
      } else {
        const res = await fetch("/api/homepage/hero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        onSlidesChange([...slides, created].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Slide added");
      }
      setIsFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/homepage/hero/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      onSlidesChange(slides.filter((s) => s.id !== id));
      setDeleteId(null);
      toast.success("Slide deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Sync display order from props when not dragging
  useEffect(() => {
    if (draggedIndex === null) setDisplayOrder([...slides]);
  }, [slides, draggedIndex]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null) return;
    if (draggedIndex === overIndex) return;
    const newOrder = [...displayOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(overIndex, 0, removed);
    setDisplayOrder(newOrder);
    setDraggedIndex(overIndex);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);
    const orderIds = displayOrder.map((s) => s.id);
    try {
      const res = await fetch("/api/homepage/hero/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      const data = await res.json();
      onSlidesChange(data.slides);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to reorder");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-muted-foreground">
          Add, edit, or reorder hero slides. Each slide can have heading, subheading, description, and an image or video.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAddDefault}>
            Add default slide
          </Button>
          <Button onClick={openAdd}>Add Slide</Button>
        </div>
      </div>
      <div className="space-y-2">
        {slides.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center border rounded-lg">
            No hero slides yet. Add one to show a carousel on the homepage.
          </p>
        ) : (
          displayOrder.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-4 border rounded-lg bg-card cursor-grab active:cursor-grabbing select-none transition-opacity ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{slide.heading}</p>
                {slide.subheading && (
                  <p className="text-sm text-muted-foreground truncate">
                    {slide.subheading}
                  </p>
                )}
              </div>
              {slide.mediaUrl && (
                <div className="relative w-16 h-10 rounded overflow-hidden bg-muted shrink-0">
                  {slide.mediaType === "video" ? (
                    <video
                      src={slide.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={slide.mediaUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              )}
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" onClick={() => openEdit(slide)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setDeleteId(slide.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Edit Slide" : "Add Slide"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Heading *</Label>
              <Input
                value={form.heading}
                onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
                placeholder="e.g. Discover Divine"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheading</Label>
              <Input
                value={form.subheading}
                onChange={(e) => setForm((f) => ({ ...f, subheading: e.target.value }))}
                placeholder="e.g. Your Spiritual Journey Begins Here"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Media (image or video)</Label>
              <Select
                value={form.mediaType}
                onValueChange={(v: "image" | "video") =>
                  setForm((f) => ({ ...f, mediaType: v, imageFile: null, videoFile: null }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 items-center flex-wrap">
                {form.mediaType === "image" ? (
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-[200px]"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setForm((f) => ({ ...f, imageFile: file, mediaUrl: "", videoFile: null }));
                    }}
                  />
                ) : (
                  <Input
                    type="file"
                    accept="video/*"
                    className="max-w-[200px]"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setForm((f) => ({ ...f, videoFile: file, mediaUrl: "", imageFile: null }));
                    }}
                  />
                )}
                <span className="text-sm text-muted-foreground">or URL:</span>
                <Input
                  value={form.mediaUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mediaUrl: e.target.value, imageFile: null, videoFile: null }))
                  }
                  placeholder="https://..."
                />
              </div>
              {form.mediaType === "image" && (form.mediaUrl || form.imageFile) && (
                <div className="relative w-32 h-20 rounded border overflow-hidden bg-muted">
                  {form.imageFile ? (
                    <Image
                      src={URL.createObjectURL(form.imageFile)}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src={form.mediaUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              )}
              {form.mediaType === "video" && (form.mediaUrl || form.videoFile) && (
                <div className="relative w-full max-w-xs aspect-video rounded border overflow-hidden bg-muted">
                  <video
                    src={form.videoFile ? URL.createObjectURL(form.videoFile) : form.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    controls
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingSlide ? "Update" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete slide?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
