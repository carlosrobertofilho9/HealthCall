import { useState, useEffect, useMemo, useCallback } from 'react';
import { Patient, PatientStatus } from '@/types';
import * as patientService from '@/features/dashboard/services/patientService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-toastify';

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
    // Define fetchPatients inside useEffect to avoid dependency issues
    const fetchPatients = async () => {
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (error: any) {
        toast.error(error.message);
      }
    };
    
    // Initial fetch
    fetchPatients();

    // Setup realtime subscription - EXACTLY like the old code
    const channel = supabase
      .channel('realtime-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        fetchPatients(); // Simple refetch like the old code
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - setup only once

  const addPatientByName = useCallback(async (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return;
    }
    setIsAddingPatient(true);
    try {
      const newPatient = await patientService.addPatient(name, destination);
      if (newPatient) {
        setPatients((current) => [newPatient, ...current]);
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
    if (patient) {
      // Atualização local otimista
      setPatients((current) =>
        current.map((p) => (p.id === id ? { ...p, status } : p))
      );
      
      try {
        await patientService.updatePatient({ ...patient, status });
        toast.info(`Status de ${patient.name} alterado para "${status}"!`);
      } catch (error: any) {
        // Reverter em caso de erro
        setPatients((current) =>
          current.map((p) => (p.id === id ? patient : p))
        );
        toast.error(error.message);
      }
    }
  }, [patients]);

  const updatePatient = useCallback(async (patient: Patient) => {
    // Atualização local otimista
    const oldPatient = patients.find((p) => p.id === patient.id);
    setPatients((current) =>
      current.map((p) => (p.id === patient.id ? patient : p))
    );
    
    try {
      await patientService.updatePatient(patient);
      toast.info('Paciente atualizado com sucesso!');
    } catch (error: any) {
      // Reverter em caso de erro
      if (oldPatient) {
        setPatients((current) =>
          current.map((p) => (p.id === patient.id ? oldPatient : p))
        );
      }
      toast.error(error.message);
    }
  }, [patients]);

  const updatePatientDestination = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      // Atualização local otimista
      setPatients((current) =>
        current.map((p) => (p.id === id ? { ...p, destination } : p))
      );
      
      try {
        await patientService.updatePatient({ ...patient, destination });
        toast.info(`Destino de ${patient.name} alterado para "${destination}"!`);
      } catch (error: any) {
        // Reverter em caso de erro
        setPatients((current) =>
          current.map((p) => (p.id === id ? patient : p))
        );
        toast.error(error.message);
      }
    }
  }, [patients]);

  const removePatient = useCallback(async (id: string) => {
    // Salvar paciente antes de remover (para possível reversão)
    const removedPatient = patients.find((p) => p.id === id);
    
    // Atualização local otimista
    setPatients((current) => current.filter((p) => p.id !== id));
    
    try {
      await patientService.removePatient(id);
      toast.warning('Paciente removido da fila!');
    } catch (error: any) {
      // Reverter em caso de erro
      if (removedPatient) {
        setPatients((current) => [removedPatient, ...current]);
      }
      toast.error(error.message);
    }
  }, [patients]);

  const callPatient = useCallback(async (id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;
    
    // Atualização local otimista
    const updatedPatient = {
      ...patient,
      status: 'Chamado' as PatientStatus,
      callCount: patient.callCount + 1,
      destination,
    };
    setPatients((current) =>
      current.map((p) => (p.id === id ? updatedPatient : p))
    );
    
    try {
      const calledPatient = await patientService.callPatient(id, destination);
      if (calledPatient) {
        const time = calledPatient.callCount > 1 ? ` pela ${calledPatient.callCount}ª vez` : '';
        toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
      }
    } catch (error: any) {
      // Reverter em caso de erro
      setPatients((current) =>
        current.map((p) => (p.id === id ? patient : p))
      );
      toast.error(error.message);
    }
  }, [patients]);

  const clearQueue = useCallback(async () => {
    // Salvar estado atual para possível reversão
    const previousPatients = patients;
    
    // Atualização local otimista
    setPatients([]);
    
    try {
      await patientService.clearQueue();
      toast.warning('Fila de pacientes limpa!');
    } catch (error: any) {
      // Reverter em caso de erro
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
    isAddingPatient,
  };
}
