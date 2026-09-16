"use client";

import { Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle(): JSX.Element {
	const [isDark, setIsDark] = useState(true);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const savedTheme = window.localStorage.getItem("theme");
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		const nextTheme = savedTheme ? savedTheme === "dark" : prefersDark;

		setIsDark(nextTheme);
		document.documentElement.classList.toggle("dark", nextTheme);
		document.documentElement.style.colorScheme = nextTheme ? "dark" : "light";
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) {
			return;
		}

		document.documentElement.classList.toggle("dark", isDark);
		document.documentElement.style.colorScheme = isDark ? "dark" : "light";
		window.localStorage.setItem("theme", isDark ? "dark" : "light");
	}, [isDark, mounted]);

	return (
		<button
			type="button"
			onClick={() => setIsDark((current) => !current)}
			className="inline-flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			{mounted && isDark ? (
				<SunMedium className="h-4 w-4" aria-hidden="true" />
			) : (
				<Moon className="h-4 w-4" aria-hidden="true" />
			)}
		</button>
	);
}
