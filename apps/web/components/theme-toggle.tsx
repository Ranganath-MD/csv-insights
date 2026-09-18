"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle(): React.ReactElement {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = mounted && resolvedTheme === "dark";
	let buttonLabel = "Toggle theme";
	if (mounted) {
		buttonLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
	}

	return (
		<button
			type="button"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			className="inline-flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			aria-label={buttonLabel}
			title={buttonLabel}
		>
			{mounted && isDark ? (
				<SunMedium className="h-4 w-4" aria-hidden="true" />
			) : (
				<Moon className="h-4 w-4" aria-hidden="true" />
			)}
		</button>
	);
}
