import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Patient, PatientStatus } from '@/types';
import * as patientService from '@/features/dashboard/services/patientService';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

export function usePatientQueue() {
  const queryClient = useQueryClient();
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientService.getPatients,
  });
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
    const channel = supabase
      .channel('realtime-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { mutate: addPatient } = useMutation({
    mutationFn: ({ name, destination }: { name: string, destination: string }) => patientService.addPatient(name, destination),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente adicionado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const { mutate: updatePatient } = useMutation({
    mutationFn: (patient: Patient) => patientService.updatePatient(patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.info('Paciente atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updatePatientStatus = useCallback((id: string, status: PatientStatus) => {
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      updatePatient({ ...patient, status });
    }
  }, [patients, updatePatient]);

  const updatePatientDestination = useCallback((id: string, destination: string) => {
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      updatePatient({ ...patient, destination });
    }
  }, [patients, updatePatient]);

  const { mutate: removePatient } = useMutation({
    mutationFn: (id: string) => patientService.removePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.warning('Paciente removido da fila!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const { mutate: callPatient } = useMutation({
    mutationFn: ({ id, destination }: { id: string, destination: string }) => patientService.callPatient(id, destination),
    onSuccess: (calledPatient) => {
      if (calledPatient) {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        const time = calledPatient.callCount > 1 ? ` pela ${calledPatient.callCount}ª vez` : '';
        toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const { mutate: clearQueue } = useMutation({
    mutationFn: () => patientService.clearQueue(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.warning('Fila de pacientes limpa!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

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
