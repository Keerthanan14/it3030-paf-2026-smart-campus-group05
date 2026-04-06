export function formatRelativeTime(value: string | Date): string {
	const date = typeof value === 'string' ? new Date(value) : value;
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();

	if (Number.isNaN(date.getTime())) {
		return '';
	}

	const diffMinutes = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMinutes < 1) {
		return 'just now';
	}

	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`;
	}

	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}

	if (diffDays === 1) {
		return 'Yesterday';
	}

	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}

	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: diffDays > 365 ? 'numeric' : undefined,
	});
}
