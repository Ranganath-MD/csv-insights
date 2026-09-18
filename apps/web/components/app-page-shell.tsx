import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageShellProps = {
	title?: string;
	actions?: ReactNode;
	alert?: ReactNode;
	children: ReactNode;
	contentClassName?: string;
};

export function AppPageShell({
	title,
	actions,
	alert,
	children,
	contentClassName,
}: Readonly<AppPageShellProps>): React.ReactElement {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="w-full">
				<header className="border-b border-border">
					<div className="mx-auto flex max-w-7xl flex-col gap-4 border-x px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
								CSV Insight
							</p>
							{title ? (
								<h1 className="mt-1 text-2xl font-semibold text-foreground">
									{title}
								</h1>
							) : null}
						</div>

						{actions ? (
							<div className="flex flex-wrap items-center gap-3">{actions}</div>
						) : null}
					</div>
				</header>

				{alert}

				<div
					className={cn(
						"mx-auto min-h-screen max-w-7xl border-x",
						contentClassName,
					)}
				>
					{children}
				</div>
			</div>
		</main>
	);
}
