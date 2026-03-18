import { useState, useEffect, useMemo, useCallback } from 'react';
import { Patient, PatientStatus } from '@/types';
import * as patientService from '@/features/dashboard/services/patientService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type PatientRow = {
  id?: string;
  name?: string;
  destination?: string;
  status?: PatientStatus;
  callCount?: number;
  queue_order?: number;
};

function comparePatients(a: Patient, b: Patient) {
  const queueOrderA = typeof a.queue_order === 'number' ? a.queue_order : Number.MAX_SAFE_INTEGER;
  const queueOrderB = typeof b.queue_order === 'number' ? b.queue_order : Number.MAX_SAFE_INTEGER;

  if (queueOrderA !== queueOrderB) {
    return queueOrderA - queueOrderB;
  }

  return a.name.localeCompare(b.name, 'pt-BR');
}

function normalizePatient(row: PatientRow): Patient | null {
  if (!row.id || !row.name || !row.destination || !row.status) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    status: row.status,
    callCount: typeof row.callCount === 'number' ? row.callCount : 0,
    queue_order: typeof row.queue_order === 'number' ? row.queue_order : 0,
  };
}

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

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (error: any) {
        toast.error(error.message);
      }
    };

    const applyRealtimeChange = (eventType: string, newRow?: PatientRow, oldRow?: PatientRow) => {
      setPatients((current) => {
        if (eventType === 'DELETE' && oldRow?.id) {
          return current.filter((patient) => patient.id !== oldRow.id);
        }

        const normalized = normalizePatient(newRow ?? oldRow ?? {});
        if (!normalized) {
          return current;
        }

        const withoutCurrent = current.filter((patient) => patient.id !== normalized.id);
        return [...withoutCurrent, normalized].sort(comparePatients);
      });
    };

    fetchPatients();

    const channel = supabase
      .channel('realtime-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        applyRealtimeChange(
          payload.eventType,
          payload.new as PatientRow | undefined,
          payload.old as PatientRow | undefined,
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addPatientByName = useCallback(async (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return;
    }

    setIsAddingPatient(true);
    try {
      const newPatient = await patientService.addPatient(name, destination);
      if (newPatient) {
        setPatients((current) => [newPatient, ...current].sort(comparePatients));
        toast.success('Paciente adicionado com sucesso!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAddingPatient(false);
    }
  }, []);

  const addPatientByNumber = useCallback(async (destination: string) => {
    setIsAddingPatient(true);
    try {
      const newPatient = await patientService.addPatientByNumber(destination);
      if (newPatient) {
        setPatients((current) => [newPatient, ...current].sort(comparePatients));
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

    setPatients((current) =>
      current.map((p) => (p.id === id ? { ...p, status } : p)).sort(comparePatients)
    );

    try {
      await patientService.updatePatient({ ...patient, status });
      toast.info(`Status de ${patient.name} alterado para "${status}"!`);
    } catch (error: any) {
      setPatients((current) =>
        current.map((p) => (p.id === id ? patient : p)).sort(comparePatients)
      );
      toast.error(error.message);
    }
  }, [patients]);

  const updatePatient = useCallback(async (patient: Patient) => {
    const oldPatient = patients.find((p) => p.id === patient.id);
    setPatients((current) =>
      current.map((p) => (p.id === patient.id ? patient : p)).sort(comparePatients)
    );

    try {
      await patientService.updatePatient(patient);
      toast.info('Paciente atualizado com sucesso!');
    } catch (error: any) {
      if (oldPatient) {
        setPatients((current) =>
          current.map((p) => (p.id === patient.id ? oldPatient : p)).sort(comparePatients)
        );
      }
      toast.error(error.message);
    }
  }, [patients]);

  const updatePatientDestination = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    setPatients((current) =>
      current.map((p) => (p.id === id ? { ...p, destination } : p)).sort(comparePatients)
    );

    try {
      await patientService.updatePatient({ ...patient, destination });
      toast.info(`Destino de ${patient.name} alterado para "${destination}"!`);
    } catch (error: any) {
      setPatients((current) =>
        current.map((p) => (p.id === id ? patient : p)).sort(comparePatients)
      );
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
      if (removedPatient) {
        setPatients((current) => [removedPatient, ...current].sort(comparePatients));
      }
      toast.error(error.message);
    }
  }, [patients]);

  const callPatient = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    const updatedPatient = {
      ...patient,
      status: 'Chamado' as PatientStatus,
      callCount: patient.callCount + 1,
      destination,
    };

    setPatients((current) =>
      current.map((p) => (p.id === id ? updatedPatient : p)).sort(comparePatients)
    );

    try {
      const calledPatient = await patientService.callPatient(id, destination);
      if (calledPatient) {
        const time = calledPatient.callCount > 1 ? ` pela ${calledPatient.callCount}ª vez` : '';
        toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
      }
    } catch (error: any) {
      setPatients((current) =>
        current.map((p) => (p.id === id ? patient : p)).sort(comparePatients)
      );
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

  const reorderPatients = useCallback(async (newOrder: Patient[]) => {
    const previousPatients = patients;
    const normalizedOrder = newOrder.map((patient, index) => ({
      ...patient,
      queue_order: index + 1,
    }));

    setPatients(normalizedOrder);

    const updates = normalizedOrder.map((patient) => ({
      id: patient.id,
      queue_order: patient.queue_order,
    }));

    try {
      await patientService.updateQueueOrder(updates);
    } catch (error: any) {
      toast.error('Erro ao salvar a nova ordem da fila');
      setPatients(previousPatients);
    }
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch = patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesDestination = !selectedDestination || patient.destination === selectedDestination;
      return matchesSearch && matchesDestination;
    });
  }, [patients, debouncedSearchTerm, selectedDestination]);

  return {
    patients: filteredPatients,
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
