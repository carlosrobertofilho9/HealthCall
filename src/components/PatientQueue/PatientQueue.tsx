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
  Button
} from '@/components/ui';
import { Filter, Users, ClipboardList, Printer, Search } from 'lucide-react';
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
    <div className="lg:col-span-2 bg-card rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex flex-col gap-6 mb-8 pb-6 border-b border-border">
        <div className="space-y-2 text-left">
          <h2 className="text-card-foreground text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg border border-border shadow-inner">
               <Users className="text-muted-foreground" size={24} />
            </div>
            Fila de Espera
          </h2>
          <p className="text-muted-foreground text-sm max-w-full leading-relaxed pl-1">
             {isFiltered 
                ? 'Visualização filtrada. A reordenação manual está desativada.' 
                : 'Gerencie a fila de atendimento. Arraste os cards para reordenar a prioridade.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full items-stretch sm:items-center">
          <div className="relative flex-1 group">
            <Input
              id="search-patient"
              placeholder="Pesquisar paciente..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="bg-input/80 border-border text-foreground placeholder:text-muted-foreground focus:bg-input focus:border-ring/50 focus:ring-ring/20 transition-all h-11 rounded-xl w-full"
            />
          </div>
          
          <div className="relative flex-1">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Filter className="text-muted-foreground" size={18} />
             </div>
            <Select onValueChange={(value) => setSelectedDestination(value === 'all' ? '' : value)} value={selectedDestination || 'all'}>
              <SelectTrigger id="filter-destination-room" className="pl-10 h-11 rounded-xl w-full bg-input/80 border-border focus:bg-input focus:ring-ring/20 focus:border-ring/50">
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

          <Button
            onClick={handlePrint}
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl bg-input/80 border-border text-muted-foreground hover:text-foreground"
            title="Imprimir lista"
            aria-label="Imprimir lista"
          >
            <Printer size={20} />
          </Button>
        </div>
      </div>

      <div className={`space-y-0 pr-1 ${patients.length > 4 ? 'lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto custom-scrollbar' : ''}`}>
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
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
            <div className="bg-secondary p-4 rounded-full mb-4">
               <ClipboardList size={32} className="opacity-80" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-1">A fila está vazia</h3>
            <p className="text-sm opacity-80">Nenhum paciente encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;
