"use client";

import { useEffect, useRef, useState } from "react";

export function usePWAUpdate() {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const isReloadingRef = useRef(false);
	const hasCheckedInitialRef = useRef(false);

	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}
		if (process.env.NODE_ENV === "development") {
			return;
		}

		let _registration: ServiceWorkerRegistration | null = null;
		let updateInterval: NodeJS.Timeout | null = null;
		let visibilityHandler: (() => void) | null = null;
		let messageHandler: ((event: MessageEvent) => void) | null = null;

		const registerSW = async () => {
			try {
				const response = await fetch("/sw.js", { method: "HEAD" });
				if (!response.ok) return;

				const reg = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				_registration = reg;

				const checkForWaitingWorker = () => {
					if (process.env.NODE_ENV === "development") return;
					if (reg.waiting && !isReloadingRef.current) {
						isReloadingRef.current = true;
						setIsUpdating(true);
						reg.waiting.postMessage({ type: "SKIP_WAITING" });
						setTimeout(() => window.location.reload(), 500);
					}
				};

				if (!hasCheckedInitialRef.current) {
					hasCheckedInitialRef.current = true;
					setTimeout(() => checkForWaitingWorker(), 1000);
				}

				const updateFoundHandler = () => {
					const newWorker = reg.installing;
					if (!newWorker) return;

					const stateChangeHandler = () => {
						if (newWorker.state === "installed") {
							if (navigator.serviceWorker.controller) {
								if (process.env.NODE_ENV === "production") {
									checkForWaitingWorker();
								} else {
									setUpdateAvailable(true);
								}
							}
						}
					};

					newWorker.addEventListener("statechange", stateChangeHandler);
				};

				reg.addEventListener("updatefound", updateFoundHandler);

				if (process.env.NODE_ENV === "production") {
					updateInterval = setInterval(() => {
						if (!isReloadingRef.current) reg.update();
					}, 60000);

					visibilityHandler = () => {
						if (!document.hidden && !isReloadingRef.current) {
							reg.update();
						}
					};
					document.addEventListener("visibilitychange", visibilityHandler);
				}

				messageHandler = (event: MessageEvent) => {
					if (event.data?.type === "SW_UPDATED") {
						if (process.env.NODE_ENV === "development") return;
						if (isReloadingRef.current) return;
						isReloadingRef.current = true;
						setIsUpdating(true);
						setTimeout(() => window.location.reload(), 500);
					}
				};
				navigator.serviceWorker.addEventListener("message", messageHandler);
			} catch {
				// Silently ignore SW registration errors
			}
		};

		if (document.readyState === "complete") {
			registerSW();
		} else {
			window.addEventListener("load", registerSW);
		}

		return () => {
			if (updateInterval) clearInterval(updateInterval);
			if (visibilityHandler) {
				document.removeEventListener("visibilitychange", visibilityHandler);
			}
			if (messageHandler) {
				navigator.serviceWorker.removeEventListener("message", messageHandler);
			}
		};
	}, []);

	const applyUpdate = async () => {
		if (
			!("serviceWorker" in navigator) ||
			!navigator.serviceWorker.controller ||
			isReloadingRef.current
		) {
			return;
		}

		isReloadingRef.current = true;
		setIsUpdating(true);

		try {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration?.waiting) {
				registration.waiting.postMessage({ type: "SKIP_WAITING" });
			}
			setTimeout(() => window.location.reload(), 100);
		} catch {
			isReloadingRef.current = false;
			setIsUpdating(false);
		}
	};

	return {
		updateAvailable,
		isUpdating,
		applyUpdate,
	};
}
