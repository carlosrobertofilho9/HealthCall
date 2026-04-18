import type { AppointmentSlot } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import { PRINT_COLORS } from './printTheme';

type HomeVisitRouteItem = {
  slot: number;
  time: string;
  name: string;
  document: string;
  acs: string;
  address: string;
  reference: string;
  reason: string;
  isBlocked: boolean;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatDocument = (type: string, value: string) => {
  if (type === 'CPF') {
    return `CPF: ${formatCPF(value)}`;
  }

  return `CNS: ${formatCNS(value)}`;
};

export const printHomeVisitRoute = (slots: AppointmentSlot[], selectedDate: Date) => {
  if (slots.length === 0) {
    alert('Não há visitas configuradas para este dia.');
    return;
  }

  const items: HomeVisitRouteItem[] = slots.map(slot => {
    const appointment = slot.appointment;
    const isBlocked = appointment?.document_value === 'BLOQUEIO';

    if (!appointment) {
      return {
        slot: slot.slotNumber,
        time: slot.time || slot.period,
        name: '',
        document: '',
        acs: '',
        address: '',
        reference: '',
        reason: '',
        isBlocked: false,
      };
    }

    if (isBlocked) {
      return {
        slot: slot.slotNumber,
        time: slot.time || slot.period,
        name: `BLOQUEADO: ${appointment.patient_name}`,
        document: '',
        acs: appointment.acs_name,
        address: '',
        reference: '',
        reason: appointment.patient_name,
        isBlocked: true,
      };
    }

    return {
      slot: slot.slotNumber,
      time: slot.time || slot.period,
      name: appointment.patient_name,
      document: formatDocument(appointment.document_type, appointment.document_value),
      acs: appointment.acs_name,
      address: appointment.home_visit_address || '',
      reference: appointment.home_visit_reference || '',
      reason: appointment.home_visit_reason || '',
      isBlocked: false,
    };
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const agendaDate = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  const generateRows = (routeItems: HomeVisitRouteItem[]) =>
    routeItems
      .map((item, index) => `
        <tr class="${index % 2 === 0 ? 'even' : 'odd'} ${item.isBlocked ? 'blocked' : ''}">
          <td class="col-slot">
            <strong>${item.slot}</strong>
            <span>${escapeHtml(item.time)}</span>
          </td>
          <td class="col-name">${escapeHtml(item.name) || '&nbsp;'}</td>
          <td class="col-doc">${escapeHtml(item.document) || '&nbsp;'}</td>
          <td class="col-acs">${escapeHtml(item.acs) || '&nbsp;'}</td>
          <td class="col-address">${escapeHtml(item.address) || '&nbsp;'}</td>
          <td class="col-ref">${escapeHtml(item.reference) || '&nbsp;'}</td>
          <td class="col-reason">${escapeHtml(item.reason) || '&nbsp;'}</td>
          <td class="col-notes">&nbsp;</td>
        </tr>
      `)
      .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Roteiro de Visitas Domiciliares</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            color: ${PRINT_COLORS.textBase};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .header-banner {
            display: flex;
            align-items: center;
            background-color: ${PRINT_COLORS.primary};
            border-radius: 8px;
            padding: 10px 14px;
          }

          .header-logo {
            width: 44px;
            height: 44px;
            margin-right: 14px;
            background-color: white;
            border-radius: 50%;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .header-text-group {
            flex: 1;
          }

          .header-psf-name {
            font-size: 17px;
            font-weight: 700;
            color: ${PRINT_COLORS.textOnDark};
            letter-spacing: 0.3px;
            margin: 0;
          }

          .header-ubs {
            font-size: 10px;
            color: ${PRINT_COLORS.primarySoft};
            margin-top: 2px;
            letter-spacing: 0.2px;
          }

          .header-badge {
            background-color: ${PRINT_COLORS.surface};
            border-radius: 4px;
            padding: 4px 8px;
            text-align: center;
          }

          .header-badge-text {
            font-size: 11px;
            font-weight: 800;
            color: ${PRINT_COLORS.primary};
            margin: 0;
          }

          .header-badge-sub {
            font-size: 6px;
            color: ${PRINT_COLORS.textMuted};
            margin-top: 1px;
          }

          .accent-line {
            display: flex;
            height: 3px;
            margin: 6px 0 10px;
          }

          .accent-1 { flex: 2; background-color: ${PRINT_COLORS.accent1}; border-radius: 2px; }
          .accent-2 { flex: 1; background-color: ${PRINT_COLORS.accent2}; border-radius: 2px; margin-left: 2px; }
          .accent-3 { flex: 1; background-color: ${PRINT_COLORS.accent3}; border-radius: 2px; margin-left: 2px; }
          .accent-4 { flex: 3; background-color: ${PRINT_COLORS.accent4}; border-radius: 2px; margin-left: 2px; }

          .info-card {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 14px;
            background-color: ${PRINT_COLORS.surfaceAlt};
            border: 1px solid ${PRINT_COLORS.border};
            border-radius: 6px;
            padding: 9px 12px;
            margin-bottom: 10px;
          }

          .info-label {
            font-size: 8px;
            color: ${PRINT_COLORS.textMuted};
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 3px;
            letter-spacing: 0.4px;
          }

          .info-value {
            min-height: 16px;
            border-bottom: 1px solid ${PRINT_COLORS.borderStrong};
            font-size: 11px;
            color: ${PRINT_COLORS.textBase};
            font-weight: 600;
            text-transform: capitalize;
          }

          .main-title-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 10px;
          }

          .main-title-line {
            flex: 1;
            height: 1px;
            background-color: ${PRINT_COLORS.borderStrong};
          }

          .doc-title {
            font-size: 13px;
            font-weight: 800;
            color: ${PRINT_COLORS.primary};
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid ${PRINT_COLORS.border};
            border-radius: 6px;
            overflow: hidden;
          }

          thead tr {
            background-color: ${PRINT_COLORS.primary};
          }

          th {
            color: ${PRINT_COLORS.textOnDark};
            padding: 6px 5px;
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 7px;
            letter-spacing: 0.03em;
            border-right: 1px solid ${PRINT_COLORS.primaryStrong};
          }

          th:last-child {
            border-right: none;
          }

          tbody tr {
            min-height: 34px;
            border-bottom: 1px solid ${PRINT_COLORS.border};
          }

          tbody tr.even { background-color: ${PRINT_COLORS.surface}; }
          tbody tr.odd { background-color: ${PRINT_COLORS.surfaceAlt}; }
          tbody tr.blocked { background-color: ${PRINT_COLORS.blockedBg}; color: ${PRINT_COLORS.blockedText}; }

          td {
            padding: 5px;
            vertical-align: top;
            color: ${PRINT_COLORS.textBase};
            font-size: 8px;
            line-height: 1.25;
            border-right: 1px solid ${PRINT_COLORS.border};
            word-break: break-word;
          }

          td:last-child {
            border-right: none;
          }

          .col-slot { width: 6%; text-align: center; }
          .col-slot span { display: block; font-size: 7px; color: ${PRINT_COLORS.textMuted}; margin-top: 2px; }
          .col-name { width: 16%; font-weight: 700; }
          .col-doc { width: 12%; }
          .col-acs { width: 10%; }
          .col-address { width: 20%; }
          .col-ref { width: 12%; }
          .col-reason { width: 14%; }
          .col-notes { width: 10%; min-height: 34px; }

          .footer {
            margin-top: 8px;
            border-top: 1px solid ${PRINT_COLORS.border};
            padding-top: 6px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            font-size: 8px;
            color: ${PRINT_COLORS.textMuted};
          }

          .footer-brand {
            font-weight: 700;
            color: ${PRINT_COLORS.primary};
          }

          .footer-dot {
            color: ${PRINT_COLORS.borderStrong};
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <div class="header-logo">
            <img src="/1708612751_brasao5180.png" alt="Brasão Prefeitura" />
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

        <div class="accent-line">
          <div class="accent-1"></div>
          <div class="accent-2"></div>
          <div class="accent-3"></div>
          <div class="accent-4"></div>
        </div>

        <div class="info-card">
          <div>
            <div class="info-label">Data da agenda</div>
            <div class="info-value">${escapeHtml(agendaDate)}</div>
          </div>
          <div>
            <div class="info-label">Data de emissão</div>
            <div class="info-value">${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div class="main-title-container">
          <div class="main-title-line"></div>
          <div class="doc-title">Roteiro de Visitas Domiciliares</div>
          <div class="main-title-line"></div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-slot">Ficha</th>
              <th class="col-name">Paciente</th>
              <th class="col-doc">Documento</th>
              <th class="col-acs">ACS</th>
              <th class="col-address">Endereço</th>
              <th class="col-ref">Referência</th>
              <th class="col-reason">Motivo</th>
              <th class="col-notes">Observações</th>
            </tr>
          </thead>
          <tbody>
            ${generateRows(items)}
          </tbody>
        </table>

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
