import React, { useMemo, useState } from 'react';
import { Badge, Card, Modal, Button } from '@/components/ui';
import type { WoundEntry, WoundPhoto } from '../types';
import { buildTimelineAlerts } from '../utils/woundAlertRules';
import { TrendingDown, TrendingUp, Minus, Activity, Calendar, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { motion } from 'framer-motion';
import WoundPhotoMetadataCard from './WoundPhotoMetadataCard';

interface WoundTimelineProps {
  entries: WoundEntry[];
  photos: WoundPhoto[];
}

const WoundTimeline: React.FC<WoundTimelineProps> = ({ entries, photos }) => {
  const [selectedPhotos, setSelectedPhotos] = useState<WoundPhoto[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const activePhoto = selectedPhotos?.[currentPhotoIndex] ?? null;

  const alerts = useMemo(() => buildTimelineAlerts(entries), [entries]);

  const getProfessionalName = (entry: WoundEntry): string => {
    const profileName = entry.profiles?.full_name?.trim();
    return profileName || 'Profissional sem nome cadastrado';
  };

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
    <div className="space-y-6 pt-2 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
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

      <div className="space-y-4 pr-2 p-1">
        {timelineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/20 mb-4 border border-dashed border-border">
              <Calendar className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Ainda não há registros de evolução</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineItems.map((item, index) => (
              <motion.article 
                key={item.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group rounded-3xl border border-border/40 bg-background/50 backdrop-blur-sm p-4 transition-all hover:border-primary/40 hover:bg-background/80 hover:shadow-lg"
              >
                <div className="flex gap-4">
                  {/* Evolution Thumbnails - Premium High Visibility */}
                  <div className="flex-shrink-0">
                    {item.photos.length > 0 ? (
                      <button 
                        onClick={() => handleOpenGallery(item.photos)}
                        className="relative block group/photo outline-none"
                      >
                        <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/5 blur-md" />
                        <img 
                          src={item.photos[0].signed_url || item.photos[0].storage_path} 
                          alt="Evolução"
                          className="relative z-10 h-16 w-16 rounded-2xl object-cover border-2 border-background shadow-xl group-hover/photo:scale-110 transition-all duration-300" 
                          decoding="async"
                        />
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-primary/20 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        {item.photos.length > 1 && (
                          <div className="absolute -bottom-1 -right-1 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground border-2 border-background shadow-lg">
                            +{item.photos.length - 1}
                          </div>
                        )}
                      </button>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20 border border-dashed border-border/50 text-muted-foreground/20">
                        <Minus className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Entry Content */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-foreground tracking-tight">
                          {new Date(item.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          <span className="ml-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/30 px-1.5 py-0.5 rounded">
                            {new Date(item.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary/30" />
                          Profissional: {getProfessionalName(item)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {item.trend === 'improvement' && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 text-[9px] font-black uppercase tracking-tighter px-2 py-0 h-5">
                            <TrendingDown className="h-2.5 w-2.5" /> Melhora
                          </Badge>
                        )}
                        {item.trend === 'worsening' && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[9px] font-black uppercase tracking-tighter px-2 py-0 h-5 animate-pulse">
                            <TrendingUp className="h-2.5 w-2.5" /> Piora
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-5 bg-background/60">Dor: {item.pain_scale ?? '-'}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 rounded-full bg-background border border-border/50 px-2 py-0.5 h-6">
                        <span className="text-[10px] font-black text-foreground">
                          {item.measure_length_cm ?? '-'}×{item.measure_width_cm ?? '-'}×{item.measure_depth_cm ?? '-'} <span className="text-[8px] text-muted-foreground">cm</span>
                        </span>
                      </div>
                      {item.exudate && item.exudate !== 'ausente' && (
                        <div className="flex items-center rounded-full bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 h-6">
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Exsudato</span>
                        </div>
                      )}
                      {item.dressing_type && (
                        <div className="flex items-center rounded-full bg-primary/5 border border-primary/10 px-2 py-0.5 h-6">
                          <span className="text-[9px] font-bold text-primary/70 truncate max-w-[100px]">{item.dressing_type}</span>
                        </div>
                      )}
                    </div>

                    {item.observations && (
                      <div className="relative pl-3 border-l-2 border-primary/20">
                         <p className="text-xs text-muted-foreground/80 font-medium italic leading-relaxed line-clamp-2">
                          "{item.observations}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={!!selectedPhotos}
        onClose={handleCloseGallery}
        panelClassName="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-4 sm:max-h-[90vh] sm:p-5"
      >
        <div className="relative flex flex-col gap-4">
          {selectedPhotos && selectedPhotos.length > 0 && activePhoto && (
            <>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Visualização da Evolução</h4>
                <Badge variant="secondary" className="font-bold">
                  {currentPhotoIndex + 1} / {selectedPhotos.length}
                </Badge>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-muted/20 border-2 border-border/20 shadow-xl">
                <img 
                  src={activePhoto.signed_url || activePhoto.storage_path} 
                  alt={`Evolução ${currentPhotoIndex + 1}`}
                  className="mx-auto max-h-[60vh] w-full object-contain p-2"
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
              </div>

              <WoundPhotoMetadataCard key={activePhoto.id} photo={activePhoto} />

              {activePhoto.description && (
                <div className="rounded-xl bg-muted/10 p-3 text-sm text-muted-foreground border border-border/40">
                  {activePhoto.description}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseGallery}>Fechar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default WoundTimeline;
