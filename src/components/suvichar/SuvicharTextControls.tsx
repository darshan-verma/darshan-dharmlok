"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getFrameDefaultTextStyle,
	type FrameTextDefaults,
	type SuvicharFontWeight,
	type SuvicharTextAlign,
	type SuvicharVerticalAlign,
	type TextStyleOverrides,
} from "@/lib/suvichar/textStyle";
import { cn } from "@/lib/utils";

interface SuvicharTextControlsProps {
	value: TextStyleOverrides;
	onChange: (next: TextStyleOverrides) => void;
	frameDefaults: FrameTextDefaults;
	className?: string;
}

function ControlRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			{children}
		</div>
	);
}

function Segmented<T extends string>({
	options,
	value,
	onChange,
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1">
			{options.map((opt) => (
				<Button
					key={opt.value}
					type="button"
					size="sm"
					variant={value === opt.value ? "default" : "outline"}
					className={cn(
						"h-7 flex-1 px-2 text-xs",
						value === opt.value && "bg-orange-500 hover:bg-orange-600",
					)}
					onClick={() => onChange(opt.value)}
				>
					{opt.label}
				</Button>
			))}
		</div>
	);
}

function formatPercent(scale: number) {
	const pct = Math.round((scale - 1) * 100);
	return pct > 0 ? `+${pct}%` : `${pct}%`;
}

export function SuvicharTextControls({
	value,
	onChange,
	frameDefaults,
	className,
}: SuvicharTextControlsProps) {
	const patch = (partial: Partial<TextStyleOverrides>) =>
		onChange({ ...value, ...partial });

	const fontScalePercent = Math.round((value.fontScale - 1) * 100);

	return (
		<div
			className={cn(
				"space-y-4 rounded-xl border bg-muted/20 p-3",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">Text controls</h2>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 text-xs"
					onClick={() => onChange(getFrameDefaultTextStyle(frameDefaults))}
				>
					Reset
				</Button>
			</div>

			<ControlRow label={`Font size (${formatPercent(value.fontScale)} vs auto-fit)`}>
				<Slider
					min={-50}
					max={50}
					step={1}
					value={[fontScalePercent]}
					onValueChange={([v]) =>
						patch({ fontScale: 1 + (v ?? 0) / 100 })
					}
				/>
			</ControlRow>

			<ControlRow label={`Max width (${Math.round(value.widthScale * 100)}%)`}>
				<Slider
					min={60}
					max={100}
					step={1}
					value={[Math.round(value.widthScale * 100)]}
					onValueChange={([v]) =>
						patch({ widthScale: (v ?? 100) / 100 })
					}
				/>
			</ControlRow>

			<ControlRow label={`Max height (${Math.round(value.heightScale * 100)}%)`}>
				<Slider
					min={60}
					max={100}
					step={1}
					value={[Math.round(value.heightScale * 100)]}
					onValueChange={([v]) =>
						patch({ heightScale: (v ?? 100) / 100 })
					}
				/>
			</ControlRow>

			<div className="grid grid-cols-2 gap-3">
				<ControlRow label="Padding top">
					<Slider
						min={0}
						max={80}
						step={2}
						value={[value.paddingTop]}
						onValueChange={([v]) => patch({ paddingTop: v ?? 0 })}
					/>
				</ControlRow>
				<ControlRow label="Padding right">
					<Slider
						min={0}
						max={80}
						step={2}
						value={[value.paddingRight]}
						onValueChange={([v]) => patch({ paddingRight: v ?? 0 })}
					/>
				</ControlRow>
				<ControlRow label="Padding bottom">
					<Slider
						min={0}
						max={80}
						step={2}
						value={[value.paddingBottom]}
						onValueChange={([v]) => patch({ paddingBottom: v ?? 0 })}
					/>
				</ControlRow>
				<ControlRow label="Padding left">
					<Slider
						min={0}
						max={80}
						step={2}
						value={[value.paddingLeft]}
						onValueChange={([v]) => patch({ paddingLeft: v ?? 0 })}
					/>
				</ControlRow>
			</div>

			<ControlRow label="Horizontal align">
				<Segmented<SuvicharTextAlign>
					value={value.textAlign}
					onChange={(textAlign) => patch({ textAlign })}
					options={[
						{ value: "left", label: "Left" },
						{ value: "center", label: "Center" },
						{ value: "right", label: "Right" },
					]}
				/>
			</ControlRow>

			<ControlRow label="Vertical align">
				<Segmented<SuvicharVerticalAlign>
					value={value.verticalAlign}
					onChange={(verticalAlign) => patch({ verticalAlign })}
					options={[
						{ value: "top", label: "Top" },
						{ value: "middle", label: "Middle" },
						{ value: "bottom", label: "Bottom" },
					]}
				/>
			</ControlRow>

			<ControlRow label={`Line height (${value.lineHeight.toFixed(2)})`}>
				<Slider
					min={80}
					max={200}
					step={5}
					value={[Math.round(value.lineHeight * 100)]}
					onValueChange={([v]) =>
						patch({ lineHeight: (v ?? 120) / 100 })
					}
				/>
			</ControlRow>

			<ControlRow label={`Letter spacing (${value.letterSpacing}px)`}>
				<Slider
					min={-2}
					max={10}
					step={1}
					value={[value.letterSpacing]}
					onValueChange={([v]) => patch({ letterSpacing: v ?? 0 })}
				/>
			</ControlRow>

			<ControlRow label="Font weight">
				<Select
					value={value.fontWeight}
					onValueChange={(fontWeight) =>
						patch({ fontWeight: fontWeight as SuvicharFontWeight })
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="normal">Normal</SelectItem>
						<SelectItem value="medium">Medium</SelectItem>
						<SelectItem value="semibold">Semibold</SelectItem>
						<SelectItem value="bold">Bold</SelectItem>
						<SelectItem value="extrabold">Extrabold</SelectItem>
					</SelectContent>
				</Select>
			</ControlRow>

			<ControlRow label="Text color">
				<div className="flex items-center gap-2">
					<input
						type="color"
						value={value.textColor ?? frameDefaults.defaultTextColor}
						onChange={(e) => patch({ textColor: e.target.value })}
						className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5"
						aria-label="Text color"
					/>
					<span className="truncate font-mono text-xs text-muted-foreground">
						{value.textColor ?? frameDefaults.defaultTextColor}
					</span>
				</div>
			</ControlRow>
		</div>
	);
}
