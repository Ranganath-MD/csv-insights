type ErrorBannerProps = {
	message: string | null;
};

export function ErrorBanner({
	message,
}: Readonly<ErrorBannerProps>): React.ReactElement | null {
	if (!message) {
		return null;
	}

	return (
		<div
			className="mx-auto mt-4 max-w-screen-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:px-6 lg:px-8"
			role="alert"
		>
			{message}
		</div>
	);
}
