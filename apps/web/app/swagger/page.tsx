"use client";

import { useEffect, useState } from "react";
import {
  SwaggerDocsScreen,
  type SwaggerSpec,
} from "@/components/screens/public";
import { resolveApiBaseUrl } from "@/lib/api/resolve-api-base-url";

export default function SwaggerPage() {
  const [spec, setSpec] = useState<SwaggerSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const swaggerJsonUrl = `${resolveApiBaseUrl()}/api/swagger`;

  useEffect(() => {
    fetch(swaggerJsonUrl)
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [swaggerJsonUrl]);

  return (
    <SwaggerDocsScreen error={error} spec={spec} swaggerJsonUrl={swaggerJsonUrl} />
  );
}
