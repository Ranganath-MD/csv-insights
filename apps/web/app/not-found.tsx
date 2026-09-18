import Link from "next/link";

export default function NotFound(): JSX.Element {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6">
			<div className="max-w-md text-center">
				<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
					404
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-foreground">
					Page not found
				</h1>
				<p className="mt-3 text-sm text-muted-foreground">
					The page you requested does not exist or may have moved.
				</p>
				<Link
					href="/datasets"
					className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
				>
					Go to datasets
				</Link>
			</div>
		</main>
	);
}
