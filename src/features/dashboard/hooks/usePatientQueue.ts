import { useState, useEffect } from 'react';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { toast } from 'sonner';
import { Patient } from '@/types';

interface UsePatientQueueOptions {
  defaultDestination?: string;
}

export function usePatientQueue(options: UsePatientQueueOptions = {}) {
  const { 
    patients, 
    addPatient: addPatientSync,
    addPatientByNumber: addPatientByNumberSync,
    updatePatient: updatePatientSync, 
    callPatient: callPatientSync, 
    removePatient: removePatientSync,
    clearQueue: clearQueueSync
  } = useNetworkSync();
  
  const { profile } = useUserProfile();
  const { speak } = useTextToSpeech();
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const waitingPatients = patients.filter(p => p.status === 'Aguardando');
  const calledPatients = patients.filter(p => p.status === 'Chamado' || p.status === 'Em Atendimento');

  const addPatientByName = async (name: string, destination: string) => {
    setLoading(true);
    try {
      await addPatientSync(name, destination);
      toast.success('Paciente adicionado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar paciente');
    } finally {
      setLoading(false);
    }
  };

  const addPatientByNumber = async (destination: string) => {
    setLoading(true);
    try {
      await addPatientByNumberSync(destination);
      toast.success('Senha adicionada com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar senha');
    } finally {
      setLoading(false);
    }
  };

  const callPatient = async (patient: Patient) => {
    setLoading(true);
    try {
      const destination = patient.destination || profile?.default_destination || options.defaultDestination || 'Consultório';
      
      // Chama o paciente (atualiza status no banco)
      await callPatientSync(patient.id, destination);
      
      // Anuncia por voz
      const message = `Por favor, ${patient.name}, comparecer ao ${destination}.`;
      speak(message);
      
      toast.success(`Chamando ${patient.name}`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao chamar paciente');
    } finally {
      setLoading(false);
    }
  };

  const removePatient = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este paciente?')) {
      setLoading(true);
      try {
        await removePatientSync(id);
        toast.success('Paciente removido');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao remover paciente');
      } finally {
        setLoading(false);
      }
    }
  };

  const clearQueue = async () => {
    if (confirm('Tem certeza que deseja limpar toda a fila?')) {
      setLoading(true);
      try {
        await clearQueueSync();
        toast.success('Fila limpa com sucesso');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao limpar fila');
      } finally {
        setLoading(false);
      }
    }
  };

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    try {
      await updatePatientSync(id, data);
      toast.success('Paciente atualizado');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar paciente');
    }
  };

  const updatePatientStatus = async (id: string, status: Patient['status']) => {
    try {
      await updatePatientSync(id, { status });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status');
    }
  };

  const updatePatientDestination = async (id: string, destination: string) => {
    try {
      await updatePatientSync(id, { destination });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar destino');
    }
  };

  return {
    patients,
    waitingPatients,
    calledPatients,
    loading,
    isAddingPatient: loading,
    addPatient: addPatientByName,
    addPatientByName,
    addPatientByNumber,
    callPatient,
    removePatient,
    clearQueue,
    updatePatient,
    updatePatientStatus,
    updatePatientDestination,
    searchTerm,
    setSearchTerm,
    selectedDestination,
    setSelectedDestination
  };
}
