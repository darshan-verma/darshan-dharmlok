declare module "react-textfit" {
	import { Component, CSSProperties, ReactNode } from "react";

	export interface TextfitProps {
		children?: ReactNode;
		text?: string;
		min?: number;
		max?: number;
		mode?: "single" | "multi";
		forceWidth?: boolean;
		forceSingleModeWidth?: boolean;
		throttle?: number;
		autoResize?: boolean;
		onReady?: (fontSize: number) => void;
		style?: CSSProperties;
		className?: string;
	}

	export class Textfit extends Component<TextfitProps> {}
}
