import type {
	DatasetAnalysisSummary,
	DatasetMetadata,
} from "@csv-insight/types";
import Link from "next/link";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { AppPageShell } from "@/components/app-page-shell";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDataset, getDatasetAnalysis } from "@/lib/api";

type DatasetChartsPageProps = {
	params: {
		datasetId: string;
	};
};

export default async function DatasetChartsPage({
	params,
}: Readonly<DatasetChartsPageProps>): Promise<JSX.Element> {
	const datasetId = params.datasetId;
	let dataset: DatasetMetadata | null = null;
	let analysis: DatasetAnalysisSummary | null = null;
	let error: string | null = null;

	try {
		const [datasetPayload, analysisPayload] = await Promise.all([
			getDataset(datasetId),
			getDatasetAnalysis(datasetId),
		]);
		dataset = datasetPayload.dataset;
		analysis = analysisPayload.analysis;
	} catch (loadError) {
		error =
			loadError instanceof Error
				? loadError.message
				: "Unable to load dataset analysis.";
	}

	return (
		<AppPageShell
			title={dataset?.originalFileName ?? "Dataset analytics"}
			actions={
				<>
					<ThemeToggle />
					<Button asChild variant="secondary">
						<Link href={`/datasets/${datasetId}/table`}>Back to table</Link>
					</Button>
					<Button asChild>
						<Link href="/datasets">Dataset list</Link>
					</Button>
				</>
			}
			alert={<ErrorBanner message={error} />}
		>
			<div className="px-4 py-4 sm:px-6 lg:px-8">
				<AnalyticsCharts analysis={analysis} dataset={dataset} />
			</div>
		</AppPageShell>
	);
}
