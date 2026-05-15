import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, SearchX, CalendarDays } from 'lucide-react';
import PrescriptionCard from './PrescriptionCard';
import type { Prescription, PrescriptionStatus } from '../types';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  selectedIds: string[];
  onSelectToggle: (id: string) => void;
  onUpload: (prescriptionId: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: PrescriptionStatus) => Promise<void>;
  onMarkDelivered: (id: string, deliveredTo: string) => Promise<void>;
  onDenyRenewal: (id: string, reason: string) => Promise<void>;
  uploadingId: string | null;
  deletingId: string | null;
  updatingStatusId: string | null;
  markingDeliveredId: string | null;
  denyingId: string | null;
  searchQuery?: string;
  statusFilter?: string;
}

type GroupKey = 'Hoje' | 'Ontem' | 'Esta semana' | 'Semana passada' | 'Anteriores';

function parseDateOnly(dateStr: string): Date {
  const datePart = dateStr.slice(0, 10);
  return new Date(datePart + 'T12:00:00');
}

function getGroupKey(dateStr: string): GroupKey {
  const date = parseDateOnly(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // domingo
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return 'Hoje';
  if (d.getTime() === yesterday.getTime()) return 'Ontem';
  if (d >= startOfWeek) return 'Esta semana';
  if (d >= startOfLastWeek) return 'Semana passada';
  return 'Anteriores';
}

function groupByDate(prescriptions: Prescription[]): Record<GroupKey, Prescription[]> {
  const groups: Record<GroupKey, Prescription[]> = {
    Hoje: [],
    Ontem: [],
    'Esta semana': [],
    'Semana passada': [],
    Anteriores: [],
  };
  for (const p of prescriptions) {
    const key = getGroupKey(p.created_at);
    groups[key].push(p);
  }
  return groups;
}

const groupOrder: GroupKey[] = ['Hoje', 'Ontem', 'Esta semana', 'Semana passada', 'Anteriores'];

const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions,
  selectedIds,
  onSelectToggle,
  onUpload,
  onDelete,
  onUpdateStatus,
  onMarkDelivered,
  uploadingId,
  deletingId,
  updatingStatusId,
  markingDeliveredId,
  searchQuery,
  statusFilter,
}) => {
  const hasFilters = Boolean(searchQuery?.trim()) || statusFilter !== 'all';

  if (prescriptions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-[1.5rem] border border-[#E2E8F0] bg-white py-16 px-4 text-center shadow-[0_12px_28px_rgba(0,27,61,0.04)]"
      >
        <div className="mb-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
          {hasFilters ? (
            <SearchX className="h-10 w-10 text-[#94A3B8]" />
          ) : (
            <ClipboardList className="h-10 w-10 text-[#94A3B8]" />
          )}
        </div>
        <h3 className="text-lg font-extrabold text-[#001B3D] mb-1">
          {hasFilters ? 'Nenhuma receita encontrada' : 'Nenhuma receita registrada'}
        </h3>
        <p className="text-sm font-semibold text-[#64748B] max-w-xs">
          {hasFilters
            ? 'Tente ajustar os filtros ou a busca para encontrar o que procura.'
            : 'Clique em "Nova Receita" para registrar a primeira receita do paciente.'}
        </p>
      </motion.div>
    );
  }

  const groups = useMemo(() => groupByDate(prescriptions), [prescriptions]);

  return (
    <div className="space-y-6">
      {groupOrder.map((groupKey) => {
        const groupItems = groups[groupKey];
        if (groupItems.length === 0) return null;

        return (
          <div key={groupKey} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CalendarDays className="h-4 w-4 text-[#94A3B8]" />
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">
                {groupKey}
              </span>
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-black text-[#64748B]">
                {groupItems.length}
              </span>
              <span className="h-px flex-1 bg-[linear-gradient(90deg,#E2E8F0_0%,transparent_100%)]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupItems.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  selected={selectedIds.includes(prescription.id)}
                  onSelectToggle={() => onSelectToggle(prescription.id)}
                  onUpload={onUpload}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus}
                  onMarkDelivered={onMarkDelivered}
                  isUploading={uploadingId === prescription.id}
                  isDeleting={deletingId === prescription.id}
                  isUpdatingStatus={updatingStatusId === prescription.id}
                  isMarkingDelivered={markingDeliveredId === prescription.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrescriptionList;
