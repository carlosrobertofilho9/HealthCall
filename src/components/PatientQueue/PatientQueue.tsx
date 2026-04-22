import React from 'react';
import PatientCard from './PatientCard';
import type { Patient, PatientStatus } from '@/types';
import { DESTINATION_ROOMS } from '@/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from '@/components/ui';
import { ClipboardList, Filter, ListFilter, Search, Users } from 'lucide-react';
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
      className={`touch-manipulation ${!isDragging ? 'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards' : ''}`}
      // style={{ animationDelay: `${index * 50}ms` }} // Removed static index delay to prevent weirdness during drag
    >
      <PatientCard
        patient={patient}
        position={position}
        dragHandleProps={{ ...attributes, ...listeners }}
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

  const isFiltered = searchTerm !== '' || (selectedDestination !== '' && selectedDestination !== 'all');

  return (
    <section className="flex min-h-[520px] flex-col rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(0,27,61,0.08)] xl:h-full xl:min-h-0">
      <div className="shrink-0 border-b border-[#E5ECF3] p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#1466F5]">
                <Users className="size-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold tracking-normal text-[#001B3D]">Fila de espera</h2>
                <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">
                  {isFiltered
                    ? 'Visualização filtrada com reordenação pausada.'
                    : 'Prioridade, chamada e encaminhamento em tempo real.'}
                </p>
              </div>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#CFEDE6] bg-[#E6F7F2] px-3 py-2 text-sm font-extrabold text-[#007A65]">
            <ListFilter className="size-4" />
            {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}
          </div>
        </div>
        
        <div className="grid w-full gap-3 md:grid-cols-[1fr_minmax(210px,0.7fr)]">
          <div className="relative min-w-0">
            <Input
              id="search-patient"
              placeholder="Pesquisar paciente..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="size-4 text-[#1466F5]" />}
              className="h-12 rounded-2xl border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#00BB94] focus:bg-white focus:ring-[#00BB94]/20"
            />
          </div>
          
          <div className="relative min-w-0">
            <Select onValueChange={(value) => setSelectedDestination(value === 'all' ? '' : value)} value={selectedDestination || 'all'}>
              <SelectTrigger
                id="filter-destination-room"
                icon={<Filter className="size-4 text-[#00A885]" />}
                className="h-12 rounded-2xl border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:border-[#00BB94] focus:bg-white focus:ring-[#00BB94]/20"
              >
                <SelectValue placeholder="Todas as Salas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">Todas as Salas</SelectItem>
                {DESTINATION_ROOMS.map(room => (
                  <SelectItem key={room} value={room} className="cursor-pointer">{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4 lg:px-5">
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
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-[#E6F7F2] text-[#00A885]">
               <ClipboardList className="size-8" />
            </div>
            <h3 className="mb-1 text-xl font-extrabold text-[#001B3D]">A fila está vazia</h3>
            <p className="max-w-sm text-sm font-medium leading-6 text-[#64748B]">Nenhum paciente encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PatientQueue;
