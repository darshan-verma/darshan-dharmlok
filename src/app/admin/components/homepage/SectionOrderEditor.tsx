"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { toast } from "@/lib/toast";
import type { HomepageSectionKey } from "@/lib/homepage-sections";

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

export interface SectionForOrder {
  sectionKey: string;
  title: string;
  sortOrder: number;
}

interface SectionOrderEditorProps {
  sections: SectionForOrder[];
  onOrderChange: (sectionKeys: string[]) => void;
}

export function SectionOrderEditor({ sections, onOrderChange }: SectionOrderEditorProps) {
  const [order, setOrder] = useState<string[]>(() =>
    [...sections].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => s.sectionKey)
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const next = [...sections].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => s.sectionKey);
    setOrder(next);
  }, [sections]);

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
    const newOrder = [...order];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(overIndex, 0, removed);
    setOrder(newOrder);
    setDraggedIndex(overIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      const res = await fetch("/api/homepage/sections/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKeys: order }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      toast.success("Section order saved");
      onOrderChange(order);
    } catch {
      toast.error("Failed to save order");
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentOrder = order.length ? order : sortedSections.map((s) => s.sectionKey);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Drag sections to change the order on the homepage. Hero is always first.
      </p>
      <div className="space-y-2 max-w-md">
        {currentOrder.map((key, index) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 border rounded-lg bg-card cursor-grab active:cursor-grabbing select-none transition-opacity ${
              draggedIndex === index ? "opacity-50" : ""
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            <span className="flex-1 font-medium">
              {SECTION_LABELS[key as HomepageSectionKey] ?? key}
            </span>
            <span className="text-sm text-muted-foreground">{index + 2}</span>
          </div>
        ))}
      </div>
      <Button onClick={handleSaveOrder}>Save section order</Button>
    </div>
  );
}
