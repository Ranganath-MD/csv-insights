import type { DatasetMetadata } from "@csv-insight/types";
import { AppPageShell } from "@/components/app-page-shell";
import { DatasetList } from "@/components/dataset-list";
import { DatasetUpload } from "@/components/dataset-upload";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { listDatasets } from "@/lib/api";

export default async function DatasetsPage(): Promise<JSX.Element> {
	let datasets: DatasetMetadata[] = [];
	let error: string | null = null;
	try {
		datasets = (await listDatasets()).datasets ?? [];
	} catch (loadError) {
		error =
			loadError instanceof Error
				? loadError.message
				: "Unable to load datasets.";
	}

	return (
		<AppPageShell
			actions={
				<>
					<ThemeToggle />
					<DatasetUpload />
				</>
			}
			alert={<ErrorBanner message={error} />}
		>
			<DatasetList
				datasets={datasets}
				activeDatasetId={datasets[0]?.id ?? null}
			/>
		</AppPageShell>
	);
}
