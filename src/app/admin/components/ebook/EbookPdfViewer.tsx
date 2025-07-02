import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import React from "react";

interface EbookPdfViewerProps {
	pdfUrl?: string;
	fileName?: string;
}

export default function EbookPdfViewer({
	pdfUrl,
	fileName,
}: EbookPdfViewerProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>PDF Viewer</CardTitle>
				<CardDescription>View the uploaded PDF ebook here.</CardDescription>
			</CardHeader>
			<CardContent>
				{pdfUrl && (
					<>
						<div className="flex items-center gap-2 mb-2">
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-blue-700 underline break-all"
							>
								{fileName || pdfUrl.split("/").pop()}
							</a>
						</div>
						<iframe
							src={pdfUrl}
							title="Ebook PDF"
							width="100%"
							height="600px"
							className="border rounded"
						/>
					</>
				)}
				{!pdfUrl && (
					<p className="text-gray-500">No PDF uploaded for this ebook.</p>
				)}
			</CardContent>
		</Card>
	);
}
