import type { ProkeralaReportRequestBody } from "@/types/prokerala";

export const DHARMLOK_REPORT_BRAND_NAME = "Dharmlok";
export const DHARMLOK_REPORT_FOOTER =
	"www.dharmlok.com support@dharmlok.com Call now : 1800 425 0053";

/**
 * Applies Dharmlok branding server-side so clients cannot override brand/footer.
 */
export function applyDharmlokReportBranding(
	body: ProkeralaReportRequestBody
): ProkeralaReportRequestBody {
	const report = {
		...(body.options.report ?? {}),
		brand_name: DHARMLOK_REPORT_BRAND_NAME,
	};
	const template = {
		...(body.options.template ?? {}),
		footer: DHARMLOK_REPORT_FOOTER,
	};
	return {
		input: body.input,
		options: {
			...body.options,
			report,
			template,
		},
	};
}
