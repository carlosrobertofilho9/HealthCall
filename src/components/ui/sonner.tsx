import React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }