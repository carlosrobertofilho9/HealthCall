import { useState, useEffect, useMemo, useCallback } from 'react';
import { Patient, PatientStatus } from '@/types';
import * as patientService from '@/features/dashboard/services/patientService';
import * as localDb from '@/services/localDatabase';
import { toast } from 'sonner';
import { useElectron } from '@/hooks/useElectron';
import { useUserProfile } from '@/hooks/useUserProfile';



/**
 * Um hook abrangente para gerenciar o estado e as interações da fila de pacientes.
 *
 * Este hook encapsula toda a lógica relacionada à fila de pacientes, incluindo:
 * - Buscar a lista inicial de pacientes.
 * - Inscrever-se para atualizações em tempo real via IPC do Electron.
 * - Gerenciar os estados de pesquisa e filtro.
 * - Fornecer funções para adicionar, atualizar, remover, chamar e limpar pacientes.
 * - Lidar com o estado de carregamento e exibir notificações de brinde para as ações.
 *
 * @returns {{
 *   patients: Patient[],
 *   searchTerm: string,
 *   setSearchTerm: (term: string) => void,
 *   selectedDestination: string,
 *   setSelectedDestination: (destination: string) => void,
 *   addPatientByName: (name: string, destination: string) => Promise<void>,
 *   addPatientByNumber: (destination: string) => Promise<void>,
 *   updatePatientStatus: (id: string, status: PatientStatus) => Promise<void>,
 *   updatePatientDestination: (id: string, destination: string) => Promise<void>,
 *   removePatient: (id: string) => Promise<void>,
 *   callPatient: (id: string, destination: string) => Promise<void>,
 *   clearQueue: () => Promise<void>,
 *   updatePatient: (patient: Patient) => Promise<void>,
 *   isAddingPatient: boolean
 * }} Um objeto contendo o estado da fila e as funções para manipulá-la.
 */
export function usePatientQueue(props?: { defaultDestination?: string | null }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const { generateTTS } = useElectron();
  const { profile } = useUserProfile();
  /* const { user } = useAuth(); REMOVED to avoid hook issues */

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (props?.defaultDestination) {
      setSelectedDestination(props.defaultDestination);
    } else if (profile?.default_destination !== undefined) {
      setSelectedDestination(profile.default_destination ?? '');
    }
  }, [profile?.default_destination, props?.defaultDestination]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (error: any) {
        toast.error(error.message);
      }
    };

    fetchPatients();

    // Listen for data updates via IPC (replaces Supabase Realtime)
    const handleDataUpdate = (data: { table: string }) => {
      if (data.table === 'patients') {
        fetchPatients();
      }
    };

    localDb.onDataUpdate(handleDataUpdate);

    return () => {
      localDb.offDataUpdate(handleDataUpdate);
    };
  }, []);

  const addPatientByName = useCallback(async (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return null;
    }
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticPatient: Patient = {
        id: tempId,
        name,
        destination,
        status: 'Aguardando',
        callCount: 0
    };

    setPatients((current) => [optimisticPatient, ...current]);
    setIsAddingPatient(true);

    try {
      const newPatient = await patientService.addPatient(name, destination);
      if (newPatient) {
        // Replace optimistic patient with real one
        setPatients((current) => 
            current.map(p => p.id === tempId ? newPatient : p)
        );
        toast.success('Paciente adicionado com sucesso!');
        return newPatient;
      }
      return null;
    } catch (error: any) {
      // Revert optimistic update
      setPatients((current) => current.filter(p => p.id !== tempId));
      toast.error(error.message);
      return null;
    } finally {
      setIsAddingPatient(false);
    }
  }, []);

  const addPatientByNumber = useCallback(async (destination: string) => {
    setIsAddingPatient(true);
    // Note: We can't fully predict the sequential name/number here without server knowledge,
    // so true optimistic UI for "Generated Number" is harder. 
    // We will stick to standard loading state for this specific action to avoiding showing wrong number.
    // Or we could show a placeholder "Gerando senha..."?
    // User asked for optimistic UI. Let's try to be smart or just wait for this one?
    // "Ficha" usually implies a server-side sequence.
    // Let's keep it standard for now to avoid showing "Senha X" then changing to "Senha Y".
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
      setPatients((current) =>
        current.map((p) => (p.id === id ? { ...p, status } : p))
      );
      
      try {
        await patientService.updatePatient({ ...patient, status });
        toast.info(`Status de ${patient.name} alterado para "${status}"!`);
      } catch (error: any) {
        setPatients((current) =>
          current.map((p) => (p.id === id ? patient : p))
        );
        toast.error(error.message);
      }
    }
  }, [patients]);

  const updatePatient = useCallback(async (patient: Patient) => {
    const oldPatient = patients.find((p) => p.id === patient.id);
    setPatients((current) =>
      current.map((p) => (p.id === patient.id ? patient : p))
    );
    
    try {
      await patientService.updatePatient(patient);
      toast.info('Paciente atualizado com sucesso!');
    } catch (error: any) {
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
      setPatients((current) =>
        current.map((p) => (p.id === id ? { ...p, destination } : p))
      );
      
      try {
        await patientService.updatePatient({ ...patient, destination });
        toast.info(`Destino de ${patient.name} alterado para "${destination}"!`);
      } catch (error: any) {
        setPatients((current) =>
          current.map((p) => (p.id === id ? patient : p))
        );
        toast.error(error.message);
      }
    }
  }, [patients]);

  const removePatient = useCallback(async (id: string) => {
    const removedPatient = patients.find((p) => p.id === id);
    if (!removedPatient) return;

    // Optimistic Update
    setPatients((current) => current.filter((p) => p.id !== id));
    
    try {
      await patientService.removePatient(id);
      toast('Paciente removido da fila!');
    } catch (error: any) {
      // Revert
      if (removedPatient) {
        setPatients((current) => [removedPatient, ...current]);
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

    // Optimistic Update
    setPatients((current) =>
      current.map((p) => (p.id === id ? updatedPatient : p))
    );
    
    try {
      const calledPatient = await patientService.callPatient(id, destination);
      if (calledPatient) {
        // Update with real server data (might contain timestamps etc)
        setPatients((current) =>
            current.map((p) => (p.id === id ? calledPatient : p))
        );
        const time = calledPatient.callCount > 1 ? ` pela ${calledPatient.callCount}ª vez` : '';
        toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
      }
    } catch (error: any) {
      // Revert
      setPatients((current) =>
        current.map((p) => (p.id === id ? patient : p))
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
