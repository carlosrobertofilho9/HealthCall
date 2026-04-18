import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import React from "react"
import { DS_COLOR_VARIANT, DS_RADIUS_VARIANT } from "./design-system"

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
            `group toast group-[.toaster]:!border-2 group-[.toaster]:!shadow-xl ${DS_COLOR_VARIANT.toasterSurface} ${DS_RADIUS_VARIANT.toasterSurface} font-sans`,
          description: DS_COLOR_VARIANT.toastDescription,
          actionButton:
            `group-[.toast]:!font-bold ${DS_COLOR_VARIANT.toastAction} ${DS_RADIUS_VARIANT.toastSection}`,
          cancelButton:
            `${DS_COLOR_VARIANT.toastCancel} ${DS_RADIUS_VARIANT.toastSection}`,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
