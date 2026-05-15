import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, SearchX, CalendarDays } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '@/components/ui';
import PrescriptionCard from './PrescriptionCard';
import type { Prescription, PrescriptionStatus } from '../types';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  selectedIds: string[];
  onSelectToggle: (id: string) => void;
  onUpload: (prescriptionId: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: PrescriptionStatus) => Promise<void>;
  onMarkDelivered: (prescriptionId: string, deliveredTo: string) => Promise<void>;
  onDenyRenewal: (prescriptionId: string, reason: string) => Promise<void>;
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
  startOfWeek.setDate(today.getDate() - today.getDay());
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
  onDenyRenewal,
  uploadingId,
  deletingId,
  updatingStatusId,
  markingDeliveredId,
  denyingId,
  searchQuery,
  statusFilter,
}) => {
  const hasFilters = Boolean(searchQuery?.trim()) || statusFilter !== 'all';

  if (prescriptions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 px-4 text-center shadow-sm"
      >
        <div className="mb-4 rounded-2xl border border-border bg-accent p-5">
          {hasFilters ? (
            <SearchX className="h-8 w-8 text-muted-foreground" />
          ) : (
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">
          {hasFilters ? 'Nenhuma receita encontrada' : 'Nenhuma receita registrada'}
        </h3>
        <p className="text-sm font-medium text-muted-foreground max-w-xs">
          {hasFilters
            ? 'Tente ajustar os filtros ou a busca para encontrar o que procura.'
            : 'Clique em "Nova Receita" para registrar a primeira receita do paciente.'}
        </p>
      </motion.div>
    );
  }

  const groups = useMemo(() => groupByDate(prescriptions), [prescriptions]);

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {groupOrder.map((groupKey) => {
          const groupItems = groups[groupKey];
          if (groupItems.length === 0) return null;

          return (
            <motion.div
              key={groupKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {/* Group header */}
              <div className="flex items-center gap-2 px-1">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {groupKey}
                </span>
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-2 text-[10px] font-bold text-muted-foreground">
                  {groupItems.length}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Desktop table */}
              <div className="hidden rounded-2xl border border-border bg-card shadow-sm overflow-hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10" />
                      <TableHead className="text-xs font-semibold">Paciente</TableHead>
                      <TableHead className="text-xs font-semibold">Documento</TableHead>
                      <TableHead className="text-xs font-semibold">Sinalizações</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="w-32 text-xs font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                        onDenyRenewal={onDenyRenewal}
                        isUploading={uploadingId === prescription.id}
                        isDeleting={deletingId === prescription.id}
                        isUpdatingStatus={updatingStatusId === prescription.id}
                        isMarkingDelivered={markingDeliveredId === prescription.id}
                        isDenying={denyingId === prescription.id}
                        view="table"
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
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
                    onDenyRenewal={onDenyRenewal}
                    isUploading={uploadingId === prescription.id}
                    isDeleting={deletingId === prescription.id}
                    isUpdatingStatus={updatingStatusId === prescription.id}
                    isMarkingDelivered={markingDeliveredId === prescription.id}
                    isDenying={denyingId === prescription.id}
                    view="card"
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PrescriptionList;
