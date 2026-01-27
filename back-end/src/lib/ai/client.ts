import { getCachedResponse, cacheResponse } from "./cache";

interface ChatCompletionOptions {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  systemPrompt: string;
  temperature?: number;
  responseFormat?: "json_object" | "text";
}

export async function chatCompletion({
  messages,
  systemPrompt,
  temperature = 0.7,
  responseFormat = "text",
}: ChatCompletionOptions): Promise<string> {
  const cacheKey = JSON.stringify({ messages, systemPrompt, responseFormat });
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log("[AI] Cache hit - resposta reutilizada");
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature,
        ...(responseFormat === "json_object" && {
          response_format: { type: "json_object" },
        }),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Timeout ao chamar API DeepSeek. Tente novamente.");
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`DeepSeek API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Resposta vazia da API DeepSeek");
  }

  cacheResponse(cacheKey, content, 3600);

  return content;
}

export async function chatCompletionWithRetry(
  options: ChatCompletionOptions,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await chatCompletion(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!lastError.message.includes("429") && !lastError.message.includes("rate limit")) {
        throw lastError;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(`[AI] Retry ${attempt}/${maxRetries} após ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Falha ao chamar DeepSeek após múltiplas tentativas");
}
