import type { DatasetMetadata, DatasetRow } from "@csv-insight/types";
import Link from "next/link";

import { AppPageShell } from "@/components/app-page-shell";
import { DatasetDataView } from "@/components/dataset-data-view";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDataset, getDatasetRows } from "@/lib/api";

type DatasetTablePageProps = {
	params: {
		datasetId: string;
	};
};

export default async function DatasetTablePage({
	params,
}: Readonly<DatasetTablePageProps>): Promise<JSX.Element> {
	const datasetId = params.datasetId;

	let dataset: DatasetMetadata | null = null;
	let rows: DatasetRow[] = [];
	let columns: string[] = [];
	let error: string | null = null;

	try {
		const [datasetPayload, rowsPayload] = await Promise.all([
			getDataset(datasetId),
			getDatasetRows(datasetId),
		]);

		dataset = datasetPayload.dataset;
		rows = rowsPayload.rows ?? [];
		columns =
			rows.length > 0
				? Object.keys(rows[0] ?? {})
				: Array.from(
						{ length: dataset.columnCount },
						(_, index) => `Column ${index + 1}`,
					);
	} catch (loadError) {
		error =
			loadError instanceof Error
				? loadError.message
				: "Unable to load dataset rows.";
	}

	return (
		<AppPageShell
			title={dataset?.originalFileName ?? "Dataset"}
			actions={
				<>
					<ThemeToggle />
					<Button asChild variant="secondary">
						<Link href="/datasets">Back to datasets</Link>
					</Button>
					<Button asChild>
						<Link href={`/datasets/${datasetId}/charts`}>View charts</Link>
					</Button>
				</>
			}
			alert={<ErrorBanner message={error} />}
		>
			<DatasetDataView dataset={dataset} rows={rows} columns={columns} />
		</AppPageShell>
	);
}
