"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import cn from "classnames";

export interface SafeAreaValues {
	safeAreaX: number;
	safeAreaY: number;
	safeAreaWidth: number;
	safeAreaHeight: number;
}

interface FrameSafeAreaEditorProps {
	imageUrl: string;
	width: number;
	height: number;
	values: SafeAreaValues;
	onChange: (values: SafeAreaValues) => void;
	className?: string;
}

export function FrameSafeAreaEditor({
	imageUrl,
	width,
	height,
	values,
	onChange,
	className,
}: FrameSafeAreaEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const scaleToDisplay = useCallback(
		(containerWidth: number) => containerWidth / width,
		[width],
	);

	const handlePointerDown = (e: React.PointerEvent) => {
		e.preventDefault();
		setDragging(true);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!dragging || !containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const scale = scaleToDisplay(rect.width);
		const x = Math.max(0, Math.min(width - values.safeAreaWidth, (e.clientX - rect.left) / scale - values.safeAreaWidth / 2));
		const y = Math.max(0, Math.min(height - values.safeAreaHeight, (e.clientY - rect.top) / scale - values.safeAreaHeight / 2));
		onChange({
			...values,
			safeAreaX: Math.round(x),
			safeAreaY: Math.round(y),
		});
	};

	const handlePointerUp = () => setDragging(false);

	const displayWidth = 400;
	const displayScale = displayWidth / width;

	return (
		<div className={cn("space-y-3", className)}>
			<p className="text-sm text-muted-foreground">
				Drag the box to set where quote text appears on the frame.
			</p>
			<div
				ref={containerRef}
				className="relative mx-auto overflow-hidden rounded-lg border bg-muted/30"
				style={{ width: displayWidth, height: height * displayScale }}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerUp}
			>
				<Image
					src={imageUrl}
					alt="Frame preview"
					width={width}
					height={height}
					className="h-full w-full object-contain"
					unoptimized
				/>
				<div
					className="absolute cursor-move border-2 border-dashed border-orange-500 bg-orange-500/10"
					style={{
						left: values.safeAreaX * displayScale,
						top: values.safeAreaY * displayScale,
						width: values.safeAreaWidth * displayScale,
						height: values.safeAreaHeight * displayScale,
					}}
					onPointerDown={handlePointerDown}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
				<span>X: {values.safeAreaX}</span>
				<span>Y: {values.safeAreaY}</span>
				<span>W: {values.safeAreaWidth}</span>
				<span>H: {values.safeAreaHeight}</span>
			</div>
		</div>
	);
}
