import { toPng } from "html-to-image";

export interface ExportPngOptions {
	pixelRatio?: number;
	backgroundColor?: string;
}

/** Export a DOM node to PNG and trigger browser download */
export async function exportElementToPng(
	element: HTMLElement,
	filename: string,
	options: ExportPngOptions = {},
): Promise<void> {
	const dataUrl = await toPng(element, {
		pixelRatio: options.pixelRatio ?? 2,
		cacheBust: true,
		backgroundColor: options.backgroundColor ?? "#ffffff",
	});

	const link = document.createElement("a");
	link.download = filename;
	link.href = dataUrl;
	link.click();
}
