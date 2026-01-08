import type { NextConfig } from "next";

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
				hostname: "dharmlok.s3.us-east-1.amazonaws.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "example.com",
				port: "",
				pathname: "/**",
			},
			// TBO Hotel Images - common image hosting domains
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
		],
	},
	// ... any other existing configurations
};

export default nextConfig;
