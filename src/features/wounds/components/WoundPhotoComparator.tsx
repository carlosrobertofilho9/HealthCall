import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Minus, Plus, Scan, Undo2 } from 'lucide-react';
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { WoundPhoto } from '../types';
import {
  clampComparatorViewport,
  COMPARATOR_MAX_SCALE,
  COMPARATOR_MIN_SCALE,
  DEFAULT_COMPARATOR_VIEWPORT,
  getInitialWoundPhotoPair,
  getPhotoDiffDays,
  normalizeWoundPhotoPair,
  sortWoundPhotosChronologically,
  type ComparatorViewportState,
  type WoundPhotoPair,
} from '../utils/woundPhotoComparatorUtils';

type ComparisonMode = 'split' | 'side-by-side';

interface WoundPhotoComparatorProps {
  photos: WoundPhoto[];
  onClose?: () => void;
}

interface BoundsState {
  width: number;
  height: number;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(value, 100));
}

function formatPhotoDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR');
}

function getViewportTransform(viewport: ComparatorViewportState): React.CSSProperties {
  return {
    transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
    transformOrigin: 'center center',
  };
}

const WoundPhotoComparator: React.FC<WoundPhotoComparatorProps> = ({ photos, onClose }) => {
  const orderedPhotos = useMemo(() => sortWoundPhotosChronologically(photos), [photos]);
  const [pairState, setPairState] = useState<WoundPhotoPair | null>(null);
  const [modeState, setModeState] = useState<ComparisonMode>('split');
  const [splitState, setSplitState] = useState(50);
  const [viewportState, setViewportState] = useState<ComparatorViewportState>(DEFAULT_COMPARATOR_VIEWPORT);
  const [visualOrderInverted, setVisualOrderInverted] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [boundsState, setBoundsState] = useState<BoundsState>({ width: 0, height: 0 });

  const splitViewportRef = useRef<HTMLDivElement | null>(null);
  const sideBySideViewportRef = useRef<HTMLDivElement | null>(null);
  const panningStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const canPan = viewportState.scale > COMPARATOR_MIN_SCALE;

  useEffect(() => {
    const initialPair = getInitialWoundPhotoPair(orderedPhotos);

    if (!initialPair) {
      setPairState(null);
      return;
    }

    setPairState((currentPair) => {
      if (!currentPair) return initialPair;
      const normalized = normalizeWoundPhotoPair(currentPair.beforeId, currentPair.afterId, orderedPhotos);
      return normalized ?? initialPair;
    });
  }, [orderedPhotos]);

  useEffect(() => {
    const observedElement = modeState === 'split' ? splitViewportRef.current : sideBySideViewportRef.current;
    if (!observedElement) return;

    const updateBounds = () => {
      setBoundsState({
        width: observedElement.clientWidth,
        height: observedElement.clientHeight,
      });
    };

    updateBounds();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateBounds();
    });

    observer.observe(observedElement);

    return () => observer.disconnect();
  }, [modeState]);

  const clampViewport = useCallback(
    (nextViewport: ComparatorViewportState) =>
      clampComparatorViewport(nextViewport, {
        width: boundsState.width,
        height: boundsState.height,
      }),
    [boundsState.height, boundsState.width],
  );

  useEffect(() => {
    setViewportState((currentViewport) => clampViewport(currentViewport));
  }, [clampViewport]);

  const updateViewport = useCallback(
    (
      updater:
        | ComparatorViewportState
        | ((current: ComparatorViewportState) => ComparatorViewportState),
    ) => {
      setViewportState((currentViewport) => {
        const nextViewport = typeof updater === 'function' ? updater(currentViewport) : updater;
        return clampViewport(nextViewport);
      });
    },
    [clampViewport],
  );

  const beforePhoto = useMemo(
    () => orderedPhotos.find((photo) => photo.id === pairState?.beforeId) ?? null,
    [orderedPhotos, pairState?.beforeId],
  );
  const afterPhoto = useMemo(
    () => orderedPhotos.find((photo) => photo.id === pairState?.afterId) ?? null,
    [orderedPhotos, pairState?.afterId],
  );

  const visibleBeforePhoto = visualOrderInverted ? afterPhoto : beforePhoto;
  const visibleAfterPhoto = visualOrderInverted ? beforePhoto : afterPhoto;

  const timeDiffInDays = beforePhoto && afterPhoto ? getPhotoDiffDays(beforePhoto, afterPhoto) : null;
  const viewportTransform = getViewportTransform(viewportState);

  const updatePair = useCallback(
    (beforeId: string, afterId: string) => {
      const normalized = normalizeWoundPhotoPair(beforeId, afterId, orderedPhotos);
      if (!normalized) return;
      setPairState(normalized);
    },
    [orderedPhotos],
  );

  const handleBeforeChange = useCallback(
    (beforeId: string) => {
      setPairState((currentPair) => {
        if (!currentPair) return currentPair;
        const normalized = normalizeWoundPhotoPair(beforeId, currentPair.afterId, orderedPhotos);
        return normalized ?? currentPair;
      });
    },
    [orderedPhotos],
  );

  const handleAfterChange = useCallback(
    (afterId: string) => {
      setPairState((currentPair) => {
        if (!currentPair) return currentPair;
        const normalized = normalizeWoundPhotoPair(currentPair.beforeId, afterId, orderedPhotos);
        return normalized ?? currentPair;
      });
    },
    [orderedPhotos],
  );

  const handleWheelZoom = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.15 : -0.15;
      updateViewport((current) => ({ ...current, scale: current.scale + delta }));
    },
    [updateViewport],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canPan || event.button !== 0) return;

      panningStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startOffsetX: viewportState.offsetX,
        startOffsetY: viewportState.offsetY,
      };

      setIsPanning(true);
      if (typeof event.currentTarget.setPointerCapture === 'function') {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [canPan, viewportState.offsetX, viewportState.offsetY],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const panningState = panningStateRef.current;
      if (!panningState || panningState.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - panningState.startX;
      const deltaY = event.clientY - panningState.startY;

      updateViewport({
        scale: viewportState.scale,
        offsetX: panningState.startOffsetX + deltaX,
        offsetY: panningState.startOffsetY + deltaY,
      });
    },
    [updateViewport, viewportState.scale],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const panningState = panningStateRef.current;
    if (!panningState || panningState.pointerId !== event.pointerId) return;

    panningStateRef.current = null;
    setIsPanning(false);

    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    panningStateRef.current = null;
    setIsPanning(false);
  }, []);

  const handleSplitHandlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = splitViewportRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    const nextSplit = ((event.clientX - rect.left) / rect.width) * 100;
    setSplitState(clampPercent(nextSplit));
  }, []);

  const resetPan = useCallback(() => {
    updateViewport((current) => ({
      ...current,
      offsetX: 0,
      offsetY: 0,
    }));
  }, [updateViewport]);

  const fitViewport = useCallback(() => {
    setSplitState(50);
    updateViewport(DEFAULT_COMPARATOR_VIEWPORT);
  }, [updateViewport]);

  const zoomIn = useCallback(() => {
    updateViewport((current) => ({ ...current, scale: current.scale + 0.25 }));
  }, [updateViewport]);

  const zoomOut = useCallback(() => {
    updateViewport((current) => ({ ...current, scale: current.scale - 0.25 }));
  }, [updateViewport]);

  const renderPhotoLayer = useCallback(
    (photo: WoundPhoto | null, label: 'Antes' | 'Depois') => {
      if (!photo?.signed_url) {
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 px-4 text-center text-xs text-muted-foreground">
            {label}: imagem indisponível
          </div>
        );
      }

      return (
        <img
          src={photo.signed_url}
          alt={`${label} - ${photo.description || photo.id}`}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={viewportTransform}
          draggable={false}
        />
      );
    },
    [viewportTransform],
  );

  if (orderedPhotos.length < 2) {
    return (
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Comparador de fotos evolutivas</h3>
        <p className="text-sm text-muted-foreground">Adicione pelo menos 2 fotos para comparar antes/depois.</p>
        {onClose && (
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </Card>
    );
  }

  if (!pairState || !beforePhoto || !afterPhoto) {
    return (
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Comparador de fotos evolutivas</h3>
        <p className="text-sm text-muted-foreground">
          Não foi possível montar a seleção atual. Recarregue a lista de fotos para continuar.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const initialPair = getInitialWoundPhotoPair(orderedPhotos);
              if (initialPair) {
                updatePair(initialPair.beforeId, initialPair.afterId);
              }
            }}
          >
            Recarregar seleção
          </Button>
          {onClose && (
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Comparador de fotos evolutivas</h3>
        <p className="text-xs text-muted-foreground">
          Zoom e deslocamento são sincronizados entre as duas imagens para manter o mesmo ponto clínico.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Antes
          <Select value={pairState.beforeId} onValueChange={handleBeforeChange}>
            <SelectTrigger aria-label="Selecionar foto antes">
              <SelectValue placeholder="Foto antes" />
            </SelectTrigger>
            <SelectContent>
              {orderedPhotos.map((photo) => (
                <SelectItem key={photo.id} value={photo.id}>
                  {formatPhotoDateTime(photo.captured_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Depois
          <Select value={pairState.afterId} onValueChange={handleAfterChange}>
            <SelectTrigger aria-label="Selecionar foto depois">
              <SelectValue placeholder="Foto depois" />
            </SelectTrigger>
            <SelectContent>
              {orderedPhotos.map((photo) => (
                <SelectItem key={photo.id} value={photo.id}>
                  {formatPhotoDateTime(photo.captured_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={modeState === 'split' ? 'default' : 'outline'}
          aria-pressed={modeState === 'split'}
          onClick={() => setModeState('split')}
        >
          Divisor
        </Button>
        <Button
          type="button"
          size="sm"
          variant={modeState === 'side-by-side' ? 'default' : 'outline'}
          aria-pressed={modeState === 'side-by-side'}
          onClick={() => setModeState('side-by-side')}
        >
          Lado a lado
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={zoomOut} disabled={viewportState.scale <= COMPARATOR_MIN_SCALE}>
            <Minus className="h-4 w-4" />
            Zoom -
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={zoomIn} disabled={viewportState.scale >= COMPARATOR_MAX_SCALE}>
            <Plus className="h-4 w-4" />
            Zoom +
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={resetPan}>
            <Undo2 className="h-4 w-4" />
            Reset
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={fitViewport}>
            <Scan className="h-4 w-4" />
            Ajustar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setVisualOrderInverted((current) => !current)}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Inverter lados
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Zoom: {Math.round(viewportState.scale * 100)}%</span>
        {modeState === 'split' && <span>Divisor: {Math.round(splitState)}%</span>}
      </div>

      {modeState === 'split' ? (
        <div className="space-y-3" data-testid="split-layout">
          <div
            ref={splitViewportRef}
            className={`relative h-[44vh] min-h-[320px] overflow-hidden rounded-2xl border border-border bg-muted/10 ${
              canPan ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onWheel={handleWheelZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <div className="absolute left-3 top-3 z-20 rounded-full bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              <span data-testid="split-primary-label">
                {visualOrderInverted ? 'Depois' : 'Antes'}
              </span>
            </div>
            <div className="absolute right-3 top-3 z-20 rounded-full bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              <span data-testid="split-secondary-label">
                {visualOrderInverted ? 'Antes' : 'Depois'}
              </span>
            </div>

            <div className="absolute inset-0">{renderPhotoLayer(visibleBeforePhoto, visualOrderInverted ? 'Depois' : 'Antes')}</div>
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${splitState}%` }}>
              <div className="relative h-full w-full">
                {renderPhotoLayer(visibleAfterPhoto, visualOrderInverted ? 'Antes' : 'Depois')}
              </div>
            </div>

            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-primary"
              style={{ left: `${splitState}%` }}
              aria-hidden="true"
            />

            <button
              type="button"
              aria-label="Arrastar divisor de comparação"
              className="absolute top-1/2 z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background/90 shadow-md"
              style={{ left: `${splitState}%` }}
              onPointerDown={(event) => {
                if (typeof event.currentTarget.setPointerCapture === 'function') {
                  event.currentTarget.setPointerCapture(event.pointerId);
                }
              }}
              onPointerMove={handleSplitHandlePointerMove}
              onPointerUp={(event) => {
                if (
                  typeof event.currentTarget.hasPointerCapture === 'function' &&
                  event.currentTarget.hasPointerCapture(event.pointerId)
                ) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onPointerCancel={(event) => {
                if (
                  typeof event.currentTarget.hasPointerCapture === 'function' &&
                  event.currentTarget.hasPointerCapture(event.pointerId)
                ) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
            >
              <ArrowLeftRight className="mx-auto h-4 w-4 text-foreground" />
            </button>
          </div>

          <div className="space-y-1">
            <label htmlFor="wound-photo-comparator-slider" className="text-xs font-semibold text-muted-foreground">
              Posição do divisor
            </label>
            <input
              id="wound-photo-comparator-slider"
              type="range"
              min={0}
              max={100}
              value={splitState}
              onChange={(event) => setSplitState(clampPercent(Number(event.target.value)))}
              className="w-full"
              aria-label="Slider de comparação"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2" data-testid="side-by-side-layout">
          <div
            ref={sideBySideViewportRef}
            className={`relative h-[40vh] min-h-[260px] overflow-hidden rounded-2xl border border-border bg-muted/10 ${
              canPan ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onWheel={handleWheelZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <div className="absolute left-3 top-3 z-20 rounded-full bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              {visualOrderInverted ? 'Depois' : 'Antes'}
            </div>
            {renderPhotoLayer(visibleBeforePhoto, visualOrderInverted ? 'Depois' : 'Antes')}
          </div>

          <div
            className={`relative h-[40vh] min-h-[260px] overflow-hidden rounded-2xl border border-border bg-muted/10 ${
              canPan ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onWheel={handleWheelZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <div className="absolute left-3 top-3 z-20 rounded-full bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              {visualOrderInverted ? 'Antes' : 'Depois'}
            </div>
            {renderPhotoLayer(visibleAfterPhoto, visualOrderInverted ? 'Antes' : 'Depois')}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <article className="space-y-1 rounded-xl border border-border/70 bg-muted/10 p-3 text-xs">
          <p className="font-semibold uppercase tracking-wider text-muted-foreground">Foto Antes</p>
          <p className="text-foreground">Data/hora: {formatPhotoDateTime(beforePhoto.captured_at)}</p>
          <p className="text-muted-foreground">Descrição: {beforePhoto.description || 'Sem descrição'}</p>
          <p className="text-muted-foreground">Vínculo: {beforePhoto.entry_id || 'Sem evolução vinculada'}</p>
        </article>

        <article className="space-y-1 rounded-xl border border-border/70 bg-muted/10 p-3 text-xs">
          <p className="font-semibold uppercase tracking-wider text-muted-foreground">Foto Depois</p>
          <p className="text-foreground">Data/hora: {formatPhotoDateTime(afterPhoto.captured_at)}</p>
          <p className="text-muted-foreground">Descrição: {afterPhoto.description || 'Sem descrição'}</p>
          <p className="text-muted-foreground">Vínculo: {afterPhoto.entry_id || 'Sem evolução vinculada'}</p>
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/5 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Intervalo evolutivo</span>
        <strong className="text-foreground">+{timeDiffInDays ?? 0} dias</strong>
      </div>

      {onClose && (
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </Card>
  );
};

export default WoundPhotoComparator;
