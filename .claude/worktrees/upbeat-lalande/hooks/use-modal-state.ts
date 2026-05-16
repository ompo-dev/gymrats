"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect } from "react";

/**
 * Hook utilitário para gerenciar estado de modais usando search parameters (nuqs)
 *
 * @param modalName - Nome do modal (ex: "add-meal", "food-search")
 * @returns Objeto com estado e funções para controlar o modal
 *
 * @example
 * ```tsx
 * const { isOpen, open, close } = useModalState("add-meal");
 *
 * // Abrir modal
 * <Button onClick={open}>Abrir Modal</Button>
 *
 * // Renderizar condicionalmente
 * {isOpen && <AddMealModal onClose={close} />}
 * ```
 */
export function useModalState(modalName: string) {
	const [modal, setModal] = useQueryState("modal", parseAsString);
	const isOpen = modal === modalName;

	const open = useCallback(() => {
		setModal(modalName);
	}, [modalName, setModal]);

	const close = useCallback(() => {
		setModal(null);
	}, [setModal]);

	const toggle = useCallback(() => {
		if (isOpen) {
			close();
		} else {
			open();
		}
	}, [isOpen, open, close]);

	return {
		isOpen,
		open,
		close,
		toggle,
	};
}

/**
 * Hook para modais com parâmetro adicional (ex: workoutId, mealId)
 *
 * @param modalName - Nome do modal
 * @param paramName - Nome do parâmetro adicional (ex: "workoutId", "mealId")
 * @returns Objeto com estado e funções para controlar o modal e o parâmetro
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, paramValue, setParamValue } = useModalStateWithParam("workout", "workoutId");
 *
 * // Abrir modal com parâmetro
 * open("workout-123");
 *
 * // Ou definir parâmetro separadamente
 * setParamValue("workout-123");
 * open();
 * ```
 */
export function useModalStateWithParam(modalName: string, paramName: string) {
	const [modal, setModal] = useQueryState("modal", parseAsString);
	const [paramValue, setParamValue] = useQueryState(paramName, parseAsString);
	// Modal está aberto se modal === modalName OU se há paramValue (para abrir automaticamente quando há parâmetro na URL)
	const isOpen = modal === modalName || !!paramValue;

	// Se há paramValue na URL mas modal não está marcado como aberto, abrir automaticamente
	useEffect(() => {
		if (paramValue && modal !== modalName) {
			setModal(modalName);
		}
	}, [paramValue, modal, modalName, setModal]);

	const open = useCallback(
		(value?: string | null) => {
			setModal(modalName);
			if (value !== undefined) {
				setParamValue(value);
			}
		},
		[modalName, setModal, setParamValue],
	);

	const close = useCallback(() => {
		setModal(null);
		setParamValue(null);
	}, [setModal, setParamValue]);

	const toggle = useCallback(
		(value?: string | null) => {
			if (isOpen) {
				close();
			} else {
				open(value);
			}
		},
		[isOpen, open, close],
	);

	return {
		isOpen,
		open,
		close,
		toggle,
		paramValue,
		setParamValue,
	};
}

/**
 * Hook para sub-modais que podem abrir dentro de outros modais
 * Usa search param "subModal" ao invés de "modal" para não fechar o modal principal
 *
 * @param subModalName - Nome do sub-modal (ex: "weight-tracker", "alternative-selector")
 * @returns Objeto com estado e funções para controlar o sub-modal
 *
 * @example
 * ```tsx
 * const { isOpen, open, close } = useSubModalState("weight-tracker");
 *
 * // Abrir sub-modal (não fecha o modal principal)
 * <Button onClick={open}>Abrir Sub-modal</Button>
 *
 * // Renderizar dentro do modal principal
 * {isOpen && <SubModal onClose={close} />}
 * ```
 */
export function useSubModalState(subModalName: string) {
	const [subModal, setSubModal] = useQueryState("subModal", parseAsString);
	const isOpen = subModal === subModalName;

	const open = useCallback(() => {
		setSubModal(subModalName);
	}, [subModalName, setSubModal]);

	const close = useCallback(() => {
		setSubModal(null);
	}, [setSubModal]);

	const toggle = useCallback(() => {
		if (isOpen) {
			close();
		} else {
			open();
		}
	}, [isOpen, open, close]);

	return {
		isOpen,
		open,
		close,
		toggle,
	};
}
