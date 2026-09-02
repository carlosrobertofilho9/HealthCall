import { useState, useEffect, useMemo, useCallback } from 'react';
import { Patient, PatientStatus } from '@/types';
import * as patientService from '@/features/dashboard/services/patientService';
import { subscribeDomain } from '@/lib/apiClient';
import { toast } from 'sonner';

/**
 * Hook para gerenciar a fila compartilhada da unidade usando a API local.
 */
export function usePatientQueue() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    let mounted = true;

    const fetchPatients = async () => {
      try {
        const data = await patientService.getPatients();
        if (mounted) setPatients(data);
      } catch (error: any) {
        if (mounted) toast.error(error.message);
      }
    };

    void fetchPatients();
    const unsubscribe = subscribeDomain('patients', () => void fetchPatients());

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const addPatientByName = useCallback(async (name: string, destination: string): Promise<Patient | null> => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return null;
    }
    setIsAddingPatient(true);
    try {
      const newPatient = await patientService.addPatient(name, destination);
      if (newPatient) {
        setPatients((current) => [newPatient, ...current]);
        toast.success('Paciente adicionado com sucesso!');
        return newPatient;
      }
      return null;
    } catch (error: any) {
      toast.error(error.message);
      return null;
    } finally {
      setIsAddingPatient(false);
    }
  }, []);

  const addPatientByNumber = useCallback(async (destination: string) => {
    setIsAddingPatient(true);
    try {
      const newPatient = await patientService.addPatientByNumber(destination);
      if (newPatient) {
        setPatients((current) => [newPatient, ...current]);
        toast.success(`${newPatient.name} adicionada com sucesso!`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAddingPatient(false);
    }
  }, []);

  const updatePatientStatus = useCallback(async (id: string, status: PatientStatus) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    setPatients((current) => current.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await patientService.updatePatient({ ...patient, status });
      toast.info(`Status de ${patient.name} alterado para "${status}"!`);
    } catch (error: any) {
      setPatients((current) => current.map((p) => (p.id === id ? patient : p)));
      toast.error(error.message);
    }
  }, [patients]);

  const updatePatient = useCallback(async (patient: Patient) => {
    const oldPatient = patients.find((p) => p.id === patient.id);
    setPatients((current) => current.map((p) => (p.id === patient.id ? patient : p)));

    try {
      await patientService.updatePatient(patient);
      toast.info('Paciente atualizado com sucesso!');
    } catch (error: any) {
      if (oldPatient) {
        setPatients((current) => current.map((p) => (p.id === patient.id ? oldPatient : p)));
      }
      toast.error(error.message);
    }
  }, [patients]);

  const updatePatientDestination = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    setPatients((current) => current.map((p) => (p.id === id ? { ...p, destination } : p)));
    try {
      await patientService.updatePatient({ ...patient, destination });
      toast.info(`Destino de ${patient.name} alterado para "${destination}"!`);
    } catch (error: any) {
      setPatients((current) => current.map((p) => (p.id === id ? patient : p)));
      toast.error(error.message);
    }
  }, [patients]);

  const removePatient = useCallback(async (id: string) => {
    const removedPatient = patients.find((p) => p.id === id);
    setPatients((current) => current.filter((p) => p.id !== id));

    try {
      await patientService.removePatient(id);
      toast('Paciente removido da fila!');
    } catch (error: any) {
      if (removedPatient) setPatients((current) => [removedPatient, ...current]);
      toast.error(error.message);
    }
  }, [patients]);

  const callPatient = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    try {
      const calledPatient = await patientService.callPatient(id, destination);
      if (calledPatient) {
        setPatients((current) => current.map((p) => (p.id === id ? calledPatient : p)));
        const time = calledPatient.callCount > 1 ? ` pela ${calledPatient.callCount}ª vez` : '';
        toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [patients]);

  const clearQueue = useCallback(async () => {
    const previousPatients = patients;
    setPatients([]);
    try {
      await patientService.clearQueue();
      toast('Fila de pacientes limpa!');
    } catch (error: any) {
      setPatients(previousPatients);
      toast.error(error.message);
    }
  }, [patients]);

  const filteredPatients = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
          (selectedDestination === '' || p.destination === selectedDestination)
      ),
    [patients, debouncedSearchTerm, selectedDestination]
  );

  const isFiltering = debouncedSearchTerm !== '' || selectedDestination !== '';

  const reorderPatients = useCallback(async (newOrder: Patient[]) => {
    setPatients(newOrder);
    const updates = newOrder.map((patient, index) => ({ id: patient.id, queue_order: index + 1 }));

    try {
      await patientService.updateQueueOrder(updates);
    } catch {
      toast.error('Erro ao salvar a nova ordem da fila');
      const data = await patientService.getPatients();
      setPatients(data);
    }
  }, []);

  return {
    patients,
    filteredPatients,
    isFiltering,
    searchTerm,
    setSearchTerm,
    selectedDestination,
    setSelectedDestination,
    addPatientByName,
    addPatientByNumber,
    updatePatientStatus,
    updatePatientDestination,
    removePatient,
    callPatient,
    clearQueue,
    updatePatient,
    reorderPatients,
    isAddingPatient,
  };
}
