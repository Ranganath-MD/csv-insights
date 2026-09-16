"use client";

import { useParams, useRouter } from "next/navigation";

import { AnalyticsCharts } from "@/components/analytics-charts";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DatasetChartsPage(): JSX.Element {
	const router = useRouter();
	const params = useParams<{ datasetId: string }>();

	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="w-full">
				<header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
								CSV Insight
							</p>
							<h1 className="mt-1 text-2xl font-semibold text-foreground">
								Dataset analytics
							</h1>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<ThemeToggle />
							<button
								type="button"
								onClick={() =>
									router.push(`/datasets/${params.datasetId}/table`)
								}
								className="border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							>
								← Back to table
							</button>
							<button
								type="button"
								onClick={() => router.push("/datasets")}
								className="border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							>
								Dataset list
							</button>
						</div>
					</div>
				</header>

				<div className="px-4 py-4 sm:px-6 lg:px-8">
					<AnalyticsCharts />
				</div>
			</div>
		</main>
	);
}
