import { AppPageShell } from "@/components/app-page-shell";
import { DatasetList } from "@/components/datasets/dataset-list";
import { DatasetUpload } from "@/components/datasets/dataset-upload";
import { ThemeToggle } from "@/components/theme-toggle";
import { listDatasets } from "@/lib/api";

export default async function DatasetsPage(): Promise<React.ReactElement> {
	const response = await listDatasets();
	const datasets = response.datasets ?? [];

	return (
		<AppPageShell
			actions={
				<>
					<ThemeToggle />
					<DatasetUpload />
				</>
			}
		>
			<DatasetList
				datasets={datasets}
				activeDatasetId={datasets[0]?.id ?? null}
			/>
		</AppPageShell>
	);
}
