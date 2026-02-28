/**
 * Mutator customizado para Orval.
 * Usa a instância axios do client-factory (interceptors de auth, 401, rotas silenciosas).
 */

import type { AxiosError, AxiosRequestConfig } from "axios";
import { getAxiosInstance } from "@/lib/api/client-factory";

export const customInstance = <T>(
	config: AxiosRequestConfig,
	options?: AxiosRequestConfig,
): Promise<T> => {
	const instance = getAxiosInstance();
	return instance({ ...config, ...options }).then(({ data }) => data);
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
