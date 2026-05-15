import { PDFDocument } from 'pdf-lib';

export async function mergePdfUrls(urls: string[]): Promise<Uint8Array> {
  if (urls.length === 0) {
    throw new Error('Nenhum PDF para mesclar.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Falha ao baixar PDF: ${url}`);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      console.warn(`Erro ao processar PDF ${url}:`, err);
    }
  }

  if (mergedPdf.getPageCount() === 0) {
    throw new Error('Não foi possível processar nenhum PDF.');
  }

  return mergedPdf.save();
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
