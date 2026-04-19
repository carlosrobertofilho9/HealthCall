import React from 'react';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';

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
		<div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-fit xl:rounded-none xl:border-0 xl:shadow-none xl:bg-transparent">
			<div className="space-y-6">
				<Button onClick={onAddPatientByNumber} className="w-full" disabled={isAddingPatient}>
					{isAddingPatient ? <Loader2 className="animate-spin" /> : 'Adicionar Ficha'}
				</Button>
				<Button variant="destructive" onClick={onClearQueue} className="w-full">
					Limpar Fila
				</Button>
			</div>
		</div>
	);
};

export default QueueActions;
