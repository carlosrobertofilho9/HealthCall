/**
 * Redimensiona e comprime uma imagem no lado do cliente usando Canvas.
 * Útil para otimizar uploads e reduzir o consumo de armazenamento/memória.
 * 
 * @param file O arquivo de imagem original
 * @param maxWidth Largura máxima permitida
 * @param maxHeight Altura máxima permitida
 * @param quality Qualidade da compressão (0.0 a 1.0)
 * @returns Um Blob contendo a imagem em formato JPEG otimizada
 */
export async function resizeAndCompressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Apenas processa se for imagem
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcula novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas'));
        }

        // Renderiza a imagem no canvas redimensionado
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como blob comprimido
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao gerar Blob da imagem comprimida'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

/**
 * Carrega uma imagem de uma URL e retorna uma versão redimensionada em DataURL (base64).
 * Ideal para otimizar imagens antes de enviá-las para o motor de impressão do navegador.
 * 
 * @param url URL da imagem original (deve suportar CORS)
 * @param maxDim Dimensão máxima (largura ou altura)
 * @param quality Qualidade JPEG (0.0 a 1.0)
 * @returns Promise vinculada à DataURL da imagem processada
 */
export async function thumbnailizeFromUrl(
  url: string,
  maxDim = 600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Necessário para operar no canvas com URLs externas (Supabase)
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error(`Falha ao carregar imagem para thumbnail: ${url}`));
    img.src = url;
  });
}
