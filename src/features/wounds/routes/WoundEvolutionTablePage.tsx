import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import WoundEvolutionTable from '../components/WoundEvolutionTable';
import { useWounds } from '../hooks/useWounds';

const WoundEvolutionTablePage: React.FC = () => {
  const { woundId } = useParams<{ woundId: string }>();
  const navigate = useNavigate();
  const {
    entries,
    patients,
    selectedWound,
    loading,
    error,
    setSelectedWoundId,
  } = useWounds();

  useEffect(() => {
    if (!woundId) return;
    setSelectedWoundId(woundId);
  }, [setSelectedWoundId, woundId]);

  const selectedPatient = useMemo(() => {
    if (!selectedWound) return null;
    return patients.find((patient) => patient.id === selectedWound.patient_id) ?? null;
  }, [patients, selectedWound]);

  if (!woundId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-destructive">ID da ferida não fornecido.</p>
        <Button onClick={() => navigate('/wounds')}>Voltar para Curativos</Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full lg:overflow-y-auto">
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wounds')} className="-ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tabela de Evolução</h1>
          <p className="text-sm text-muted-foreground">
            Visualização completa para evolução clínica com rolagem horizontal no mobile.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <WoundEvolutionTable
        entries={entries}
        mode="page"
        patient={selectedPatient}
        wound={selectedWound}
      />

      {loading && <p className="text-xs text-muted-foreground">Carregando dados de curativos...</p>}
    </div>
  );
};

export default WoundEvolutionTablePage;
