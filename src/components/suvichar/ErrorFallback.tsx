"use client";

interface ErrorFallbackProps {
	errors: string[];
	title?: string;
	className?: string;
	style?: React.CSSProperties;
}

export function ErrorFallback({
	errors,
	title = "Suvichar render error",
	className,
	style,
}: ErrorFallbackProps) {
	if (errors.length === 0) return null;

	return (
		<div
			className={className}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				border: "2px solid #ef4444",
				backgroundColor: "#fef2f2",
				padding: "12px",
				textAlign: "center",
				boxSizing: "border-box",
				...style,
			}}
			role="alert"
		>
			<p style={{ margin: 0, fontWeight: 600, color: "#b91c1c", fontSize: "14px" }}>
				{title}
			</p>
			<ul
				style={{
					margin: "8px 0 0",
					paddingLeft: "18px",
					textAlign: "left",
					color: "#dc2626",
					fontSize: "12px",
					lineHeight: 1.4,
				}}
			>
				{errors.map((error) => (
					<li key={error}>{error}</li>
				))}
			</ul>
		</div>
	);
}
