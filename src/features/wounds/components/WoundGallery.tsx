import React, { useMemo, useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { WoundPhoto } from '../types';
import WoundPhotoMetadataCard from './WoundPhotoMetadataCard';

interface WoundGalleryProps {
  photos: WoundPhoto[];
  onDeletePhoto: (photoId: string) => void;
}

const WoundGallery: React.FC<WoundGalleryProps> = ({ photos, onDeletePhoto }) => {
  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()),
    [photos],
  );

  const [activePhotoId, setActivePhotoId] = useState<string | null>(orderedPhotos[0]?.id ?? null);

  const activePhoto = orderedPhotos.find((photo) => photo.id === activePhotoId) ?? orderedPhotos[0] ?? null;

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-foreground">Galeria de fotos</h3>

      {activePhoto ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
            {activePhoto.signed_url ? (
              <img
                src={activePhoto.signed_url}
                alt={activePhoto.description || 'Foto da ferida'}
                className="h-72 w-full object-contain"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Imagem indisponível
              </div>
            )}
          </div>

          <WoundPhotoMetadataCard key={activePhoto.id} photo={activePhoto} />

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{new Date(activePhoto.captured_at).toLocaleString('pt-BR')}</span>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                if (window.confirm('Deseja remover esta foto?')) {
                  onDeletePhoto(activePhoto.id);
                }
              }}
            >
              Deletar foto
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
          Nenhuma foto cadastrada para esta ferida.
        </p>
      )}

      {orderedPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {orderedPhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className={`shrink-0 overflow-hidden rounded-lg border ${
                activePhoto?.id === photo.id ? 'border-primary' : 'border-border'
              }`}
              onClick={() => setActivePhotoId(photo.id)}
            >
              {photo.signed_url ? (
                <img src={photo.signed_url} alt={photo.description || photo.id} className="h-20 w-24 object-cover" />
              ) : (
                <div className="flex h-20 w-24 items-center justify-center text-xs text-muted-foreground">Sem URL</div>
              )}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default WoundGallery;
