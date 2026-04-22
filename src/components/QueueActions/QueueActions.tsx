import React from 'react';
import { Button } from '@/components/ui';
import { FilePlus2, Loader2, Trash2 } from 'lucide-react';

interface QueueActionsProps {
	onClearQueue: () => void;
	onAddPatientByNumber: () => void;
	isAddingPatient: boolean;
}

/**
 * Um componente que contém botões de ação para gerenciar a fila de pacientes.
 *
 * Este componente fornece ações globais que afetam a fila como um todo, como
 * "Adicionar Ficha" e "Limpar Fila".
 *
 * @param {QueueActionsProps} props As propriedades do componente.
 * @param {() => void} props.onClearQueue Callback acionado para limpar toda a fila.
 * @param {() => void} props.onAddPatientByNumber Callback acionado para adicionar um paciente por ficha.
 * @param {boolean} props.isAddingPatient Flag que indica se um paciente está sendo adicionado.
 */
const QueueActions: React.FC<QueueActionsProps> = ({ onClearQueue, onAddPatientByNumber, isAddingPatient }) => {
	return (
		<section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_20px_55px_rgba(0,27,61,0.07)]">
			<div className="mb-5">
				<h2 className="text-lg font-extrabold text-[#001B3D]">Ações da fila</h2>
				<p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">Operações rápidas para o fluxo de hoje.</p>
			</div>
			<div className="space-y-3">
				<Button
					onClick={onAddPatientByNumber}
					className="h-12 w-full rounded-2xl border border-[#CFEDE6] bg-[#E6F7F2] text-sm font-extrabold text-[#007A65] shadow-none hover:bg-[#D8F2EB]"
					disabled={isAddingPatient}
				>
					{isAddingPatient ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
					Adicionar Ficha
				</Button>
				<Button
					variant="ghost"
					onClick={onClearQueue}
					className="h-12 w-full rounded-2xl border border-[#F3D6D8] bg-[#FFF7F7] text-sm font-extrabold text-[#B4232D] hover:bg-[#FFECEC] hover:text-[#8F1B24]"
				>
					<Trash2 className="size-4" />
					Limpar Fila
				</Button>
			</div>
		</section>
	);
};

export default QueueActions;
