import { Patient } from '@/types';

export const printPatientList = (patients: Patient[]) => {
  if (patients.length > 15) {
    alert('A lista tem mais de 15 pacientes. O limite de impressão é de 15.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lista de Pacientes</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          
          @page { 
            size: A4 landscape;
            margin: 10mm;
          }

          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }

          body { 
            font-family: 'Inter', sans-serif; 
            color: #1f2937;
            display: flex;
            flex-direction: column;
          }

          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #1f2937;
            flex-shrink: 0; /* Prevent shrinking */
          }

          .header-title h1 { 
            font-size: 24px;
            font-weight: 700;
            color: #111827; 
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }

          .header-title .subtitle {
            font-size: 13px;
            color: #6b7280;
            margin-top: 2px;
            font-weight: 500;
          }

          .date-box {
            text-align: right;
          }

          .date-box .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          .date-box .value {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
          }

          .table-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden; /* Prevent overflow */
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 13px;
            height: 100%; /* Force table to fill container */
          }

          thead tr {
            height: 35px;
            background-color: #f3f4f6;
          }

          th { 
            background-color: #f3f4f6; 
            color: #374151; 
            padding: 4px 12px; 
            text-align: left; 
            font-weight: 700;
            text-transform: uppercase; 
            font-size: 11px;
            letter-spacing: 0.05em;
            border: 1px solid #e5e7eb;
            border-bottom: 2px solid #374151;
          }

          tbody {
            display: table-row-group;
          }

          /* Distribute height evenly */
          tbody tr {
            height: calc((100% - 35px) / 15);
          }

          td { 
            border: 1px solid #e5e7eb; 
            padding: 0 12px; 
            vertical-align: middle;
            color: #374151;
          }

          tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .col-name { width: 40%; font-weight: 600; color: #111827; font-size: 14px; }
          .col-doc { width: 25%; }
          .col-acs { width: 20%; }
          .col-check { width: 15%; text-align: center; }

          .checkbox { 
            width: 20px; 
            height: 20px; 
            border: 2px solid #d1d5db; 
            border-radius: 4px;
            display: inline-block; 
            vertical-align: middle;
          }

          .footer {
            margin-top: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #9ca3af;
            flex-shrink: 0;
          }
          
          /* Visual helper for lines applied to empty manual fields */
          .manual-field {
            border-bottom: 1px dashed #d1d5db;
            height: 24px;
            width: 100%;
            display: block;
          }

        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-title">
            <h1>Lista de Atendimento</h1>
            <div class="subtitle">Controle de Fila e Triagem</div>
          </div>
          <div class="date-box">
            <div class="label">Data de Impressão</div>
            <div class="value">
              ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}, 
              ${new Date().toLocaleDateString('pt-BR')} - 
              ${new Date().getHours() < 12 ? 'Manhã' : 'Tarde'}
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
              ${generateRows(patients)}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div>HealthCall - Sistema de Gestão de Filas</div>
          <div>Página 1 de 1</div>
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

const generateRows = (patients: Patient[]) => {
  // Always generate 15 rows to fill the page exactly
  const totalRows = 15;
  const rows = [];

  for (let i = 0; i < totalRows; i++) {
    const patient = patients[i];
    if (patient) {
      rows.push(`
        <tr>
          <td class="col-name">${patient.name}</td>
          <td class="col-doc"></td>
          <td class="col-acs"></td>
          <td class="col-check"><div class="checkbox"></div></td>
        </tr>
      `);
    } else {
      // Empty rows to maintain structure
      rows.push(`
        <tr class="empty-row">
          <td class="col-name">&nbsp;</td>
          <td class="col-doc"></td>
          <td class="col-acs"></td>
          <td class="col-check"><div class="checkbox" style="border-color: #e5e7eb"></div></td>
        </tr>
      `);
    }
  }
  return rows.join('');
};
