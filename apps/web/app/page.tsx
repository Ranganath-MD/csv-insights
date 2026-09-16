"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage(): JSX.Element {
	const router = useRouter();

	useEffect(() => {
		router.replace("/datasets");
	}, [router]);

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
			<p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
				Redirecting to datasets...
			</p>
		</main>
	);
}
