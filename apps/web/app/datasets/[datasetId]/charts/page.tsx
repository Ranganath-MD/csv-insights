import Link from "next/link";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { AppPageShell } from "@/components/app-page-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type DatasetChartsPageProps = {
	params: {
		datasetId: string;
	};
};

export default function DatasetChartsPage({
	params,
}: Readonly<DatasetChartsPageProps>): JSX.Element {
	return (
		<AppPageShell
			title="Dataset analytics"
			actions={
				<>
					<ThemeToggle />
					<Button asChild variant="secondary">
						<Link href={`/datasets/${params.datasetId}/table`}>
							Back to table
						</Link>
					</Button>
					<Button asChild>
						<Link href="/datasets">Dataset list</Link>
					</Button>
				</>
			}
		>
			<div className="px-4 py-4 sm:px-6 lg:px-8">
				<AnalyticsCharts />
			</div>
		</AppPageShell>
	);
}
