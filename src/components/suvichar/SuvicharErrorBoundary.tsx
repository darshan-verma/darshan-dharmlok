"use client";

import React from "react";
import { ErrorFallback } from "./ErrorFallback";

interface SuvicharErrorBoundaryProps {
	children: React.ReactNode;
	fallbackTitle?: string;
}

interface SuvicharErrorBoundaryState {
	hasError: boolean;
	message: string;
}

export class SuvicharErrorBoundary extends React.Component<
	SuvicharErrorBoundaryProps,
	SuvicharErrorBoundaryState
> {
	constructor(props: SuvicharErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, message: "" };
	}

	static getDerivedStateFromError(error: Error): SuvicharErrorBoundaryState {
		return {
			hasError: true,
			message: error.message || "Unexpected render failure",
		};
	}

	componentDidCatch(error: Error) {
		console.error("[SuvicharErrorBoundary]", error);
	}

	render() {
		if (this.state.hasError) {
			return (
				<ErrorFallback
					title={this.props.fallbackTitle ?? "Suvichar render error"}
					errors={[this.state.message]}
					style={{ width: "100%", height: "100%" }}
				/>
			);
		}

		return this.props.children;
	}
}
