"use client";

import { useLayoutEffect } from "react";

export function useScrollToTop(deps: unknown[]) {
	useLayoutEffect(() => {
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}, deps);
}
