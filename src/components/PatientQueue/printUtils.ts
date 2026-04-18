import { Patient, AppointmentSlot } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import { getAppointmentStatus } from '@/features/appointments/services/appointmentService';

type SimplifiedPatient = { name: string, document: string, acs: string, status?: string, period?: string };

export const printPatientList = (data: Patient[] | AppointmentSlot[]) => {
  const isAppointment = data.length > 0 && 'slotNumber' in data[0];
  
  let pages: { title: string, subtitle: string, period: string, patients: SimplifiedPatient[] }[] = [];

  if (isAppointment) {
    const slots = data as AppointmentSlot[];
    const morningSlots = slots.filter(s => s.period === 'Manhã');
    const afternoonSlots = slots.filter(s => s.period === 'Tarde');

    if (morningSlots.length > 0) {
      pages.push({
        title: 'Ficha de Agendamento',
        subtitle: 'Marcações de Consultas',
        period: 'Manhã',
        patients: morningSlots.filter(s => s.appointment).map(s => ({
          name: s.appointment!.patient_name,
          document: s.appointment!.document_type === 'CPF' ? formatCPF(s.appointment!.document_value) : formatCNS(s.appointment!.document_value),
          acs: s.appointment!.acs_name,
          status: getAppointmentStatus(s.appointment!)
        }))
      });
    }

    if (afternoonSlots.length > 0) {
      pages.push({
        title: 'Ficha de Agendamento',
        subtitle: 'Marcações de Consultas',
        period: 'Tarde',
        patients: afternoonSlots.filter(s => s.appointment).map(s => ({
          name: s.appointment!.patient_name,
          document: s.appointment!.document_type === 'CPF' ? formatCPF(s.appointment!.document_value) : formatCNS(s.appointment!.document_value),
          acs: s.appointment!.acs_name,
          status: getAppointmentStatus(s.appointment!)
        }))
      });
    }
  } else {
    const patients = (data as Patient[]);
    if (patients.length > 15) {
        alert('A lista da fila tem mais de 15 pacientes. O limite de impressão é de 15 por página.');
        return;
    }
    pages.push({
      title: 'Lista de Atendimento',
      subtitle: 'Controle de Fila e Triagem',
      period: new Date().getHours() < 12 ? 'Manhã' : 'Tarde',
      patients: patients.map(p => ({ name: p.name, document: '', acs: '', status: p.status }))
    });
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lista de Pacientes</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page { 
            size: A4 landscape;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }

          body { 
            font-family: 'Inter', sans-serif; 
            color: #334155;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .page-break {
            width: 297mm;
            height: 210mm;
            page-break-after: always;
            position: relative;
            padding: 12mm 15mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }

          .page-break:last-child {
            page-break-after: auto;
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
            margin-bottom: 12px;
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
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            height: 100%;
          }

          thead tr {
            height: 32px;
            background-color: #f5f3ff; /* Matching WoundCareDocument Header background somewhat, though that's #f5f3ff which is purple tint. Let's use light teal #f0fdfa or #0f766e for contrast */
            /* Using solid header */
            background-color: #0f766e;
          }

          th { 
            color: #ffffff; 
            padding: 0 12px; 
            text-align: left; 
            font-weight: 700;
            text-transform: uppercase; 
            font-size: 10px;
            letter-spacing: 0.05em;
            border-right: 1px solid #0d9488;
          }
          th:last-child {
            border-right: none;
            text-align: center;
          }
          
          tbody {
            display: table-row-group;
          }

          tbody tr {
            height: calc((100% - 32px) / 15);
            border-bottom: 1px solid #e2e8f0;
          }
          tbody tr:last-child {
            border-bottom: none;
          }

          /* Striping */
          tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }

          tr.empty-row td {
            border-bottom: 1px dashed #e2e8f0;
          }

          td { 
            padding: 0 12px; 
            vertical-align: middle;
            color: #334155;
            font-size: 12px;
            font-weight: 500;
            border-right: 1px solid #e2e8f0;
          }
          td:last-child {
            border-right: none;
            text-align: center;
          }

          .col-name { width: 38%; font-weight: 600; }
          .col-doc { width: 23%; }
          .col-acs { width: 14%; font-size: 11px; }
          .col-status { width: 12%; font-size: 10px; }
          .col-check { width: 13%; text-align: center; }

          .checkbox { 
            width: 14px; 
            height: 14px; 
            border: 1px solid #94a3b8;
            border-radius: 3px;
            display: inline-block; 
            vertical-align: middle;
            background: white;
          }

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
          
          .page-number {
            position: absolute;
            bottom: 12mm;
            right: 15mm;
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        ${pages.map((page, index) => `
          <div class="page-break">
            <!-- Header Banner -->
            <div class="header-banner">
              <div class="header-logo" style="width: 48px; height: 48px; background-color: white; border-radius: 50%; padding: 4px; display: flex; align-items: center; justify-content: center;">
                <img src="/1708612751_brasao5180.png" alt="Brasão Prefeitura" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              </div>
              <div class="header-text-group">
                <h1 class="header-psf-name">Unidade de Saúde</h1>
                <div class="header-ubs">Unidade Básica de Saúde • Atenção Primária</div>
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
                <div class="info-label">Data de Impressão</div>
                <div class="info-value-line">
                  <div class="info-value" style="text-transform: capitalize;">
                    ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}, ${new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <div class="info-group" style="flex: 0.5">
                <div class="info-label">Período</div>
                <div class="info-value-line">
                  <div class="info-value">${page.period}</div>
                </div>
              </div>
              <div class="info-group" style="flex: 0.5">
                <div class="info-label">Lista</div>
                <div class="info-value-line">
                  <div class="info-value">${page.subtitle}</div>
                </div>
              </div>
            </div>

            <!-- Document Title -->
            <div class="main-title-container">
              <div class="main-title-line"></div>
              <div class="doc-title">${page.title}</div>
              <div class="main-title-line"></div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th class="col-name">Nome do Paciente</th>
                    <th class="col-doc">CNS / CPF</th>
                    <th class="col-acs">ACS</th>
                    <th class="col-status">Status</th>
                    <th class="col-check">Presença</th>
                  </tr>
                </thead>
                <tbody>
                  ${generateRows(page.patients)}
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
            <div class="page-number">Página ${index + 1} de ${pages.length}</div>
          </div>
        `).join('')}

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

const generateRows = (patients: SimplifiedPatient[]) => {
  const totalRows = 15;
  const rows = [];

  for (let i = 0; i < totalRows; i++) {
    const patient = patients[i];
    if (patient) {
      rows.push(`
        <tr>
          <td class="col-name">${patient.name}</td>
          <td class="col-doc">${patient.document || ''}</td>
          <td class="col-acs">${patient.acs || ''}</td>
          <td class="col-status">${patient.status || ''}</td>
          <td class="col-check"><div class="checkbox"></div></td>
        </tr>
      `);
    } else {
      rows.push(`
        <tr class="empty-row">
          <td class="col-name">&nbsp;</td>
          <td class="col-doc"></td>
          <td class="col-acs"></td>
          <td class="col-status"></td>
          <td class="col-check"><div class="checkbox" style="border-color: #cbd5e1"></div></td>
        </tr>
      `);
    }
  }
  return rows.join('');
};
