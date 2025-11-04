import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina múltiplos valores de classe em uma única string, resolvendo conflitos de classes do Tailwind CSS.
 *
 * Esta função utilitária usa `clsx` para lidar com a lógica condicional de classes e `tailwind-merge`
 * para mesclar inteligentemente as classes do Tailwind, evitando redundâncias e conflitos.
 *
 * @param {...ClassValue[]} inputs - Uma sequência de valores de classe. Pode ser uma string, número, booleano, objeto ou array.
 * @returns {string} Uma string contendo as classes mescladas e otimizadas.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
