import { AppointmentSlot } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';

type ReportItem = {
  slot: number;
  period: string;
  name: string;
  document: string;
  acs: string;
};

export const printAppointmentReport = (slots: AppointmentSlot[]) => {
  // Mapeia todos os slots, inclusive os vazios
  const items: ReportItem[] = slots
    .map(s => {
      const app = s.appointment;
      return {
        slot: s.slotNumber,
        period: s.period,
        name: app ? app.patient_name : '-',
        document: app ? `${app.document_type === 'CPF' ? 'CPF' : 'CNS'}: ${app.document_type === 'CPF' ? formatCPF(app.document_value) : formatCNS(app.document_value)}` : '-',
        acs: app ? app.acs_name : '-'
      };
    });

  if (items.length === 0) {
    alert('Não há slots configurados para este dia.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Separação lógica para exibição (opcional, aqui lista sequencial)
  // Como é um relatório completo, vamos usar uma tabela única corrida
  
  // Helper para ícone do período
  const getPeriodIcon = (period: string) => {
    if (period === 'Manhã') {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b; vertical-align: middle;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #3b82f6; vertical-align: middle;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  };

  const generateRows = (items: ReportItem[]) => {
    return items.map((item, index) => `
      <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
        <td class="col-slot">${item.slot}</td>
        <td class="col-period" title="${item.period}">${getPeriodIcon(item.period)}</td>
        <td class="col-name">${item.name}</td>
        <td class="col-doc">${item.document}</td>
        <td class="col-acs">${item.acs}</td>
      </tr>
    `).join('');
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório de Marcações</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { 
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }

          body { 
            font-family: 'Inter', sans-serif; 
            color: #1f2937;
            -webkit-print-color-adjust: exact;
          }

          /* Header Layout */
          .header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #1a3a26;
            padding-bottom: 15px;
            margin-bottom: 20px;
            gap: 20px;
          }

          .logo-container {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-container img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .header-content {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .title-section h1 {
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0;
            color: #1a3a26;
            line-height: 1.2;
          }

          .title-section .subtitle {
            font-size: 13px;
            color: #4b5563;
            font-weight: 500;
            margin-top: 4px;
          }

          .meta-box {
            text-align: right;
            background-color: #f3f4f6;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }

          .meta-box .label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #6b7280;
          }

          .meta-box .value {
            font-size: 12px;
            font-weight: 600;
            color: #111827;
          }

          /* Table Design */
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 10px;
          }

          thead th {
            background-color: #1a3a26;
            color: white;
            padding: 8px;
            text-align: left;
            text-transform: uppercase;
            font-weight: 600;
            font-size: 9px;
            letter-spacing: 0.5px;
            border: none;
          }

          thead th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
          thead th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }

          tbody td {
            padding: 6px 8px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: middle;
            color: #374151;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          tr.even { background-color: #fcfdfd; }
          tr:nth-child(even) td { background-color: #f9fafb; }

          /* Columns */
          .col-slot { width: 6%; text-align: center; font-weight: 700; }
          .col-period { width: 6%; text-align: center; } 
          .col-name { width: 48%; font-weight: 700; font-size: 12px; }
          .col-doc { width: 22%; }
          .col-acs { width: 18%; font-size: 9px; }
          
          /* Body Colors */
          tbody td.col-slot { color: #000000; }
          tbody td.col-name { color: #374151; }
          tbody td.col-doc { color: #374151; }
          tbody td.col-acs { color: #4b5563; }

          .footer {
            margin-top: auto;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            font-size: 9px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          /* Ensure footer stays at bottom if content is short, but doesn't overlap if long (flex column on body/page wrapper preferable but simple margin-top auto works for single page often) */
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img src="/1708612751_brasao5180.png" alt="Brasão Prefeitura" />
          </div>
          <div class="header-content">
            <div class="title-section">
              <h1>Relatório Diário de Marcações</h1>
              <div class="subtitle">Secretaria Municipal de Saúde</div>
            </div>
            <div class="meta-box">
              <div class="label">Data de Emissão</div>
              <div class="value">
                ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-slot">Nº</th>
              <th class="col-period" style="text-align: center">T</th>
              <th class="col-name">Paciente</th>
              <th class="col-doc">Documento</th>
              <th class="col-acs">ACS Responsável</th>
            </tr>
          </thead>
          <tbody>
            ${generateRows(items)}
          </tbody>
        </table>

        <div class="footer" style="margin-top: 20px;">
          <div>HealthCall - Gestão Inteligente</div>
          <div>Página 1</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
