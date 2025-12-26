/**
 * Middleware Offline para apiClient
 * 
 * Intercepta requisições e usa salvadorOff automaticamente
 */

import { salvadorOff } from '@/lib/offline/salvador-off';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Wrapper para apiClient que usa salvadorOff automaticamente
 */
export async function apiClientOffline<T = any>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const { url, method = 'GET', data, headers } = config;

  if (!url) {
    throw new Error('URL é obrigatória');
  }

  // Obtém token de autenticação
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Usa salvadorOff
  const result = await salvadorOff({
    url,
    method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: data,
    headers: requestHeaders,
  });

  if (!result.success) {
    throw result.error || new Error('Erro ao executar requisição');
  }

  // Se foi enfileirado, retorna resposta otimista
  if (result.queued) {
    return {
      data: { queued: true, queueId: result.queueId } as T,
      status: 202,
      statusText: 'Accepted',
      headers: {},
      config: config as any,
    } as AxiosResponse<T>;
  }

  // Se foi executado com sucesso, retorna dados
  return {
    data: result.data as T,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as any,
  } as AxiosResponse<T>;
}

