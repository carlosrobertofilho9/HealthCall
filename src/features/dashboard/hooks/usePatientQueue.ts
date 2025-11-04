import { useState, useEffect, useMemo, useCallback } from 'react';
import { Patient, PatientStatus } from '@/types';
import * as patientService from '@/features/dashboard/services/patientService';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

export function usePatientQueue() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientService.getPatients();
      setPatients(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel('realtime-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients]);

  const addPatient = useCallback(async (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return;
    }
    try {
      await patientService.addPatient(name, destination);
      toast.success('Paciente adicionado com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const updatePatientStatus = useCallback(async (id: string, status: PatientStatus) => {
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      try {
        await patientService.updatePatient({ ...patient, status });
        toast.info(`Status de ${patient.name} alterado para "${status}"!`);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  }, [patients]);

  const updatePatient = useCallback(async (patient: Patient) => {
    try {
      await patientService.updatePatient(patient);
      toast.info('Paciente atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const updatePatientDestination = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (patient) {
        try {
            await patientService.updatePatient({ ...patient, destination });
            toast.info(`Destino de ${patient.name} alterado para "${destination}"!`);
        } catch (error: any) {
            toast.error(error.message);
        }
    }
  }, [patients]);

  const removePatient = useCallback(async (id: string) => {
    try {
      await patientService.removePatient(id);
      toast.warning('Paciente removido da fila!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const callPatient = useCallback(async (id: string, destination: string) => {
    try {
      const calledPatient = await patientService.callPatient(id, destination);
      if (calledPatient) {
        const time = calledPatient.callCount > 1 ? ` pela ${calledPatient.callCount}ª vez` : '';
        toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const clearQueue = useCallback(async () => {
    try {
      await patientService.clearQueue();
      toast.warning('Fila de pacientes limpa!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const filteredPatients = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
          (selectedDestination === '' || p.destination === selectedDestination)
      ),
    [patients, debouncedSearchTerm, selectedDestination]
  );

  return {
    patients: filteredPatients,
    searchTerm,
    setSearchTerm,
    selectedDestination,
    setSelectedDestination,
    addPatient,
    updatePatientStatus,
    updatePatientDestination,
    removePatient,
    callPatient,
    clearQueue,
    updatePatient
  };
}
