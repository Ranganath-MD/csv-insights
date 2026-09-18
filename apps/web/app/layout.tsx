import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

const geist_display = Geist({
	subsets: ["latin"],
	weight: ["600"],
	variable: "--display-family",
});
const geist_body = Geist({
	subsets: ["latin"],
	weight: ["400"],
	variable: "--body-family",
});
const geist_mono = Geist_Mono({
	subsets: ["latin"],
	weight: ["400"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	title: "CSV Insight",
	description: "Developer-facing CSV analysis application",
};

type RootLayoutProps = {
	children: ReactNode;
};

export default function RootLayout({
	children,
}: Readonly<RootLayoutProps>): React.ReactElement {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${geist_display.variable} ${geist_body.variable} ${geist_mono.variable}`}
		>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
