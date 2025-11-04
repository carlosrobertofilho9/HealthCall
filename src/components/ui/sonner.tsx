import React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a2e23] group-[.toaster]:text-white group-[.toaster]:border-[#38e07b]/20 group-[.toaster]:border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-gray-300",
          actionButton:
            "group-[.toast]:bg-[#38e07b] group-[.toast]:text-[#122118] group-[.toast]:font-semibold group-[.toast]:hover:bg-[#2dae60] group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-[#264532] group-[.toast]:text-gray-300 group-[.toast]:hover:bg-[#2d5539] group-[.toast]:transition-colors",
          success: "group-[.toast]:border-[#38e07b]/40",
          error: "group-[.toast]:border-red-500/40",
          warning: "group-[.toast]:border-yellow-500/40",
          info: "group-[.toast]:border-blue-500/40",
        },
        duration: 4000,
      }}
      {...props}
    />
  )
}

export { Toaster }
