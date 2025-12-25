"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { StepCard } from "@/components/molecules/cards/step-card";
import { FormInput } from "@/components/molecules/forms/form-input";
import type { StepProps } from "./types";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function Step2({ formData, setFormData }: StepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const fetchCepData = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return;
    }

    setIsLoadingCep(true);
    setCepError(null);

    try {
      const response = await axios.get<ViaCepResponse>(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (response.data.erro) {
        setCepError("CEP não encontrado");
        setIsLoadingCep(false);
        return;
      }

      setFormData({
        ...formData,
        address: response.data.logradouro || "",
        city: response.data.localidade || "",
        state: response.data.uf || "",
        zipCode: formatCep(cleanCep),
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (value: string | number) => {
    const stringValue = String(value);
    const formatted = formatCep(stringValue);
    setFormData({ ...formData, zipCode: formatted });
    setCepError(null);

    const cleanCep = formatted.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      fetchCepData(cleanCep);
    }
  };

  return (
    <StepCard
      title="Localização"
      description="Onde sua academia está localizada?"
    >
      <div className="space-y-5">
        <div className="relative">
          <FormInput
            label="CEP"
            type="text"
            placeholder="00000-000"
            value={formData.zipCode}
            onChange={handleCepChange}
            required
            delay={0.3}
            maxLength={9}
          />
          {isLoadingCep && (
            <div className="absolute right-4 top-[42px]">
              <Loader2 className="h-5 w-5 animate-spin text-duo-orange" />
            </div>
          )}
          {cepError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {cepError}
            </motion.p>
          )}
        </div>

        <FormInput
          label="Endereço"
          type="text"
          placeholder="Rua, avenida, logradouro"
          value={formData.address}
          onChange={(value) =>
            setFormData({ ...formData, address: value as string })
          }
          required
          delay={0.4}
        />
        <FormInput
          label="Número / Complemento"
          type="text"
          placeholder="Ex: 123, Sala 45, Bloco A"
          value={formData.addressNumber}
          onChange={(value) =>
            setFormData({ ...formData, addressNumber: value as string })
          }
          required={false}
          delay={0.45}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Cidade"
            type="text"
            placeholder="São Paulo"
            value={formData.city}
            onChange={(value) =>
              setFormData({ ...formData, city: value as string })
            }
            required
            delay={0.5}
          />
          <FormInput
            label="Estado"
            type="text"
            placeholder="SP"
            value={formData.state}
            onChange={(value) =>
              setFormData({ ...formData, state: value as string })
            }
            required
            delay={0.6}
            maxLength={2}
          />
        </div>
      </div>
    </StepCard>
  );
}
