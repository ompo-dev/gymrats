/**
 * Exemplo de uso do componente DuoButton
 * 
 * Este componente oferece diferentes variantes, tamanhos e animações
 * seguindo o design system do Duolingo/GymRats
 */

import { DuoButton } from "./duo-button"
import { Check, X, ArrowRight, Heart } from "lucide-react"

export function DuoButtonExamples() {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <div>
        <h2 className="text-2xl font-bold mb-4">Variantes</h2>
        <div className="flex flex-wrap gap-4">
          <DuoButton variant="primary">Primary</DuoButton>
          <DuoButton variant="secondary">Secondary</DuoButton>
          <DuoButton variant="outline">Outline</DuoButton>
          <DuoButton variant="blue">Blue</DuoButton>
          <DuoButton variant="orange">Orange</DuoButton>
          <DuoButton variant="purple">Purple</DuoButton>
          <DuoButton variant="red">Red</DuoButton>
          <DuoButton variant="ghost">Ghost</DuoButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Tamanhos</h2>
        <div className="flex flex-wrap items-center gap-4">
          <DuoButton variant="primary" size="sm">Small</DuoButton>
          <DuoButton variant="primary" size="default">Default</DuoButton>
          <DuoButton variant="primary" size="lg">Large</DuoButton>
          <DuoButton variant="primary" size="xl">Extra Large</DuoButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Animações</h2>
        <div className="flex flex-wrap gap-4">
          <DuoButton variant="primary" animation="scale">Scale (padrão)</DuoButton>
          <DuoButton variant="primary" animation="bounce">Bounce</DuoButton>
          <DuoButton variant="primary" animation="pulse">Pulse</DuoButton>
          <DuoButton variant="primary" animation="none">Sem animação</DuoButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Com ícones</h2>
        <div className="flex flex-wrap gap-4">
          <DuoButton variant="primary">
            <Check className="w-5 h-5" />
            Confirmar
          </DuoButton>
          <DuoButton variant="red">
            <X className="w-5 h-5" />
            Cancelar
          </DuoButton>
          <DuoButton variant="blue">
            Continuar
            <ArrowRight className="w-5 h-5" />
          </DuoButton>
          <DuoButton variant="orange">
            <Heart className="w-5 h-5" />
            Favoritar
          </DuoButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Estados</h2>
        <div className="flex flex-wrap gap-4">
          <DuoButton variant="primary" loading>Carregando</DuoButton>
          <DuoButton variant="primary" disabled>Desabilitado</DuoButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Largura total</h2>
        <div className="space-y-4 max-w-md">
          <DuoButton variant="primary" size="lg" className="w-full">
            Botão de largura total
          </DuoButton>
          <DuoButton variant="outline" size="lg" className="w-full">
            Botão outline largura total
          </DuoButton>
        </div>
      </div>
    </div>
  )
}

