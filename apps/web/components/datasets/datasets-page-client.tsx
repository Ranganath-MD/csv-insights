import { AppPageShell } from "@/components/app-page-shell";
import { DatasetUpload } from "@/components/datasets/dataset-upload";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";

export function DatasetsPageClient(): React.ReactElement {
	return (
		<AppPageShell
			actions={
				<>
					<ThemeToggle />
					<DatasetUpload />
				</>
			}
			alert={<ErrorBanner message={null} />}
		>
			<div />
		</AppPageShell>
	);
}
