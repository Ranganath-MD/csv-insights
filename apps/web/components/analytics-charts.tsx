"use client";

import type {
	DatasetAnalysisSummary,
	DatasetMetadata,
} from "@csv-insight/types";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type AnalyticsChartsProps = {
	analysis: DatasetAnalysisSummary | null;
	dataset: DatasetMetadata | null;
};

const CHART_COLORS = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

export function AnalyticsCharts({
	analysis,
	dataset,
}: Readonly<AnalyticsChartsProps>): JSX.Element {
	const summary = analysis?.dataset ?? {
		rowCount: 0,
		columnCount: 0,
		fileSizeBytes: 0,
		missingValueCount: 0,
		duplicateRowCount: 0,
	};

	const columnData = analysis?.columns ?? [];
	const typeBreakdown = [
		{
			name: "string",
			value: columnData.filter((column) => column.detectedType === "string")
				.length,
		},
		{
			name: "number",
			value: columnData.filter((column) => column.detectedType === "number")
				.length,
		},
		{
			name: "boolean",
			value: columnData.filter((column) => column.detectedType === "boolean")
				.length,
		},
		{
			name: "date",
			value: columnData.filter((column) => column.detectedType === "date")
				.length,
		},
		{
			name: "unknown",
			value: columnData.filter((column) => column.detectedType === "unknown")
				.length,
		},
	].filter((segment) => segment.value > 0);

	const missingData = columnData.slice(0, 6).map((column, index) => ({
		name: column.columnName,
		missing: column.missingValues,
		fill: CHART_COLORS[index % CHART_COLORS.length],
	}));

	const rowTrend = Array.from(
		{ length: Math.min(8, Math.max(summary.rowCount, 1)) },
		(_, index) => ({
			label: `Row ${index + 1}`,
			value: Math.max(0, summary.rowCount - index),
		}),
	);

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-4">
				{[
					{ label: "Rows", value: summary.rowCount },
					{ label: "Columns", value: summary.columnCount },
					{ label: "Missing values", value: summary.missingValueCount },
					{
						label: "File size",
						value: `${(summary.fileSizeBytes / 1024).toFixed(1)} KB`,
					},
				].map((item) => (
					<div key={item.label} className="border border-border bg-card p-4">
						<p className="text-sm text-muted-foreground">{item.label}</p>
						<p className="mt-2 text-2xl font-semibold text-foreground">
							{item.value}
						</p>
					</div>
				))}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="border border-border bg-card p-6">
					<h3 className="mb-5 text-xl font-semibold text-foreground">
						Column data types
					</h3>
					<div className="h-72">
						{typeBreakdown.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={typeBreakdown}
										dataKey="value"
										nameKey="name"
										innerRadius={48}
										outerRadius={80}
									>
										{typeBreakdown.map((entry, index) => (
											<Cell
												key={entry.name}
												fill={CHART_COLORS[index % CHART_COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								No column data available yet.
							</div>
						)}
					</div>
				</section>

				<section className="border border-border bg-card p-6">
					<h3 className="mb-5 text-xl font-semibold text-foreground">
						Missing values by column
					</h3>
					<div className="h-72">
						{missingData.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={missingData}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} />
									<XAxis
										dataKey="name"
										tick={{ fontSize: 11 }}
										interval={0}
										angle={-15}
										textAnchor="end"
										height={60}
									/>
									<YAxis allowDecimals={false} />
									<Tooltip />
									<Bar dataKey="missing" radius={[6, 6, 0, 0]}>
										{missingData.map((entry) => (
											<Cell key={entry.name} fill={entry.fill} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								No missing-value metrics to chart.
							</div>
						)}
					</div>
				</section>
			</div>

			<section className="border border-border bg-card p-6">
				<h3 className="mb-5 text-xl font-semibold text-foreground">
					Dataset size overview
				</h3>
				<div className="h-72">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={rowTrend}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="label" />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Line
								type="monotone"
								dataKey="value"
								stroke="hsl(var(--chart-1))"
								strokeWidth={3}
								dot={{ r: 4 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</section>

			{dataset ? (
				<p className="text-sm text-muted-foreground">
					Source file: {dataset.originalFileName} · Duplicate rows:{" "}
					{summary.duplicateRowCount}
				</p>
			) : null}
		</div>
	);
}
