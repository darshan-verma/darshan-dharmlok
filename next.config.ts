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
			// Add other existing remote patterns here if you have any
			// For example:
			// {
			//   protocol: 'https',
			//   hostname: 'another-domain.com',
			//   port: '',
			//   pathname: '/**',
			// },
			{
				protocol: "https",
				hostname: "dharmlok.s3.us-east-1.amazonaws.com",
				port: "",
				pathname: "/**",
			},
		],
	},
	// ... any other existing configurations
};

export default nextConfig;
