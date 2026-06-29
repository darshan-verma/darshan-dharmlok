"use client";

import {
	forwardRef,
	type ChangeEvent,
	type ComponentProps,
	type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { sanitizeTboContactNumberInput } from "@/lib/tboFlightSearch";

type TboPhoneInputProps = Omit<ComponentProps<typeof Input>, "type" | "inputMode"> & {
	/** Max digit length while typing (default 10 for Indian mobile). */
	maxDigits?: number;
};

const ALLOWED_CONTROL_KEYS = new Set([
	"Backspace",
	"Delete",
	"Tab",
	"Escape",
	"Enter",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"ArrowDown",
	"Home",
	"End",
]);

function isAllowedPhoneKey(e: KeyboardEvent<HTMLInputElement>): boolean {
	if (e.ctrlKey || e.metaKey || e.altKey) return true;
	if (ALLOWED_CONTROL_KEYS.has(e.key)) return true;
	return /^\d$/.test(e.key);
}

/** TBO contact fields: digits only (10-digit Indian mobile by default). */
export const TboPhoneInput = forwardRef<HTMLInputElement, TboPhoneInputProps>(
	function TboPhoneInput(
		{ onChange, onKeyDown, onPaste, value, maxDigits = 10, ...props },
		ref,
	) {
		const emitChange = (
			input: HTMLInputElement,
			baseEvent?: ChangeEvent<HTMLInputElement>,
		) => {
			const sanitized = sanitizeTboContactNumberInput(input.value, maxDigits);
			if (sanitized !== input.value) {
				input.value = sanitized;
			}
			if (baseEvent) {
				onChange?.({
					...baseEvent,
					target: { ...baseEvent.target, value: sanitized },
					currentTarget: { ...baseEvent.currentTarget, value: sanitized },
				});
				return;
			}
			onChange?.({
				target: { ...input, value: sanitized },
				currentTarget: { ...input, value: sanitized },
			} as ChangeEvent<HTMLInputElement>);
		};

		return (
			<Input
				ref={ref}
				type="tel"
				inputMode="numeric"
				pattern="[0-9]*"
				maxLength={maxDigits}
				autoComplete="tel"
				value={value ?? ""}
				{...props}
				onKeyDown={(e) => {
					if (!isAllowedPhoneKey(e)) {
						e.preventDefault();
					}
					onKeyDown?.(e);
				}}
				onBeforeInput={(e) => {
					const data = (e.nativeEvent as InputEvent).data;
					if (data && /\D/.test(data)) {
						e.preventDefault();
					}
				}}
				onChange={(e) => emitChange(e.currentTarget, e)}
				onInput={(e) => {
					const input = e.currentTarget;
					const sanitized = sanitizeTboContactNumberInput(
						input.value,
						maxDigits,
					);
					if (sanitized !== input.value) {
						input.value = sanitized;
						emitChange(input);
					}
				}}
				onPaste={(e) => {
					e.preventDefault();
					const input = e.currentTarget;
					const pasted = sanitizeTboContactNumberInput(
						e.clipboardData.getData("text"),
						maxDigits,
					);
					const start = input.selectionStart ?? input.value.length;
					const end = input.selectionEnd ?? input.value.length;
					input.value = sanitizeTboContactNumberInput(
						input.value.slice(0, start) + pasted + input.value.slice(end),
						maxDigits,
					);
					emitChange(input);
					onPaste?.(e);
				}}
			/>
		);
	},
);
