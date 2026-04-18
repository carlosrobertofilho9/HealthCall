import { pdf } from '@react-pdf/renderer';
import { OpenPendenciasPdf } from '../components';
import type { Pendencia } from '../types';

const PRINT_WINDOW_TITLE = 'Relatório de Pendências';
export const printOpenPendenciasPdf = async (pendencias: Pendencia[]) => {
  const blob = await pdf(
    <OpenPendenciasPdf pendencias={pendencias} />,
  ).toBlob();
  const blobUrl = URL.createObjectURL(blob);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error('Não foi possível abrir a janela de impressão.');
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${PRINT_WINDOW_TITLE}</title>
        <style>
          html, body {
            margin: 0;
            height: 100%;
            background: #fff;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
            background: #fff;
          }
        </style>
      </head>
      <body>
        <iframe id="pdf-frame" src="${blobUrl}"></iframe>
        <script>
          const frame = document.getElementById('pdf-frame');
          frame.addEventListener('load', () => {
            setTimeout(() => {
              const frameWindow = frame && frame.contentWindow ? frame.contentWindow : null;

              if (frameWindow) {
                frameWindow.focus();
                frameWindow.print();
              } else {
                window.focus();
                window.print();
              }
            }, 250);
          });

          window.onafterprint = () => {
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
};
