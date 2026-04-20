import React from 'react';
import { Badge, Button, Tooltip } from '@/components/ui';
import { RefreshCw, Wifi, WifiOff, CloudUpload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WoundSyncIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  onSyncNow: () => void;
  className?: string;
}

const WoundSyncIndicator: React.FC<WoundSyncIndicatorProps> = ({
  isOnline,
  isSyncing,
  pendingCount,
  conflictCount,
  onSyncNow,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-1.5 p-1 rounded-full border border-border bg-background shadow-sm min-w-fit h-9", className)}>
      {/* Status de Conexão */}
      <div className={cn(
        "flex items-center gap-1.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider h-7",
        isOnline ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
      )}>
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span className="hidden sm:inline">{isOnline ? 'Conectado' : 'Offline'}</span>
      </div>

      {/* Pendências e Conflitos */}
      {pendingCount > 0 && (
        <Badge variant="warning" className="gap-1 h-7 px-2 border-none bg-amber-500/10 text-amber-600 flex items-center">
          <CloudUpload className="h-3 w-3" />
          <span className="text-[10px]">{pendingCount}</span>
        </Badge>
      )}

      {conflictCount > 0 && (
        <Badge variant="destructive" className="gap-1 h-7 px-2 border-none bg-rose-500/10 text-rose-600 flex items-center">
          <AlertCircle className="h-3 w-3" />
          <span className="text-[10px]">{conflictCount}</span>
        </Badge>
      )}

      {/* Botão de Sync / Reconectar */}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={onSyncNow}
        disabled={isSyncing}
        className={cn(
          "h-7 rounded-full px-4 text-[10px] font-black uppercase tracking-widest transition-all",
          isOnline ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20" : "bg-muted text-muted-foreground"
        )}
      >
        <RefreshCw className={cn("h-3 w-3 mr-1.5", isSyncing && "animate-spin")} />
        <span className="whitespace-nowrap">
          {isSyncing ? 'Sinc.' : (isOnline ? 'Sincronizar' : 'Reconectar')}
        </span>
      </Button>
    </div>
  );
};

export default WoundSyncIndicator;
