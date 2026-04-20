import React from 'react';
import { motion } from 'framer-motion';
import { FolderHeart, Search, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui';

interface WoundEmptyStateProps {
  type: 'patient' | 'wound' | 'selection';
  onAction?: () => void;
}

export const WoundEmptyState: React.FC<WoundEmptyStateProps> = ({ type, onAction }) => {
  const config = {
    patient: {
      icon: <UserPlus className="h-10 w-10 text-primary/40" />,
      title: "Nenhum paciente selecionado",
      description: "Selecione um paciente na lista à esquerda para começar a gerenciar suas feridas e o histórico clínico.",
      actionLabel: "Ver pacientes"
    },
    wound: {
      icon: <FolderHeart className="h-10 w-10 text-primary/40" />,
      title: "Selecione uma ferida",
      description: "Este paciente possui registros, mas nenhuma ferida foi selecionada para visualização detalhada.",
      actionLabel: "Selecione uma ferida"
    },
    selection: {
      icon: <Search className="h-10 w-10 text-primary/40" />,
      title: "Comece por aqui",
      description: "Busque um paciente pelo nome ou CPF para visualizar e cadastrar evoluções de feridas.",
    }
  };

  const current = config[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-3xl border border-dashed border-border/60 bg-muted/5 min-h-[300px]"
    >
      <div className="relative">
        <div className="absolute inset-0 animate-pulse bg-primary/5 blur-2xl rounded-full" />
        <div className="relative z-10 p-4 rounded-2xl bg-background border border-border shadow-sm">
          {current.icon}
        </div>
      </div>
      
      <div className="max-w-[280px] space-y-1.5">
        <h3 className="font-black text-foreground uppercase tracking-tight">{current.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {current.description}
        </p>
      </div>

      {onAction && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onAction}
          className="group text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
        >
          {current.actionLabel}
          <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      )}
    </motion.div>
  );
};

export default WoundEmptyState;
