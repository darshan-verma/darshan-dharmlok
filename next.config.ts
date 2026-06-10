import type { NextConfig } from "next";

const s3Hostname = process.env.NEXT_PUBLIC_S3_HOSTNAME?.trim();

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.assettype.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "sharpex.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "www.shutterstock.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "d18us13qqo82ck.cloudfront.net",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "dharmlok.s3.us-east-1.amazonaws.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "dharmlok.s3.ap-south-1.amazonaws.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "example.com",
				port: "",
				pathname: "/**",
			},
			// TBO Hotel Images
			{
				protocol: "https",
				hostname: "*.tbotechnology.in",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "*.tbotechnology.in",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "www.tboholidays.com",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "www.tboholidays.com",
				pathname: "/**",
			},
			// TripJack / Expedia hotel images
			{
				protocol: "https",
				hostname: "i.travelapi.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "static-images.webbeds.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "*.travelapi.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "plus.unsplash.com",
				port: "",
				pathname: "/**",
			},
			// Google profile images
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "*.googleusercontent.com",
				port: "",
				pathname: "/**",
			},
			// YouTube thumbnails
			{
				protocol: "https",
				hostname: "img.youtube.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "pro-section.ui-layouts.com",
				port: "",
				pathname: "/**",
			},
			// Airline logo PNGs (NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL)
			...(s3Hostname
				? [
						{
							protocol: "https" as const,
							hostname: s3Hostname,
							port: "",
							pathname: "/**",
						},
					]
				: []),
		],
	},
	// ... any other existing configurations
};

export default nextConfig;
