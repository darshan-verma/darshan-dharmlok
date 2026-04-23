"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import type { HomepageSectionKey } from "@/lib/homepage-sections";

export interface HomepageSectionData {
  id: string;
  sectionKey: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  sortOrder: number;
  extraData: { cards?: Array<{ title: string; description: string; image: string; className?: string }> } | null;
}

interface SectionEditorProps {
  sectionKey: HomepageSectionKey;
  section: HomepageSectionData | null;
  onSave: () => void;
}

const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  about: "About",
  kathavachak: "Kathavachak",
  "our-services": "Our Services",
  dharmguru: "Dharmguru",
  panditji: "Panditji",
  "explore-dharmlok": "Explore Dharmlok",
  horoscope: "Horoscope",
  eshop: "E-Shop",
};

export function SectionEditor({ sectionKey, section, onSave }: SectionEditorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [cards, setCards] = useState<Array<{ title: string; description: string; image: string; className?: string }>>([]);
  const [saving, setSaving] = useState(false);

  const hasMedia = sectionKey === "about";
  const hasCards = sectionKey === "explore-dharmlok";

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setDescription(section.description ?? "");
      setMediaUrl(section.mediaUrl ?? "");
      setMediaType((section.mediaType === "video" ? "video" : "image") as "image" | "video");
      setMediaFile(null);
      const extra = section.extraData as { cards?: typeof cards } | null;
      setCards(Array.isArray(extra?.cards) ? extra.cards : []);
    }
  }, [section]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      let finalMediaUrl = mediaUrl.trim() || null;
      if (hasMedia && mediaFile) {
        const fd = new FormData();
        fd.append("file", mediaFile);
        if (mediaType === "video") {
          fd.append("userId", "unknown");
          const res = await fetch("/api/upload/video", { method: "POST", body: fd });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Video upload failed");
          }
          const data = await res.json();
          finalMediaUrl = data.videoUrl;
        } else {
          const res = await fetch("/api/upload/image", { method: "POST", body: fd });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Upload failed");
          }
          const data = await res.json();
          finalMediaUrl = data.imageUrl;
        }
      }
      const payload: {
        title: string;
        description: string | null;
        mediaUrl?: string | null;
        mediaType?: string | null;
        extraData?: unknown;
      } = {
        title: title.trim(),
        description: description.trim() || null,
      };
      if (hasMedia) {
        payload.mediaUrl = finalMediaUrl;
        payload.mediaType = mediaType;
      }
      if (hasCards) {
        payload.extraData = { cards };
      }
      const res = await fetch(`/api/homepage/sections/${sectionKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Section saved");
      onSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addCard = () => {
    setCards((c) => [...c, { title: "", description: "", image: "" }]);
  };

  const updateCard = (index: number, field: "title" | "description" | "image", value: string) => {
    setCards((c) =>
      c.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const removeCard = (index: number) => {
    setCards((c) => c.filter((_, i) => i !== index));
  };

  const label = SECTION_LABELS[sectionKey];

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-muted-foreground">
        Edit the title and description for the &quot;{label}&quot; section on the homepage.
      </p>
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. ${label}`}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Section description"
          rows={4}
        />
      </div>

      {hasMedia && (
        <div className="space-y-2 border-t pt-4">
          <Label>Media (video or image)</Label>
          <Select value={mediaType} onValueChange={(v: "image" | "video") => setMediaType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              type="file"
              accept={mediaType === "video" ? "video/*" : "image/*"}
              className="max-w-[200px]"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setMediaFile(f);
              }}
            />
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Or paste image/video URL"
            />
          </div>
          {mediaUrl && mediaType === "image" && !mediaFile && (
            <div className="relative w-40 h-24 rounded border overflow-hidden bg-muted">
              <Image src={mediaUrl} alt="Preview" fill className="object-cover" unoptimized />
            </div>
          )}
          {mediaUrl && mediaType === "video" && !mediaFile && (
            <div className="relative w-full max-w-xs aspect-video rounded border overflow-hidden bg-muted">
              <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline controls />
            </div>
          )}
          {mediaFile && mediaType === "video" && (
            <div className="relative w-full max-w-xs aspect-video rounded border overflow-hidden bg-muted">
              <video src={URL.createObjectURL(mediaFile)} className="w-full h-full object-cover" muted playsInline controls />
            </div>
          )}
        </div>
      )}

      {hasCards && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <Label>Bento cards</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCard}>
              <Plus className="h-4 w-4 mr-1" /> Add card
            </Button>
          </div>
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-muted/30 space-y-2"
              >
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Card {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeCard(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Card title"
                  value={card.title}
                  onChange={(e) => updateCard(index, "title", e.target.value)}
                />
                <Textarea
                  placeholder="Card description"
                  value={card.description}
                  onChange={(e) => updateCard(index, "description", e.target.value)}
                  rows={2}
                />
                <Input
                  placeholder="Image URL"
                  value={card.image}
                  onChange={(e) => updateCard(index, "image", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save section"}
      </Button>
    </div>
  );
}
