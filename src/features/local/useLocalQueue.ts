import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Patient, PatientStatus } from '@/types';
import { localApi } from './localApi';
import { getStationDestination, getStationIdentity } from './stationSettings';

export function useLocalQueue() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await localApi.getPatients();
      setPatients(next);
      setConnected(true);
    } catch (error) {
      setConnected(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = localApi.subscribe((event) => {
      if (event.type === 'patients-changed') refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const addPatient = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    try {
      const patient = await localApi.addPatient(trimmed, 'Fila geral');
      await refresh();
      toast.success(`${patient.name} adicionado(a) à fila.`);
      return patient;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível adicionar o paciente.');
      return null;
    }
  }, [refresh]);

  const addTicket = useCallback(async () => {
    try {
      const patient = await localApi.addPatientByNumber('Fila geral');
      await refresh();
      toast.success(`${patient.name} adicionada à fila.`);
      return patient;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a ficha.');
      return null;
    }
  }, [refresh]);

  const callPatient = useCallback(async (id: string) => {
    const destination = getStationDestination();
    if (!destination) {
      toast.error('Configure o número da sala antes de chamar pacientes.');
      return null;
    }
    try {
      const patient = await localApi.callPatient(id, destination, getStationIdentity());
      await refresh();
      toast.success(`${patient.name} chamado(a) para ${destination}.`);
      return patient;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível realizar a chamada.');
      return null;
    }
  }, [refresh]);

  const setStatus = useCallback(async (patient: Patient, status: PatientStatus) => {
    try {
      await localApi.updatePatient({ ...patient, status });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar o status.');
    }
  }, [refresh]);

  const removePatient = useCallback(async (id: string) => {
    try {
      await localApi.removePatient(id);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover o paciente.');
    }
  }, [refresh]);

  const clearQueue = useCallback(async () => {
    try {
      await localApi.clearQueue();
      await refresh();
      toast.success('Fila e histórico do dia foram limpos.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível limpar a fila.');
    }
  }, [refresh]);

  const move = useCallback(async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= patients.length) return;
    const next = [...patients];
    [next[index], next[target]] = [next[target], next[index]];
    setPatients(next);
    try {
      await localApi.reorderQueue(next.map((patient, position) => ({ id: patient.id, queue_order: position + 1 })));
    } catch (error) {
      await refresh();
      toast.error(error instanceof Error ? error.message : 'Não foi possível reordenar a fila.');
    }
  }, [patients, refresh]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return patients;
    return patients.filter((patient) => patient.name.toLocaleLowerCase('pt-BR').includes(term));
  }, [patients, search]);

  return {
    patients,
    filteredPatients,
    loading,
    connected,
    search,
    setSearch,
    addPatient,
    addTicket,
    callPatient,
    setStatus,
    removePatient,
    clearQueue,
    move,
    refresh,
  };
}
