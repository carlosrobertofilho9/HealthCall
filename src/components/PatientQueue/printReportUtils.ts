import { AppointmentSlot } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import { getAppointmentStatus } from '@/features/appointments/services/appointmentService';

type ReportItem = {
  slot: number;
  period: string;
  name: string;
  document: string;
  acs: string;
  status: string;
};

export type ReportPeriodFilter = 'Manhã' | 'Tarde';

export const printAppointmentReport = (slots: AppointmentSlot[], periodFilter?: ReportPeriodFilter) => {
  const filteredSlots = periodFilter
    ? slots.filter(slot => slot.period === periodFilter)
    : slots;

  // Mapeia todos os slots, inclusive os vazios
  const items: ReportItem[] = filteredSlots
    .map(s => {
      const app = s.appointment;
      return {
        slot: s.slotNumber,
        period: s.period,
        name: app ? app.patient_name : '-',
        document: app ? `${app.document_type === 'CPF' ? 'CPF' : 'CNS'}: ${app.document_type === 'CPF' ? formatCPF(app.document_value) : formatCNS(app.document_value)}` : '-',
        acs: app ? app.acs_name : '-',
        status: app ? getAppointmentStatus(app) : '-',
      };
    });

  if (items.length === 0) {
    alert(
      periodFilter
        ? `Não há slots configurados para o turno da ${periodFilter.toLowerCase()}.`
        : 'Não há slots configurados para este dia.'
    );
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
        <td class="col-status">${item.status}</td>
      </tr>
    `).join('');
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${periodFilter ? `Relatório de Marcações - ${periodFilter}` : 'Relatório de Marcações'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page { 
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          body { 
            font-family: 'Inter', sans-serif; 
            color: #334155;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Header Banner */
          .header-banner {
            display: flex;
            flex-direction: row;
            align-items: center;
            background-color: #0f766e;
            border-radius: 8px;
            padding: 12px 16px;
          }

          .header-logo {
            margin-right: 16px;
            width: 36px;
            height: 36px;
          }

          .header-text-group {
            flex: 1;
          }

          .header-psf-name {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
            margin: 0;
          }

          .header-ubs {
            font-size: 11px;
            color: #99f6e4;
            margin-top: 2px;
            letter-spacing: 0.3px;
          }

          .header-badge {
            background-color: #ffffff;
            border-radius: 4px;
            padding: 4px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .header-badge-text {
            font-size: 11px;
            font-weight: 800;
            color: #0f766e;
            margin: 0;
          }

          .header-badge-sub {
            font-size: 6px;
            color: #64748b;
            margin-top: 1px;
          }

          .accent-line {
            display: flex;
            flex-direction: row;
            height: 3px;
            margin-bottom: 12px;
            margin-top: 6px;
          }

          .accent-1 { flex: 2; background-color: #0d9488; border-radius: 2px; }
          .accent-2 { flex: 1; background-color: #14b8a6; border-radius: 2px; margin-left: 2px; }
          .accent-3 { flex: 1; background-color: #5eead4; border-radius: 2px; margin-left: 2px; }
          .accent-4 { flex: 3; background-color: #99f6e4; border-radius: 2px; margin-left: 2px; }

          /* Info Box */
          .info-card {
            display: flex;
            flex-direction: row;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 16px;
            margin-bottom: 16px;
            gap: 32px;
          }

          .info-group {
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .info-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }

          .info-value-line {
            border-bottom: 1px solid #cbd5e1;
            height: 18px;
            display: flex;
            align-items: center;
          }

          .info-value {
            font-size: 13px;
            color: #334155;
            font-weight: 600;
          }

          /* Main Title */
          .main-title-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            gap: 12px;
          }

          .main-title-line {
            flex: 1;
            height: 1px;
            background-color: #cbd5e1;
          }

          .doc-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          /* Table Container */
          .table-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            background-color: #ffffff;
            margin-bottom: 20px;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
          }

          thead tr {
            background-color: #0f766e;
          }

          th { 
            color: #ffffff; 
            padding: 8px 12px; 
            text-align: left; 
            font-weight: 700;
            text-transform: uppercase; 
            font-size: 10px;
            letter-spacing: 0.05em;
            border-right: 1px solid #0d9488;
          }
          th:last-child {
            border-right: none;
          }
          
          tbody {
            display: table-row-group;
          }

          tbody tr {
            border-bottom: 1px solid #e2e8f0;
          }
          tbody tr:last-child {
            border-bottom: none;
          }

          /* Striping */
          tbody tr.even { background-color: #ffffff; }
          tbody tr.odd { background-color: #f8fafc; }

          td { 
            padding: 8px 12px; 
            vertical-align: middle;
            color: #334155;
            font-size: 11px;
            font-weight: 500;
            border-right: 1px solid #e2e8f0;
          }
          td:last-child {
            border-right: none;
          }

          .col-slot { width: 6%; text-align: center; font-weight: 700; }
          .col-period { width: 6%; text-align: center; } 
          .col-name { width: 36%; font-weight: 600; font-size: 12px; }
          .col-doc { width: 26%; }
          .col-acs { width: 14%; font-size: 10px; }
          .col-status { width: 12%; font-size: 10px; }

          /* Footer */
          .footer {
            margin-top: auto;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 8px;
            font-size: 9px;
            color: #64748b;
            height: 20px;
          }

          .footer-brand {
            font-weight: 700;
            color: #0f766e;
          }

          .footer-dot {
            color: #cbd5e1;
          }
        </style>
      </head>
      <body>
        <!-- Header Banner -->
        <div class="header-banner">
          <div class="header-logo" style="width: 48px; height: 48px; background-color: white; border-radius: 50%; padding: 4px; display: flex; align-items: center; justify-content: center;">
            <img src="/1708612751_brasao5180.png" alt="Brasão Prefeitura" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div class="header-text-group">
            <h1 class="header-psf-name">Unidade de Saúde</h1>
            <div class="header-ubs">Secretaria Municipal de Saúde • Atenção Primária</div>
          </div>
          <div class="header-badge">
            <div class="header-badge-text">SUS</div>
            <div class="header-badge-sub">Sistema Único de Saúde</div>
          </div>
        </div>

        <!-- Accent Gradient Line -->
        <div class="accent-line">
          <div class="accent-1"></div>
          <div class="accent-2"></div>
          <div class="accent-3"></div>
          <div class="accent-4"></div>
        </div>

        <!-- Info Bar -->
        <div class="info-card">
          <div class="info-group">
            <div class="info-label">Data de Emissão</div>
            <div class="info-value-line">
              <div class="info-value" style="text-transform: capitalize;">
                ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}, ${new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        <!-- Document Title -->
        <div class="main-title-container">
          <div class="main-title-line"></div>
          <div class="doc-title">${periodFilter ? `Relatório de Marcações - ${periodFilter}` : 'Relatório Diário de Marcações'}</div>
          <div class="main-title-line"></div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-slot">Nº</th>
                <th class="col-period" style="text-align: center">T</th>
                <th class="col-name">Paciente</th>
                <th class="col-doc">Documento</th>
                <th class="col-acs">ACS</th>
                <th class="col-status">Status</th>
              </tr>
            </thead>
            <tbody>
              ${generateRows(items)}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div>Impresso em ${new Date().toLocaleDateString('pt-BR')}</div>
          <div class="footer-dot">•</div>
          <div class="footer-brand">HealthCall</div>
          <div class="footer-dot">•</div>
          <div>Documento gerado eletronicamente</div>
        </div>

        <script>
          window.onload = function() { 
            setTimeout(() => {
              window.print(); 
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
