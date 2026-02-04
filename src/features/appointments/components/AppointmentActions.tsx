import React from 'react';
import { Printer, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AppointmentActionsProps {
  hasService: boolean;
  availableSlotsCount: number;
  onAddClick: () => void;
  onPrintClick: () => void;
  onPrintReportClick: () => void;
  onRefreshClick: () => void;
  isLoading: boolean;
}

/**
 * Barra de ações da página de marcações.
 */
export const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  hasService,
  availableSlotsCount,
  onAddClick,
  onPrintClick,
  onPrintReportClick,
  onRefreshClick,
  isLoading,
}) => {
  if (!hasService) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
      <div className="flex items-center gap-3">
        <Button
          onClick={onAddClick}
          disabled={availableSlotsCount === 0 || isLoading}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Marcação
        </Button>

        <button
          onClick={onRefreshClick}
          disabled={isLoading}
          className="p-3 rounded-full bg-[#264532] hover:bg-[#305a3e] transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPrintReportClick()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a3a26] border border-[#264532] hover:bg-[#264532] transition-colors text-white font-semibold"
        >
          <Printer className="w-5 h-5" />
          Imprimir Relatório
        </button>

        <button
          onClick={() => onPrintClick()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#264532] hover:bg-[#305a3e] transition-colors text-white font-semibold"
        >
          <Printer className="w-5 h-5" />
          Imprimir Ficha
        </button>
      </div>
    </div>
  );
};

export default AppointmentActions;
