import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Prescription, CreatePrescriptionInput, PrescriptionStatus } from '../types';
import {
  fetchPrescriptions,
  createPrescription as createPrescriptionService,
  uploadPrescriptionPdf as uploadPrescriptionPdfService,
  deletePrescription as deletePrescriptionService,
  updatePrescriptionStatus as updatePrescriptionStatusService,
  markPrescriptionDelivered as markPrescriptionDeliveredService,
  denyPrescriptionRenewal as denyPrescriptionRenewalService,
  batchDeletePrescriptions as batchDeletePrescriptionsService,
  batchUpdatePrescriptionsStatus as batchUpdatePrescriptionsStatusService,
} from '../services/prescriptionService';

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState<string | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [isDenying, setIsDenying] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar receitas.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPrescription = useCallback(
    async (input: CreatePrescriptionInput) => {
      setIsCreating(true);
      try {
        const created = await createPrescriptionService(input);
        setPrescriptions((prev) => [created, ...prev]);
        toast.success('Receita registrada com sucesso.');
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao registrar receita.';
        toast.error(message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const uploadPdf = useCallback(
    async (prescriptionId: string, file: File) => {
      setIsUploading(prescriptionId);
      try {
        const result = await uploadPrescriptionPdfService({ prescriptionId, file });
        setPrescriptions((prev) =>
          prev.map((p) =>
            p.id === prescriptionId
              ? { ...p, status: 'ready' as const, pdf_url: result.url, pdf_storage_path: result.storagePath }
              : p
          )
        );
        toast.success('PDF enviado com sucesso.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar PDF.';
        toast.error(message);
        throw err;
      } finally {
        setIsUploading(null);
      }
    },
    []
  );

  const updateStatus = useCallback(
    async (id: string, status: PrescriptionStatus) => {
      setIsUpdatingStatus(id);
      try {
        const updated = await updatePrescriptionStatusService(id, status);
        setPrescriptions((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success('Status atualizado.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar status.';
        toast.error(message);
        throw err;
      } finally {
        setIsUpdatingStatus(null);
      }
    },
    []
  );

  const markDelivered = useCallback(
    async (prescriptionId: string, deliveredTo: string) => {
      setIsMarkingDelivered(prescriptionId);
      try {
        const updated = await markPrescriptionDeliveredService({ prescriptionId, deliveredTo });
        setPrescriptions((prev) => prev.map((p) => (p.id === prescriptionId ? updated : p)));
        toast.success('Entrega registrada com sucesso.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao registrar entrega.';
        toast.error(message);
        throw err;
      } finally {
        setIsMarkingDelivered(null);
      }
    },
    []
  );

  const deletePrescription = useCallback(
    async (id: string) => {
      setIsDeleting(id);
      try {
        await deletePrescriptionService(id);
        setPrescriptions((prev) => prev.filter((p) => p.id !== id));
        toast.success('Receita removida com sucesso.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover receita.';
        toast.error(message);
        throw err;
      } finally {
        setIsDeleting(null);
      }
    },
    []
  );

  const batchDelete = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setIsBatchDeleting(true);
      try {
        await batchDeletePrescriptionsService(ids);
        setPrescriptions((prev) => prev.filter((p) => !ids.includes(p.id)));
        toast.success(`${ids.length} receita(s) removida(s).`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover receitas.';
        toast.error(message);
        throw err;
      } finally {
        setIsBatchDeleting(false);
      }
    },
    []
  );

  const denyRenewal = useCallback(
    async (prescriptionId: string, reason: string) => {
      setIsDenying(prescriptionId);
      try {
        const updated = await denyPrescriptionRenewalService({ prescriptionId, reason });
        setPrescriptions((prev) => prev.map((p) => (p.id === prescriptionId ? updated : p)));
        toast.success('Renovação negada.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao negar renovação.';
        toast.error(message);
        throw err;
      } finally {
        setIsDenying(null);
      }
    },
    []
  );

  const batchUpdateStatus = useCallback(
    async (ids: string[], status: PrescriptionStatus) => {
      if (ids.length === 0) return;
      setIsBatchUpdating(true);
      try {
        await batchUpdatePrescriptionsStatusService(ids, status);
        setPrescriptions((prev) =>
          prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p))
        );
        toast.success('Status atualizado em lote.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar status em lote.';
        toast.error(message);
        throw err;
      } finally {
        setIsBatchUpdating(false);
      }
    },
    []
  );

  return {
    prescriptions,
    isLoading,
    isCreating,
    isUploading,
    isDeleting,
    isUpdatingStatus,
    isMarkingDelivered,
    isDenying,
    isBatchDeleting,
    isBatchUpdating,
    refresh,
    createPrescription,
    uploadPdf,
    updateStatus,
    markDelivered,
    denyRenewal,
    deletePrescription,
    batchDelete,
    batchUpdateStatus,
  };
}
