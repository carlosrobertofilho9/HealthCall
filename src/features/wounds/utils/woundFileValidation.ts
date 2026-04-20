export const WOUND_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateWoundImageFiles(files: File[]): { isValid: boolean; error: string | null } {
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Apenas arquivos de imagem são permitidos.' };
    }

    if (file.size > WOUND_MAX_IMAGE_SIZE_BYTES) {
      return { isValid: false, error: `A imagem "${file.name}" excede o limite de 5MB.` };
    }
  }

  return { isValid: true, error: null };
}
