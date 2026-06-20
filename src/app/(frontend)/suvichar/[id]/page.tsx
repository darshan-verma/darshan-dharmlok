"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, Link2, Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { DISPLAY_SIZES, SuvicharCard } from "@/components/suvichar/SuvicharCard";
import { toast } from "@/lib/toast";
import type {
	DailySuvicharDto,
	TodaySuvicharFrame,
	TodaySuvicharText,
} from "@/lib/suvichar/types";

function toPreviewPayload(row: DailySuvicharDto): {
	text: TodaySuvicharText;
	frame: TodaySuvicharFrame;
} | null {
	if (!row.suvicharText || !row.frame) return null;

	return {
		text: {
			blocknoteJson: JSON.parse(row.suvicharText.blocknoteJson) as unknown,
			plainText: row.suvicharText.plainText,
			title: row.suvicharText.title,
		},
		frame: {
			imageUrl: row.frame.imageUrl,
			width: row.frame.width,
			height: row.frame.height,
			safeArea: {
				x: row.frame.safeAreaX,
				y: row.frame.safeAreaY,
				width: row.frame.safeAreaWidth,
				height: row.frame.safeAreaHeight,
			},
			defaultTextColor: row.frame.defaultTextColor,
			defaultFontSize: row.frame.defaultFontSize,
			defaultTextAlign: row.frame.defaultTextAlign,
		},
	};
}

export default function PublicSuvicharPage() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [suvichar, setSuvichar] = useState<DailySuvicharDto | null>(null);

	const shareUrl = useMemo(() => {
		if (typeof window === "undefined" || !id) return "";
		return `${window.location.origin}/suvichar/${id}`;
	}, [id]);

	useEffect(() => {
		if (!id) {
			setError("Invalid suvichar link");
			setLoading(false);
			return;
		}

		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/suvichar/public/${id}`);
				const json = (await res.json()) as DailySuvicharDto & { error?: string };
				if (!res.ok) {
					throw new Error(json.error || "Failed to load suvichar");
				}
				if (!cancelled) setSuvichar(json);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load suvichar");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [id]);

	const preview = suvichar ? toPreviewPayload(suvichar) : null;

	const copyLink = async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Could not copy link");
		}
	};

	const shareWhatsApp = () => {
		if (!shareUrl) return;
		const text = encodeURIComponent(
			`Today's Suvichar${suvichar?.suvicharText?.title ? `: ${suvichar.suvicharText.title}` : ""}\n${shareUrl}`,
		);
		window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
	};

	const shareTwitter = () => {
		if (!shareUrl) return;
		const text = encodeURIComponent(
			suvichar?.suvicharText?.title
				? `Today's Suvichar: ${suvichar.suvicharText.title}`
				: "Today's Suvichar",
		);
		const url = encodeURIComponent(shareUrl);
		window.open(
			`https://twitter.com/intent/tweet?text=${text}&url=${url}`,
			"_blank",
			"noopener,noreferrer",
		);
	};

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-10">
				{loading ? (
					<div className="flex items-center gap-2 py-20 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading suvichar…
					</div>
				) : error ? (
					<div className="space-y-4 py-16 text-center">
						<p className="text-destructive">{error}</p>
						<Button asChild variant="outline">
							<Link href="/">Back to home</Link>
						</Button>
					</div>
				) : preview && suvichar ? (
					<>
						<div className="text-center">
							<h1 className="text-2xl font-semibold">
								{suvichar.suvicharText?.title ?? "Daily Suvichar"}
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								{suvichar.scheduledDate}
							</p>
						</div>

						<SuvicharCard
							text={preview.text}
							frame={preview.frame}
							textStyleOverrides={suvichar.textStyleOverrides}
							displaySize={DISPLAY_SIZES.fullscreen}
						/>

						<div className="flex w-full flex-wrap items-center justify-center gap-2">
							<Button type="button" variant="outline" onClick={() => void copyLink()}>
								<Link2 className="mr-2 h-4 w-4" />
								Copy link
							</Button>
							<Button type="button" variant="outline" onClick={shareWhatsApp}>
								Share on WhatsApp
							</Button>
							<Button type="button" variant="outline" onClick={shareTwitter}>
								Share on X
							</Button>
							<Button type="button" variant="outline" disabled title="Image export coming soon">
								<Download className="mr-2 h-4 w-4" />
								Download
							</Button>
						</div>
					</>
				) : (
					<p className="py-16 text-muted-foreground">Suvichar not available.</p>
				)}
			</main>
			<Footer />
		</div>
	);
}
