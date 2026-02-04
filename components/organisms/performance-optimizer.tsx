"use client";

import { useEffect } from "react";

export function PerformanceOptimizer() {
	useEffect(() => {
		const addPreconnect = (href: string, crossOrigin?: string) => {
			const link = document.createElement("link");
			link.rel = "preconnect";
			link.href = href;
			if (crossOrigin) {
				link.crossOrigin = crossOrigin;
			}
			document.head.appendChild(link);
		};

		const addDnsPrefetch = (href: string) => {
			const link = document.createElement("link");
			link.rel = "dns-prefetch";
			link.href = href;
			document.head.appendChild(link);
		};

		addPreconnect("https://fonts.googleapis.com", "anonymous");
		addPreconnect("https://fonts.gstatic.com", "anonymous");
		addDnsPrefetch("https://fonts.googleapis.com");
		addDnsPrefetch("https://fonts.gstatic.com");
	}, []);

	return null;
}
