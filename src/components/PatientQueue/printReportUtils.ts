import type { AppointmentSlot } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import { getAppointmentStatus } from '@/features/appointments/services/appointmentService';
import { PRINT_COLORS } from './printTheme';

export type ReportPeriodFilter = 'Manhã' | 'Tarde';

export type PrintAppointmentReportOptions = {
  periodFilter?: ReportPeriodFilter;
  selectedDate?: Date;
};

type ReportKind = 'appointment' | 'empty' | 'blocked' | 'prenatal';
type ReportDensity = 'comfortable' | 'compact' | 'dense';

type ReportItem = {
  slot: number;
  period: string;
  time: string;
  title: string;
  document: string;
  acs: string;
  status: string;
  kind: ReportKind;
  isReserve: boolean;
};

type ReportStats = {
  total: number;
  appointments: number;
  empty: number;
  blocked: number;
  prenatal: number;
};

type ReportArgument = ReportPeriodFilter | PrintAppointmentReportOptions;

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const parseISODateAsLocal = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const normalizeOptions = (argument?: ReportArgument): PrintAppointmentReportOptions => {
  if (typeof argument === 'string') {
    return { periodFilter: argument };
  }

  return argument ?? {};
};

const getReportDate = (slots: AppointmentSlot[], selectedDate?: Date) => {
  if (selectedDate) {
    return selectedDate;
  }

  const scheduledDate = slots.find(slot => slot.appointment?.scheduled_date)?.appointment?.scheduled_date;
  return scheduledDate ? parseISODateAsLocal(scheduledDate) : new Date();
};

const formatLongDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

const formatShortDateTime = (date: Date) =>
  date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatDocument = (slot: AppointmentSlot) => {
  const appointment = slot.appointment;

  if (!appointment) {
    return '-';
  }

  if (appointment.document_type === 'CPF') {
    return `CPF: ${formatCPF(appointment.document_value)}`;
  }

  return `CNS: ${formatCNS(appointment.document_value)}`;
};

const getReportDensity = (itemsCount: number): ReportDensity => {
  if (itemsCount <= 15) {
    return 'comfortable';
  }

  if (itemsCount <= 24) {
    return 'compact';
  }

  return 'dense';
};

const normalizeReportItem = (slot: AppointmentSlot): ReportItem => {
  const appointment = slot.appointment;
  const time = slot.time || slot.period;

  if (slot.isAutoBlocked) {
    return {
      slot: slot.slotNumber,
      period: slot.period,
      time,
      title: appointment?.patient_name || 'Pré-Natal',
      document: 'Turno reservado',
      acs: appointment?.acs_name || 'Administração',
      status: 'Pré-Natal',
      kind: 'prenatal',
      isReserve: Boolean(slot.isReserve),
    };
  }

  if (appointment?.document_value === 'BLOQUEIO') {
    return {
      slot: slot.slotNumber,
      period: slot.period,
      time,
      title: appointment.patient_name || 'Bloqueio da agenda',
      document: 'Turno reservado',
      acs: appointment.acs_name || 'Administração',
      status: 'Bloqueio',
      kind: 'blocked',
      isReserve: Boolean(slot.isReserve),
    };
  }

  if (appointment) {
    return {
      slot: slot.slotNumber,
      period: slot.period,
      time,
      title: appointment.patient_name,
      document: formatDocument(slot),
      acs: appointment.acs_name,
      status: getAppointmentStatus(appointment),
      kind: 'appointment',
      isReserve: Boolean(slot.isReserve),
    };
  }

  return {
    slot: slot.slotNumber,
    period: slot.period,
    time,
    title: 'Vaga livre',
    document: '-',
    acs: '-',
    status: 'Livre',
    kind: 'empty',
    isReserve: Boolean(slot.isReserve),
  };
};

const getReportStats = (items: ReportItem[]): ReportStats => ({
  total: items.length,
  appointments: items.filter(item => item.kind === 'appointment').length,
  empty: items.filter(item => item.kind === 'empty').length,
  blocked: items.filter(item => item.kind === 'blocked').length,
  prenatal: items.filter(item => item.kind === 'prenatal').length,
});

const renderSunIcon = () => `
  <svg class="period-icon period-icon-morning" data-report-icon="sun" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.25"></circle>
    <path d="M12 2.5v2.25M12 19.25v2.25M4.57 4.57l1.6 1.6M17.83 17.83l1.6 1.6M2.5 12h2.25M19.25 12h2.25M4.57 19.43l1.6-1.6M17.83 6.17l1.6-1.6"></path>
  </svg>
`;

const renderMoonIcon = () => `
  <svg class="period-icon period-icon-afternoon" data-report-icon="moon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.4 14.4A7.8 7.8 0 0 1 9.6 3.6 8.6 8.6 0 1 0 20.4 14.4Z"></path>
  </svg>
`;

const renderUserIcon = () => `
  <svg class="row-icon row-icon-appointment" data-report-icon="patient" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 21a8 8 0 0 0-16 0"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
`;

const renderEmptyIcon = () => `
  <svg class="row-icon row-icon-empty" data-report-icon="empty" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8"></circle>
    <path d="M8.5 12h7"></path>
  </svg>
`;

const renderBlockIcon = () => `
  <svg class="row-icon row-icon-blocked" data-report-icon="block" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5.5" y="10" width="13" height="10" rx="2"></rect>
    <path d="M8.25 10V7.6a3.75 3.75 0 0 1 7.5 0V10"></path>
    <path d="M12 14.25v2"></path>
  </svg>
`;

const renderPregnancyIcon = () => `
  <svg class="row-icon row-icon-prenatal" data-report-icon="pregnancy" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="4.6" r="2.15"></circle>
    <path d="M9.25 7.5c-1.35 1.6-1.95 3.65-1.7 6.1.18 1.78.84 3.25 1.95 4.4"></path>
    <path d="M11.4 8.1c2.9 1.25 4.9 4.1 4.9 7.05 0 2.45-1.4 4.35-3.85 4.35H9.55"></path>
    <path d="M12.5 12.2c1.4.25 2.55 1.35 2.85 2.8"></path>
    <path d="M7.75 20.5h8.5"></path>
  </svg>
`;

const getPeriodIcon = (period: string) => period === 'Manhã' ? renderSunIcon() : renderMoonIcon();

const getKindIcon = (kind: ReportKind) => {
  if (kind === 'prenatal') return renderPregnancyIcon();
  if (kind === 'blocked') return renderBlockIcon();
  if (kind === 'empty') return renderEmptyIcon();
  return renderUserIcon();
};

const getStatusClass = (item: ReportItem) => {
  if (item.kind === 'prenatal') return 'status-prenatal';
  if (item.kind === 'blocked') return 'status-blocked';
  if (item.kind === 'empty') return 'status-empty';

  switch (item.status) {
    case 'Compareceu':
      return 'status-success';
    case 'Faltou':
      return 'status-warning';
    case 'Remarcado':
      return 'status-purple';
    default:
      return 'status-scheduled';
  }
};

const renderMetricCard = (label: string, value: number, tone: string) => `
  <div class="metric-card metric-${tone}">
    <span class="metric-value">${value}</span>
    <span class="metric-label">${escapeHtml(label)}</span>
  </div>
`;

const renderLegendItem = (kind: ReportKind, label: string) => `
  <span class="legend-item legend-${kind}">
    ${getKindIcon(kind)}
    <span>${escapeHtml(label)}</span>
  </span>
`;

const renderRows = (items: ReportItem[]) =>
  items
    .map((item, index) => {
      const rowTone = item.kind === 'appointment' ? (index % 2 === 0 ? 'row-even' : 'row-odd') : `row-${item.kind}`;
      const slotMeta = item.isReserve ? `${item.period} · Reserva` : item.period;

      return `
        <tr class="schedule-row ${rowTone}">
          <td class="col-slot">
            <div class="slot-stack">
              <strong>${item.slot}</strong>
              <span>${getPeriodIcon(item.period)}${escapeHtml(item.time)}</span>
            </div>
          </td>
          <td class="col-main">
            <div class="main-line">
              ${getKindIcon(item.kind)}
              <span>${escapeHtml(item.title)}</span>
            </div>
            <div class="main-meta">${escapeHtml(slotMeta)}</div>
          </td>
          <td class="col-doc"><span>${escapeHtml(item.document)}</span></td>
          <td class="col-acs"><span>${escapeHtml(item.acs)}</span></td>
          <td class="col-status">
            <span class="status-badge ${getStatusClass(item)}">${escapeHtml(item.status)}</span>
          </td>
        </tr>
      `;
    })
    .join('');

export const printAppointmentReport = (
  slots: AppointmentSlot[],
  argument?: ReportArgument
) => {
  const { periodFilter, selectedDate } = normalizeOptions(argument);
  const filteredSlots = periodFilter
    ? slots.filter(slot => slot.period === periodFilter)
    : slots;

  const items = filteredSlots.map(normalizeReportItem);

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

  const stats = getReportStats(items);
  const density = getReportDensity(items.length);
  const reportDate = getReportDate(filteredSlots, selectedDate);
  const generatedAt = new Date();
  const periodLabel = periodFilter ?? (new Set(items.map(item => item.period)).size === 1 ? items[0].period : 'Dia inteiro');
  const documentTitle = periodFilter ? `Relatório de Marcações - ${periodFilter}` : 'Relatório Diário de Marcações';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(documentTitle)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            color: ${PRINT_COLORS.textBase};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-page {
            width: 210mm;
            height: 297mm;
            padding: 7mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background:
              linear-gradient(135deg, rgba(15, 118, 110, 0.05), rgba(255, 255, 255, 0) 35%),
              #ffffff;
          }

          .report-header {
            min-height: 20mm;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 11px;
            border-radius: 8px;
            background: linear-gradient(135deg, #0f766e 0%, #0e7490 56%, #164e63 100%);
            color: #ffffff;
            box-shadow: 0 8px 24px rgba(15, 118, 110, 0.16);
          }

          .header-logo {
            width: 43px;
            height: 43px;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            border-radius: 999px;
            background: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.75);
          }

          .header-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .header-copy {
            min-width: 0;
            flex: 1;
          }

          .header-kicker {
            margin: 0 0 2px;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(204, 251, 241, 0.88);
          }

          .header-title {
            margin: 0;
            font-size: 17px;
            line-height: 1.08;
            font-weight: 850;
            letter-spacing: 0;
          }

          .header-subtitle {
            margin-top: 3px;
            font-size: 8px;
            line-height: 1.2;
            color: rgba(240, 253, 250, 0.82);
          }

          .sus-badge {
            width: 34px;
            min-height: 28px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.94);
            color: #0f766e;
            border: 1px solid rgba(255, 255, 255, 0.85);
          }

          .sus-badge strong {
            font-size: 11px;
            line-height: 1;
            font-weight: 900;
          }

          .sus-badge span {
            margin-top: 2px;
            font-size: 5px;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: #64748b;
          }

          .accent-line {
            display: grid;
            grid-template-columns: 2.2fr 1fr 1fr 2.7fr;
            gap: 2px;
            height: 3px;
            margin: 4px 0 6px;
          }

          .accent-line span {
            border-radius: 999px;
          }

          .accent-line span:nth-child(1) { background: #0d9488; }
          .accent-line span:nth-child(2) { background: #38bdf8; }
          .accent-line span:nth-child(3) { background: #f472b6; }
          .accent-line span:nth-child(4) { background: #a7f3d0; }

          .report-meta {
            display: grid;
            grid-template-columns: 1.3fr 0.76fr 0.86fr;
            gap: 6px;
            margin-bottom: 6px;
          }

          .meta-card {
            min-height: 35px;
            padding: 7px 9px;
            border-radius: 7px;
            background: rgba(248, 250, 252, 0.92);
            border: 1px solid ${PRINT_COLORS.border};
          }

          .meta-label {
            display: block;
            margin-bottom: 2px;
            color: ${PRINT_COLORS.textMuted};
            font-size: 6.8px;
            font-weight: 850;
            letter-spacing: 0.11em;
            text-transform: uppercase;
          }

          .meta-value {
            display: block;
            min-width: 0;
            color: #0f172a;
            font-size: 9.3px;
            font-weight: 800;
            line-height: 1.22;
            text-transform: capitalize;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
          }

          .doc-title {
            margin: 0;
            color: #0f766e;
            font-size: 12px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .doc-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 7px;
            border-radius: 999px;
            border: 1px solid #99f6e4;
            background: #ecfdf5;
            color: #0f766e;
            font-size: 7px;
            font-weight: 850;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 5px;
            margin-bottom: 6px;
          }

          .metric-card {
            min-height: 32px;
            padding: 6px 7px;
            border-radius: 7px;
            border: 1px solid ${PRINT_COLORS.border};
            background: #ffffff;
          }

          .metric-value {
            display: block;
            color: #0f172a;
            font-size: 14px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0;
            font-variant-numeric: tabular-nums;
          }

          .metric-label {
            display: block;
            margin-top: 3px;
            color: ${PRINT_COLORS.textMuted};
            font-size: 6.5px;
            line-height: 1;
            font-weight: 850;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .metric-total { border-color: #99f6e4; background: #f0fdfa; }
          .metric-appointments { border-color: #bfdbfe; background: #eff6ff; }
          .metric-empty { border-color: #d4d4d8; background: #fafafa; }
          .metric-blocked { border-color: #fecaca; background: #fef2f2; }
          .metric-prenatal { border-color: #fbcfe8; background: #fdf2f8; }

          .legend {
            min-height: 21px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 5px;
            padding: 4px 6px;
            margin-bottom: 6px;
            border: 1px solid ${PRINT_COLORS.border};
            border-radius: 7px;
            background: rgba(255, 255, 255, 0.82);
          }

          .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
            color: ${PRINT_COLORS.textMuted};
            font-size: 6.7px;
            line-height: 1;
            font-weight: 850;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
          }

          .schedule-table-wrap {
            flex: 1;
            min-height: 0;
            overflow: hidden;
            border: 1px solid ${PRINT_COLORS.border};
            border-radius: 8px;
            background: #ffffff;
          }

          table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead {
            height: 21px;
          }

          thead tr {
            background: linear-gradient(90deg, #0f766e, #0e7490);
          }

          th {
            padding: 5px 7px;
            color: #ffffff;
            border-right: 1px solid rgba(255, 255, 255, 0.18);
            text-align: left;
            font-size: 6.8px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }

          tbody tr {
            break-inside: avoid;
            page-break-inside: avoid;
            border-bottom: 1px solid ${PRINT_COLORS.border};
          }

          tbody tr:last-child {
            border-bottom: none;
          }

          td {
            padding: 3px 7px;
            vertical-align: middle;
            border-right: 1px solid ${PRINT_COLORS.border};
            color: ${PRINT_COLORS.textBase};
            font-size: 8.3px;
            line-height: 1.15;
            font-weight: 650;
          }

          .report-page.comfortable td {
            padding-top: 5px;
            padding-bottom: 5px;
            font-size: 9.4px;
          }

          .report-page.compact td {
            padding-top: 4px;
            padding-bottom: 4px;
            font-size: 8.7px;
          }

          .report-page.dense td {
            padding-top: 2px;
            padding-bottom: 2px;
            font-size: 7.55px;
          }

          .row-even { background: #ffffff; }
          .row-odd { background: #f8fafc; }
          .row-empty { background: #fafafa; color: #71717a; }
          .row-blocked { background: #fff1f2; }
          .row-prenatal { background: #fdf2f8; }

          .col-slot { width: 12%; }
          .col-main { width: 36%; }
          .col-doc { width: 22%; }
          .col-acs { width: 16%; }
          .col-status { width: 14%; }

          .slot-stack {
            --slot-badge-size: 20px;
            display: grid;
            grid-template-columns: var(--slot-badge-size) minmax(0, 1fr);
            align-items: center;
            gap: 6px;
            min-width: 0;
          }

          .report-page.dense .slot-stack {
            --slot-badge-size: 17px;
          }

          .slot-stack strong {
            width: var(--slot-badge-size);
            height: var(--slot-badge-size);
            display: grid;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            border-radius: 999px;
            background: #ecfdf5;
            border: 1px solid #99f6e4;
            color: #0f766e;
            font-size: 9px;
            font-weight: 900;
            line-height: 1;
            text-align: center;
            font-variant-numeric: tabular-nums;
          }

          .report-page.dense .slot-stack strong {
            font-size: 7.7px;
          }

          .slot-stack span {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            min-width: 0;
            color: ${PRINT_COLORS.textMuted};
            font-size: 7px;
            font-weight: 850;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .main-line {
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 0;
            color: #0f172a;
            font-weight: 850;
          }

          .main-line span,
          .col-doc span,
          .col-acs span {
            min-width: 0;
            display: block;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .main-meta {
            margin-top: 1px;
            color: ${PRINT_COLORS.textMuted};
            font-size: 6.5px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .row-empty .main-line,
          .row-empty .col-doc,
          .row-empty .col-acs {
            color: #71717a;
            font-weight: 700;
          }

          .row-blocked .main-line,
          .row-blocked .col-doc,
          .row-blocked .col-acs {
            color: #991b1b;
          }

          .row-prenatal .main-line,
          .row-prenatal .col-doc,
          .row-prenatal .col-acs {
            color: #9d174d;
          }

          .period-icon,
          .row-icon {
            width: 12px;
            height: 12px;
            flex: 0 0 auto;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .period-icon {
            width: 10px;
            height: 10px;
          }

          .period-icon-morning { color: #f59e0b; }
          .period-icon-afternoon { color: #4f46e5; }
          .row-icon-appointment { color: #0f766e; }
          .row-icon-empty { color: #71717a; }
          .row-icon-blocked { color: #dc2626; }
          .row-icon-prenatal { color: #db2777; }

          .status-badge {
            max-width: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 3px 6px;
            border-radius: 999px;
            border: 1px solid transparent;
            font-size: 6.7px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .status-scheduled { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
          .status-success { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
          .status-warning { color: #92400e; background: #fffbeb; border-color: #fde68a; }
          .status-purple { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }
          .status-empty { color: #52525b; background: #f4f4f5; border-color: #d4d4d8; }
          .status-blocked { color: #991b1b; background: #fee2e2; border-color: #fecaca; }
          .status-prenatal { color: #9d174d; background: #fce7f3; border-color: #fbcfe8; }

          .report-footer {
            height: 17px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 7px;
            padding-top: 5px;
            color: ${PRINT_COLORS.textMuted};
            font-size: 6.8px;
            font-weight: 750;
          }

          .footer-brand {
            color: #0f766e;
            font-weight: 900;
          }

          @media print {
            html,
            body {
              width: 210mm;
              height: 297mm;
              overflow: hidden;
            }

            .report-page {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <main class="report-page ${density}">
          <header class="report-header">
            <div class="header-logo">
              <img src="/1708612751_brasao5180.png" alt="Brasão Prefeitura" />
            </div>
            <div class="header-copy">
              <p class="header-kicker">Atenção Primária</p>
              <h1 class="header-title">Unidade de Saúde</h1>
              <div class="header-subtitle">Secretaria Municipal de Saúde · Relatório operacional de marcações</div>
            </div>
            <div class="sus-badge" aria-label="Sistema Único de Saúde">
              <strong>SUS</strong>
              <span>Brasil</span>
            </div>
          </header>

          <div class="accent-line" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <section class="report-meta" aria-label="Dados do relatório">
            <div class="meta-card">
              <span class="meta-label">Data da agenda</span>
              <span class="meta-value">${escapeHtml(formatLongDate(reportDate))}</span>
            </div>
            <div class="meta-card">
              <span class="meta-label">Período</span>
              <span class="meta-value">${escapeHtml(periodLabel)}</span>
            </div>
            <div class="meta-card">
              <span class="meta-label">Data de emissão</span>
              <span class="meta-value">${escapeHtml(formatShortDateTime(generatedAt))}</span>
            </div>
          </section>

          <section class="title-row" aria-label="Título do documento">
            <h2 class="doc-title">${escapeHtml(documentTitle)}</h2>
            <span class="doc-chip">${items.length <= 30 ? 'A4 · uma folha' : 'A4 · compacto'}</span>
          </section>

          <section class="metrics-grid" aria-label="Resumo das marcações">
            ${renderMetricCard('Fichas', stats.total, 'total')}
            ${renderMetricCard('Agendados', stats.appointments, 'appointments')}
            ${renderMetricCard('Vagas', stats.empty, 'empty')}
            ${renderMetricCard('Bloqueios', stats.blocked, 'blocked')}
            ${renderMetricCard('Pré-Natal', stats.prenatal, 'prenatal')}
          </section>

          <section class="legend" aria-label="Legenda do relatório">
            ${renderLegendItem('appointment', 'Paciente')}
            ${renderLegendItem('empty', 'Vaga livre')}
            ${renderLegendItem('blocked', 'Bloqueio')}
            ${renderLegendItem('prenatal', 'Pré-Natal')}
          </section>

          <section class="schedule-table-wrap" aria-label="Lista de fichas">
            <table>
              <thead>
                <tr>
                  <th class="col-slot">Ficha</th>
                  <th class="col-main">Paciente ou motivo</th>
                  <th class="col-doc">Documento</th>
                  <th class="col-acs">ACS</th>
                  <th class="col-status">Situação</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(items)}
              </tbody>
            </table>
          </section>

          <footer class="report-footer">
            <span>Impresso em ${escapeHtml(formatShortDateTime(generatedAt))}</span>
            <span>·</span>
            <span class="footer-brand">HealthCall</span>
            <span>·</span>
            <span>Documento gerado eletronicamente</span>
          </footer>
        </main>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
