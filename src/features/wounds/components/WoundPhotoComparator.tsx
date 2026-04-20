import React, { useMemo, useState } from 'react';
import { Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { WoundPhoto } from '../types';

interface WoundPhotoComparatorProps {
  photos: WoundPhoto[];
}

const WoundPhotoComparator: React.FC<WoundPhotoComparatorProps> = ({ photos }) => {
  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()),
    [photos],
  );

  const [beforeId, setBeforeId] = useState(orderedPhotos[0]?.id ?? '');
  const [afterId, setAfterId] = useState(orderedPhotos[orderedPhotos.length - 1]?.id ?? '');
  const [slider, setSlider] = useState(50);

  const beforePhoto = orderedPhotos.find((photo) => photo.id === beforeId) ?? null;
  const afterPhoto = orderedPhotos.find((photo) => photo.id === afterId) ?? null;

  if (orderedPhotos.length < 2) {
    return (
      <Card className="space-y-2 p-4">
        <h3 className="text-sm font-semibold text-foreground">Comparador de fotos</h3>
        <p className="text-sm text-muted-foreground">Adicione pelo menos 2 fotos para comparar antes/depois.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-foreground">Comparador de fotos (antes/depois)</h3>

      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={beforeId} onValueChange={setBeforeId}>
          <SelectTrigger>
            <SelectValue placeholder="Foto antes" />
          </SelectTrigger>
          <SelectContent>
            {orderedPhotos.map((photo) => (
              <SelectItem key={photo.id} value={photo.id}>
                Antes - {new Date(photo.captured_at).toLocaleDateString('pt-BR')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={afterId} onValueChange={setAfterId}>
          <SelectTrigger>
            <SelectValue placeholder="Foto depois" />
          </SelectTrigger>
          <SelectContent>
            {orderedPhotos.map((photo) => (
              <SelectItem key={photo.id} value={photo.id}>
                Depois - {new Date(photo.captured_at).toLocaleDateString('pt-BR')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {beforePhoto?.signed_url && afterPhoto?.signed_url ? (
        <div className="space-y-2">
          <div className="relative h-72 overflow-hidden rounded-xl border border-border bg-muted/30">
            <img src={beforePhoto.signed_url} alt="Antes" className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${slider}%` }}>
              <img src={afterPhoto.signed_url} alt="Depois" className="h-full w-full object-contain" />
            </div>
            <div
              className="absolute top-0 h-full w-0.5 bg-primary"
              style={{ left: `${slider}%` }}
              aria-hidden="true"
            />
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(event) => setSlider(Number(event.target.value))}
            className="w-full"
            aria-label="Slider de comparação"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Antes: {new Date(beforePhoto.captured_at).toLocaleString('pt-BR')}</span>
            <span>Depois: {new Date(afterPhoto.captured_at).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Selecione duas fotos válidas para comparação.</p>
      )}
    </Card>
  );
};

export default WoundPhotoComparator;
