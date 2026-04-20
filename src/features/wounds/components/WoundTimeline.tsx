import React, { useMemo, useState } from 'react';
import { Badge, Card, Modal, Button } from '@/components/ui';
import type { WoundEntry, WoundPhoto } from '../types';
import { buildTimelineAlerts } from '../utils/woundAlertRules';
import { TrendingDown, TrendingUp, Minus, Activity, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WoundTimelineProps {
  entries: WoundEntry[];
  photos: WoundPhoto[];
}

const WoundTimeline: React.FC<WoundTimelineProps> = ({ entries, photos }) => {
  const [selectedPhotos, setSelectedPhotos] = useState<WoundPhoto[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const alerts = useMemo(() => buildTimelineAlerts(entries), [entries]);

  const timelineItems = useMemo(() => {
    // Sort ascending to calculate indicators properly
    const chronological = [...entries].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    return chronological.map((entry, index) => {
      const prevEntry = index > 0 ? chronological[index - 1] : null;
      const entryPhotos = photos.filter((p) => p.entry_id === entry.id);

      const currentArea = (entry.measure_length_cm ?? 0) * (entry.measure_width_cm ?? 0);
      const prevArea = prevEntry ? (prevEntry.measure_length_cm ?? 0) * (prevEntry.measure_width_cm ?? 0) : 0;

      let trend: 'improvement' | 'worsening' | 'stable' | null = null;
      if (prevArea > 0 && currentArea > 0) {
        if (currentArea < prevArea) trend = 'improvement';
        else if (currentArea > prevArea) trend = 'worsening';
        else trend = 'stable';
      }

      return {
        ...entry,
        photos: entryPhotos,
        trend,
        prevArea,
        currentArea,
      };
    }).reverse(); // Reverse for display (newest first)
  }, [entries, photos]);

  const handleOpenGallery = (itemPhotos: WoundPhoto[]) => {
    setSelectedPhotos(itemPhotos);
    setCurrentPhotoIndex(0);
  };

  const handleCloseGallery = () => {
    setSelectedPhotos(null);
  };

  const nextPhoto = () => {
    if (!selectedPhotos) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % selectedPhotos.length);
  };

  const prevPhoto = () => {
    if (!selectedPhotos) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + selectedPhotos.length) % selectedPhotos.length);
  };

  return (
    <Card className="space-y-4 p-5 bg-card/50 backdrop-blur-sm border-border/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Timeline de evolução</h3>
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
          {entries.length} Registros
        </Badge>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5">
          <div className="flex items-center gap-1.5 text-destructive">
            <TrendingUp className="h-3.5 w-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Alertas de piora registrados</p>
          </div>
          <ul className="space-y-1 text-xs text-destructive/90">
            {alerts.slice(0, 3).map((alert) => (
              <li key={`${alert.currentEntryId}-${alert.type}`} className="flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-destructive" />
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {timelineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">Ainda não há registros de evolução.</p>
          </div>
        ) : (
          timelineItems.map((item) => (
            <article 
              key={item.id} 
              className="relative group rounded-2xl border border-border/40 bg-background/40 p-4 transition-all hover:border-primary/30 hover:bg-background/60"
            >
              <div className="flex gap-4">
                {/* Evolution Thumbnails */}
                <div className="flex-shrink-0 pt-1">
                  {item.photos.length > 0 ? (
                    <button 
                      onClick={() => handleOpenGallery(item.photos)}
                      className="relative block group/photo outline-none"
                    >
                      <img 
                        src={item.photos[0].signed_url || item.photos[0].storage_path} 
                        alt="Evolução"
                        className="h-12 w-12 rounded-2xl object-cover border-2 border-background shadow-md group-hover/photo:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      {item.photos.length > 1 && (
                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background shadow-sm">
                          +{item.photos.length - 1}
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/50 text-muted-foreground/40">
                      <Minus className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Entry Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {new Date(item.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                        Por: {item.profiles?.full_name?.split(' ')[0] || item.professional_id.slice(0, 8)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {item.trend === 'improvement' && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 text-[10px] px-1.5 py-0">
                          <TrendingDown className="h-3 w-3" /> Melhora
                        </Badge>
                      )}
                      {item.trend === 'worsening' && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px] px-1.5 py-0">
                          <TrendingUp className="h-3 w-3" /> Piora
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Dor: {item.pain_scale ?? '-'}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[11px] font-medium bg-background">
                      {item.measure_length_cm ?? '-'}x{item.measure_width_cm ?? '-'}x{item.measure_depth_cm ?? '-'} cm
                    </Badge>
                    {item.exudate && item.exudate !== 'ausente' && (
                      <Badge variant="outline" className="text-[11px] border-amber-500/20 text-amber-500/80">Exsudato</Badge>
                    )}
                    {item.dressing_type && (
                      <Badge variant="secondary" className="text-[10px] text-primary/80 bg-primary/5">{item.dressing_type}</Badge>
                    )}
                  </div>

                  {item.observations && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                      "{item.observations}"
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={!!selectedPhotos}
        onClose={handleCloseGallery}
        title="Visualização da Evolução"
        maxWidth="max-w-2xl"
      >
        <div className="relative flex flex-col gap-4">
          {selectedPhotos && selectedPhotos.length > 0 && (
            <>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/20 border-2 border-border/20 shadow-xl">
                <img 
                  src={selectedPhotos[currentPhotoIndex].signed_url || selectedPhotos[currentPhotoIndex].storage_path} 
                  alt={`Evolução ${currentPhotoIndex + 1}`}
                  className="h-full w-full object-contain p-2"
                />
                
                {selectedPhotos.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between">
                    <Button 
                      variant="glass" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                      className="rounded-full shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="glass" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                      className="rounded-full shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Badge variant="glass" className="font-bold">
                    {currentPhotoIndex + 1} / {selectedPhotos.length}
                  </Badge>
                </div>
              </div>

              {selectedPhotos[currentPhotoIndex].description && (
                <div className="rounded-xl bg-muted/10 p-3 text-sm text-muted-foreground border border-border/40">
                  {selectedPhotos[currentPhotoIndex].description}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseGallery}>Fechar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default WoundTimeline;

