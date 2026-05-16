import { useEffect } from "react";
import { useGymsDataStore } from "@/stores/gyms-list-store";

/**
 * Hook para acessar dados das academias
 * Usa selectors do Zustand para performance otimizada
 */
export function useGymsList() {
	// Selectors otimizados (só re-renderiza se esses dados mudarem)
	const gymsData = useGymsDataStore((state) => state.gymsData);
	const activeGymId = useGymsDataStore((state) => state.activeGymId);
	const canCreateMultipleGyms = useGymsDataStore(
		(state) => state.canCreateMultipleGyms,
	);
	const isLoading = useGymsDataStore((state) => state.isLoading);
	const setActiveGymId = useGymsDataStore((state) => state.setActiveGymId);
	const loadAllGyms = useGymsDataStore((state) => state.loadAllGyms);

	// Carregar TODAS as academias ao montar (UMA VEZ SÓ)
	useEffect(() => {
		loadAllGyms();

		// Verificar se precisa refresh (ex: após criar nova academia)
		const needsRefresh = sessionStorage.getItem("refresh-gyms");
		if (needsRefresh === "true") {
			sessionStorage.removeItem("refresh-gyms");
			loadAllGyms();
		}
	}, [loadAllGyms]);

	// Converter Record para Array (para compatibilidade)
	const gyms = Object.values(gymsData);

	// Academia ativa (selector otimizado)
	const activeGym = activeGymId ? gymsData[activeGymId] : null;

	return {
		// Lista de todas as academias
		gyms,

		// Academia ativa
		activeGym,
		activeGymId,

		// Dados completos de todas as academias (para uso avançado)
		gymsData,

		// Permissões e estado
		canCreateMultipleGyms,
		isLoading,

		// Actions
		setActiveGymId, // ← INSTANTÂNEO! Só muda o ID
		refreshGyms: loadAllGyms, // ← Recarregar tudo (raro)
	};
}
