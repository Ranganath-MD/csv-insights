export type DatasetSourceItem = {
	id: string;
	uploadedAt: string;
};

export function mergeDatasetSources<T extends DatasetSourceItem>(
	localDatasets: T[],
	persistedDatasets: T[],
): T[] {
	const merged = new Map<string, T>();

	for (const dataset of [...persistedDatasets, ...localDatasets]) {
		if (!merged.has(dataset.id)) {
			merged.set(dataset.id, dataset);
		}
	}

	return Array.from(merged.values()).sort((a, b) =>
		b.uploadedAt.localeCompare(a.uploadedAt),
	);
}
