import { Patient, AppointmentSlot } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';

type SimplifiedPatient = { name: string, document: string, acs: string, period?: string };

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
          acs: s.appointment!.acs_name
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
          acs: s.appointment!.acs_name
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
      patients: patients.map(p => ({ name: p.name, document: '', acs: '' }))
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
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
            color: #000000; /* Pure black for max contrast */
            -webkit-print-color-adjust: exact;
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

          /* Header Styling */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 20px;
            margin-bottom: 5px;
            border-bottom: 3px solid #000000; /* Thicker, darker border */
          }

          .header-left {
            display: flex;
            gap: 15px;
          }

          .brand-bar {
            width: 8px;
            background-color: #000000;
            border-radius: 2px;
          }

          .header-title h1 { 
            font-size: 28px;
            font-weight: 800;
            color: #000000; 
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }

          .header-title .subtitle {
            font-size: 14px;
            color: #4b5563; /* Darker gray */
            margin-top: 4px;
            font-weight: 600;
            letter-spacing: 0.2px;
          }

          .date-box {
            text-align: right;
            background: #fdfdfd;
            padding: 8px 16px;
            border-radius: 6px;
            border: 2px solid #e5e7eb;
          }

          .date-box .label {
            font-size: 11px;
            text-transform: uppercase;
            color: #374151; /* Darker gray */
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }

          .date-box .value {
            font-size: 15px;
            font-weight: 700;
            color: #000000;
          }

          /* Table Styling */
          .table-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            margin-top: 15px;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 14px;
            height: 100%;
          }

          thead tr {
            height: 45px;
            border-bottom: 2px solid #000000; /* Explicit border instead of background color */
          }

          th { 
            background-color: transparent;
            color: #000000; 
            padding: 0 16px; 
            text-align: left; 
            font-weight: 800;
            text-transform: uppercase; 
            font-size: 12px;
            letter-spacing: 0.05em;
          }
          
          tbody {
            display: table-row-group;
          }

          tbody tr {
             /* Calculate height to fill page perfectly */
             /* (Page Height - Paddings - Header - Footer - TableHeader - Gap) */
            height: calc((100% - 50px) / 15);
          }

          td { 
            padding: 0 16px; 
            vertical-align: middle;
            color: #000000;
            border-bottom: 1px solid #d1d5db; /* Darker, crisper border */
            font-weight: 500;
          }

          /* Striping - make it very subtle light gray merely for guidance */
          tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          /* Row dividers for empty rows */
          tr.empty-row td {
            border-bottom: 1px dashed #d1d5db;
          }

          .col-name { width: 48%; color: #000000; font-size: 16px; font-weight: 700; }
          .col-doc { width: 22%; color: #000000; }
          .col-acs { width: 15%; color: #4b5563; font-size: 11px; }
          .col-check { width: 15%; text-align: center; }

          .checkbox { 
            width: 24px; 
            height: 24px; 
            border: 2px solid #6b7280; /* Darker border for visibility */
            border-radius: 4px;
            display: inline-block; 
            vertical-align: middle;
            background: white;
          }

          /* Footer */
          .footer {
            margin-top: auto;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #4b5563; /* Darker gray */
            height: 30px;
          }

          .footer-logo {
            font-weight: 700;
            color: #000000;
            display: flex;
            align-items: center;
            gap: 6px;
          }
           
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        ${pages.map(page => `
          <div class="page-break">
            <div class="header-container">
              <div class="header-left">
                <div class="brand-bar"></div>
                <div class="header-title">
                  <h1>${page.title}</h1>
                  <div class="subtitle">${page.subtitle}</div>
                </div>
              </div>
              <div class="date-box">
                <div class="label">Data de Impressão</div>
                <div class="value">
                  ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}, 
                  ${new Date().toLocaleDateString('pt-BR')} - 
                  ${page.period}
                </div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th class="col-name">Nome do Paciente</th>
                    <th class="col-doc">CNS / CPF</th>
                    <th class="col-acs">ACS</th>
                    <th class="col-check">Checklist</th>
                  </tr>
                </thead>
                <tbody>
                  ${generateRows(page.patients)}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <div class="footer-logo">
                 <span>HealthCall</span> | Sistema de Gestão
              </div>
              <div>Página ${pages.indexOf(page) + 1} de ${pages.length}</div>
            </div>
          </div>
        `).join('')}

        <script>
          window.onload = function() { 
            window.print(); 
          }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

const generateRows = (patients: { name: string, document: string, acs: string }[]) => {
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
          <td class="col-check"><div class="checkbox"></div></td>
        </tr>
      `);
    } else {
      rows.push(`
        <tr class="empty-row">
          <td class="col-name">&nbsp;</td>
          <td class="col-doc"></td>
          <td class="col-acs"></td>
          <td class="col-check"><div class="checkbox" style="border-color: #d1d5db"></div></td>
        </tr>
      `);
    }
  }
  return rows.join('');
};
