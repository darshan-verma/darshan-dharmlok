import { afterEach, describe, expect, it, vi } from "vitest";
import { getAirlineLogoUrl } from "./airline-logo";

const S3_BASE =
	"https://your-bucket.s3.ap-south-1.amazonaws.com/airline-images";

describe("airline-logo", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("without NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL", () => {
		it("builds logo path from IATA code", () => {
			expect(getAirlineLogoUrl("ai")).toBe("/airline-images/AI.png");
			expect(getAirlineLogoUrl("6E")).toBe("/airline-images/6E.png");
		});

		it("uses multi logo for empty or multi codes", () => {
			expect(getAirlineLogoUrl("")).toBe("/airline-images/multi.png");
			expect(getAirlineLogoUrl("MULTI")).toBe("/airline-images/multi.png");
		});
	});

	describe("with NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL", () => {
		it("builds full S3 URL from IATA code", () => {
			vi.stubEnv("NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL", S3_BASE);
			expect(getAirlineLogoUrl("ai")).toBe(`${S3_BASE}/AI.png`);
			expect(getAirlineLogoUrl("6E")).toBe(`${S3_BASE}/6E.png`);
		});

		it("uses multi logo for empty or multi codes", () => {
			vi.stubEnv("NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL", S3_BASE);
			expect(getAirlineLogoUrl("")).toBe(`${S3_BASE}/multi.png`);
			expect(getAirlineLogoUrl("MULTI")).toBe(`${S3_BASE}/multi.png`);
		});

		it("strips a trailing slash from the base URL", () => {
			vi.stubEnv(
				"NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL",
				`${S3_BASE}/`,
			);
			expect(getAirlineLogoUrl("6E")).toBe(`${S3_BASE}/6E.png`);
		});
	});
});
