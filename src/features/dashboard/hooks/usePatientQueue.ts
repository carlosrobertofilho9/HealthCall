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

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    console.log('🔵 usePatientQueue: Iniciando fetch e subscription');
    
    // Define fetchPatients inside useEffect to avoid dependency issues
    const fetchPatients = async () => {
      try {
        console.log('📥 Fetching patients from database...');
        const data = await patientService.getPatients();
        console.log('📋 Patients fetched:', data.length);
        setPatients(data);
      } catch (error: any) {
        console.error('❌ Error fetching patients:', error);
        toast.error(error.message);
      }
    };
    
    // Initial fetch
    fetchPatients();

    // Setup realtime subscription - EXACTLY like the old code
    const channel = supabase
      .channel('realtime-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        console.log('🟢 Realtime event received, refetching all patients:', payload);
        fetchPatients(); // Simple refetch like the old code
      })
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status:', status);
        if (err) {
          console.error('❌ Realtime subscription error:', err);
        }
      });

    return () => {
      console.log('🔴 usePatientQueue: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - setup only once

  const addPatient = useCallback(async (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return;
    }
    console.log('➕ addPatient called:', { name, destination });
    try {
      const newPatient = await patientService.addPatient(name, destination);
      console.log('✅ Patient added to DB:', newPatient);
      if (newPatient) {
        // Atualização local otimista - adiciona imediatamente na UI
        setPatients((current) => {
          console.log('📝 Current patients count:', current.length);
          const updated = [newPatient, ...current];
          console.log('📝 Updated patients count:', updated.length);
          return updated;
        });
        toast.success('Paciente adicionado com sucesso!');
      }
    } catch (error: any) {
      console.error('❌ Error adding patient:', error);
      toast.error(error.message);
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
    addPatient,
    updatePatientStatus,
    updatePatientDestination,
    removePatient,
    callPatient,
    clearQueue,
    updatePatient
  };
}
