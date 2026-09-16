export function AnalyticsCharts(): JSX.Element {
	const pieSegments = [
		{ label: "Hardware", value: 45, color: "hsl(var(--chart-1))" },
		{ label: "Peripherals", value: 35, color: "hsl(var(--chart-2))" },
		{ label: "Accessories", value: 20, color: "hsl(var(--chart-3))" },
	];

	const regionBars = [
		{ label: "N. America", value: 45, height: 130 },
		{ label: "Europe", value: 32, height: 100 },
		{ label: "Asia Pac", value: 24, height: 80 },
		{ label: "L. America", value: 12, height: 55 },
	];

	const monthly = [40, 60, 55, 75, 65, 80, 70, 95, 88, 110, 100, 120];

	const products = [
		{ name: "Wireless Mouse Pro", value: 420 },
		{ name: "Ergonomic Keyboard", value: 310 },
		{ name: "Developer Monitor", value: 220 },
		{ name: "Pro Workstation 500", value: 145 },
	];

	const pieStyle = {
		background:
			"conic-gradient(hsl(var(--chart-1)) 0 45%, hsl(var(--chart-2)) 45% 80%, hsl(var(--chart-3)) 80% 100%)",
	};

	return (
		<div className="space-y-4">
			<div className="grid gap-6 lg:grid-cols-2">
				<section className="border border-border bg-card p-6">
					<h3 className="mb-5 text-xl font-semibold text-foreground">
						Sales by Product Category
					</h3>

					<div className="flex items-center gap-8">
						<div
							className="relative flex h-40 w-40 items-center justify-center rounded-full"
							style={pieStyle}
						>
							<div className="flex h-24 w-24 items-center justify-center rounded-full bg-card text-center">
								<div>
									<div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										Total
									</div>
									<div className="mt-1 text-2xl font-semibold text-foreground">
										$68.5K
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-3 text-sm text-muted-foreground">
							{pieSegments.map((segment) => (
								<div key={segment.label} className="flex items-center gap-2">
									<span
										className="inline-block h-3 w-3 rounded-sm"
										style={{ backgroundColor: segment.color }}
									/>
									<span>{segment.label}</span>
									<span className="text-muted-foreground/80">
										({segment.value}%)
									</span>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="border border-border bg-card p-6">
					<h3 className="mb-5 text-xl font-semibold text-foreground">
						Revenue by Region
					</h3>

					<div className="flex h-44 items-end justify-between gap-4 pt-8">
						{regionBars.map((item) => (
							<div
								key={item.label}
								className="flex flex-1 flex-col items-center gap-3"
							>
								<div className="flex items-end">
									<div
										className="w-16 rounded-t-sm bg-[hsl(var(--chart-1))]"
										style={{ height: `${item.height}px` }}
									/>
								</div>
								<div className="text-xs text-muted-foreground">
									{item.label}
								</div>
							</div>
						))}
					</div>
				</section>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="border border-border bg-card p-6">
					<h3 className="mb-5 text-xl font-semibold text-foreground">
						Monthly Sales Trend
					</h3>

					<div className="relative h-48 overflow-hidden border border-border bg-muted/35 p-4">
						<svg viewBox="0 0 420 180" className="h-full w-full">
							<path
								d="M 0 120 L 60 80 L 120 95 L 180 72 L 240 90 L 300 55 L 360 60 L 420 28"
								fill="none"
								stroke="hsl(var(--chart-1))"
								strokeWidth="3"
								strokeLinecap="round"
							/>
							{[0, 60, 120, 180, 240, 300, 360].map((x) => (
								<line
									key={x}
									x1={x}
									y1={0}
									x2={x}
									y2={180}
									stroke="hsl(var(--border))"
									strokeDasharray="4 6"
								/>
							))}
							{[0, 40, 80, 120, 160, 180].map((y) => (
								<line
									key={y}
									x1={0}
									y1={y}
									x2={420}
									y2={y}
									stroke="hsl(var(--border))"
									strokeDasharray="4 6"
								/>
							))}
						</svg>
					</div>
				</section>

				<section className="border border-border bg-card p-6">
					<h3 className="mb-5 text-xl font-semibold text-foreground">
						Top Products by Units Sold
					</h3>

					<div className="space-y-4">
						{products.map((product) => (
							<div key={product.name} className="space-y-1">
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<span>{product.name}</span>
									<span className="font-medium text-foreground">
										{product.value}
									</span>
								</div>
								<div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-[hsl(var(--chart-1))]"
										style={{ width: `${(product.value / 420) * 100}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
