import React from 'react';
import { Button } from '@/components/ui/Button';
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
		<div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl h-fit mt-8">
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
