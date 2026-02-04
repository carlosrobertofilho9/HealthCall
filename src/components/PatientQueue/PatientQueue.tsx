import React from 'react';
import PatientCard from './PatientCard';
import type { Patient, PatientStatus } from '@/types';
import { DESTINATION_ROOMS } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from '@/components/ui/Input';
import { Search, Filter, Users, ClipboardList, Printer } from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { printPatientList } from './printUtils';

interface PatientQueueProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onCall: (id: string, destination: string) => void;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onRemove: (patient: Patient) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDestination: string;
  setSelectedDestination: (destination: string) => void;
  onUpdateDestination: (id: string, destination: string) => void;
  onReorder?: (patients: Patient[]) => void;
}

// Wrapper component for sortable functionality
const SortablePatientItem = ({ 
  patient, 
  position,
  index,
  onEdit, 
  onCall, 
  onUpdateStatus, 
  onUpdateDestination, 
  onRemove 
}: {
  patient: Patient;
  position: number;
  index: number;
  onEdit: (patient: Patient) => void;
  onCall: (id: string, destination: string) => void;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdateDestination: (id: string, destination: string) => void;
  onRemove: (patient: Patient) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: patient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.3 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`touch-manipulation mb-3 ${!isDragging ? 'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards' : ''}`}
      // style={{ animationDelay: `${index * 50}ms` }} // Removed static index delay to prevent weirdness during drag
    >
      <PatientCard
        patient={patient}
        position={position}
        onEdit={onEdit}
        onCall={onCall}
        onUpdateStatus={onUpdateStatus}
        onUpdateDestination={onUpdateDestination}
        onRemove={() => onRemove(patient)}
      />
    </div>
  );
};

const PatientQueue: React.FC<PatientQueueProps> = ({
  patients,
  onEdit,
  onCall,
  onUpdateStatus,
  onRemove,
  searchTerm,
  setSearchTerm,
  selectedDestination,
  setSelectedDestination,
  onUpdateDestination,
  onReorder
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Mouse drag only starts after 8px movement, allowing clicks
      },
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250, // Mobile users must hold 250ms to drag, distinguishing from tap/scroll
            tolerance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && onReorder) {
      const oldIndex = patients.findIndex((p) => p.id === active.id);
      const newIndex = patients.findIndex((p) => p.id === over?.id);
      
      onReorder(arrayMove(patients, oldIndex, newIndex));
    }
  };

  const handlePrint = () => {
    printPatientList(patients);
  };

  const isFiltered = searchTerm !== '' || (selectedDestination !== '' && selectedDestination !== 'all');

  return (
    <div className="lg:col-span-2 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl border border-white/5">
      <div className="flex flex-col gap-6 mb-8 pb-6 border-b border-white/5">
        <div className="space-y-2 text-left">
          <h2 className="text-white text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#264532] rounded-lg border border-white/5 shadow-inner">
               <Users className="text-[#96c5a9]" size={24} />
            </div>
            Fila de Espera
          </h2>
          <p className="text-[#96c5a9]/80 text-sm max-w-full leading-relaxed pl-1">
             {isFiltered 
                ? 'Visualização filtrada. A reordenação manual está desativada.' 
                : 'Gerencie a fila de atendimento. Arraste os cards para reordenar a prioridade.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full items-stretch sm:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96c5a9] transition-colors group-focus-within:text-white" size={18} />
            <Input
              id="search-patient"
              placeholder="Pesquisar paciente..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#264532]/50 border-white/5 text-white placeholder:text-[#96c5a9]/50 focus:bg-[#264532] focus:border-[#96c5a9]/50 focus:ring-[#96c5a9]/20 transition-all h-11 rounded-xl w-full"
            />
          </div>
          
          <div className="relative flex-1">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Filter className="text-[#96c5a9]" size={18} />
             </div>
            <Select onValueChange={(value) => setSelectedDestination(value === 'all' ? '' : value)} value={selectedDestination || 'all'}>
              <SelectTrigger id="filter-destination-room" className="pl-10 h-11 bg-[#264532]/50 border-white/5 text-white focus:bg-[#264532] focus:ring-[#96c5a9]/20 focus:border-[#96c5a9]/50 rounded-xl w-full">
                <SelectValue placeholder="Todas as Salas" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2c22] border-[#264532] text-white">
                <SelectItem value="all" className="focus:bg-[#264532] focus:text-white cursor-pointer hover:bg-[#264532]/50">Todas as Salas</SelectItem>
                {DESTINATION_ROOMS.map(room => (
                  <SelectItem key={room} value={room} className="focus:bg-[#264532] focus:text-white cursor-pointer hover:bg-[#264532]/50">{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handlePrint}
            className="h-11 w-11 flex items-center justify-center bg-[#264532]/50 hover:bg-[#264532] text-[#96c5a9] hover:text-white border border-white/5 hover:border-[#96c5a9]/30 transition-all rounded-xl shadow-sm"
            title="Imprimir lista"
            aria-label="Imprimir lista"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className={`space-y-0 pr-1 ${patients.length > 4 ? 'max-h-[calc(100vh-22rem)] overflow-y-auto custom-scrollbar' : ''}`}>
        {patients.length > 0 ? (
           <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
           >
             <SortableContext 
                items={patients.map(p => p.id)}
                strategy={verticalListSortingStrategy}
                disabled={isFiltered} // Disable reordering when filtered
             >
              {patients.map((patient, index) => (
                <SortablePatientItem
                    key={patient.id}
                    patient={patient}
                    position={index + 1}
                    index={index}
                    onEdit={onEdit}
                    onCall={onCall}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateDestination={onUpdateDestination}
                    onRemove={onRemove}
                />
              ))}
            </SortableContext>
           </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-[#96c5a9] bg-[#264532]/20 rounded-xl border border-dashed border-[#264532]">
            <div className="bg-[#264532] p-4 rounded-full mb-4">
               <ClipboardList size={32} className="opacity-80" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">A fila está vazia</h3>
            <p className="text-sm opacity-80">Nenhum paciente encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;
