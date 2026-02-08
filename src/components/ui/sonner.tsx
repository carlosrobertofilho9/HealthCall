import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Um componente Toaster customizado que renderiza notificações (toasts).
 *
 * Este componente encapsula o componente `Toaster` da biblioteca `sonner`,
 * aplicando estilos customizados para se alinhar com o design system do aplicativo.
 * Ele também se integra com `next-themes` para adaptar a aparência do toast
 * ao tema atual (claro ou escuro), embora o `next-themes` não pareça ser usado
 * no restante da aplicação.
 *
 * @param {ToasterProps} props As propriedades a serem passadas para o componente `Sonner`.
 * @returns {React.ReactElement} O componente Toaster renderizado.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  // @TODO: A dependência `next-themes` parece não ser utilizada no restante do projeto.
  // Avaliar se ela é realmente necessária ou se pode ser removida para simplificar.
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-[#122118] group-[.toaster]:!text-white group-[.toaster]:!border-[var(--primary-color)] group-[.toaster]:!border-2 group-[.toaster]:!shadow-xl group-[.toaster]:!rounded-2xl font-sans",
          description: "group-[.toast]:!text-zinc-400",
          actionButton:
            "group-[.toast]:!bg-[var(--primary-color)] group-[.toast]:!text-[#122118] group-[.toast]:!font-bold group-[.toast]:!rounded-xl",
          cancelButton:
            "group-[.toast]:!bg-zinc-800 group-[.toast]:!text-white group-[.toast]:!rounded-xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
