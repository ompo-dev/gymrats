"use client";

import { useRelativeTime } from "@/hooks/use-relative-time";

interface RelativeTimeProps {
	timestamp: Date;
}

export function RelativeTime({ timestamp }: RelativeTimeProps) {
	const { timeAgo, mounted } = useRelativeTime(timestamp);

	if (!mounted) {
		return <span suppressHydrationWarning>—</span>;
	}

	return <span>{timeAgo || "—"}</span>;
}
