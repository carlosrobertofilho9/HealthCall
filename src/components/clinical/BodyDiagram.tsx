import React, { useMemo, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import {
  BODY_DIAGRAM_REGIONS,
  type BodyDiagramSide,
  type BodyRegion,
  type BodySubregion,
  getSubregionByCode,
} from '@/features/wounds/utils/bodyDiagramMapping';
import { cn } from '@/lib/utils';

interface BodyDiagramProps {
  value?: string;
  onChange?: (anatomicalCode: string, selection: { region: BodyRegion; subregion: BodySubregion }) => void;
  selectedCodes?: string[];
  disabled?: boolean;
}

const sideLabels: Record<BodyDiagramSide, string> = {
  front: 'Frente',
  back: 'Costas',
};

export const BodyDiagram: React.FC<BodyDiagramProps> = ({ value, onChange, selectedCodes = [], disabled = false }) => {
  const [activeSide, setActiveSide] = useState<BodyDiagramSide>('front');
  const [activeRegionKey, setActiveRegionKey] = useState<string | null>(null);

  const activeRegion = useMemo(() => {
    if (!activeRegionKey) return null;
    return BODY_DIAGRAM_REGIONS.find((region) => region.key === activeRegionKey) ?? null;
  }, [activeRegionKey]);

  const selectedInfo = value ? getSubregionByCode(value) : null;

  const regionsBySide = useMemo(
    () => BODY_DIAGRAM_REGIONS.filter((region) => region.side === activeSide),
    [activeSide],
  );

  return (
    <Card className="space-y-4 p-4">
      {!disabled && (
        <>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Localização anatômica</h3>
            <div className="flex gap-2">
              {(Object.keys(sideLabels) as BodyDiagramSide[]).map((side) => (
                <Button
                  key={side}
                  type="button"
                  size="sm"
                  variant={activeSide === side ? 'default' : 'secondary'}
                  onClick={() => setActiveSide(side)}
                >
                  {sideLabels[side]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {regionsBySide.map((region) => (
              <button
                key={region.key}
                type="button"
                className={cn(
                  'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                  activeRegion?.key === region.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary/40',
                )}
                onClick={() => setActiveRegionKey(region.key)}
              >
                {region.label}
              </button>
            ))}
          </div>

          {activeRegion && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sub-regiões de {activeRegion.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeRegion.subregions.map((subregion) => (
                  <button
                    key={subregion.key}
                    type="button"
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      value === subregion.code
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/40',
                    )}
                    onClick={() => onChange?.(subregion.code, { region: activeRegion, subregion })}
                  >
                    {subregion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {disabled && (
        <h3 className="text-sm font-semibold text-foreground">Localização anatômica</h3>
      )}

      {selectedInfo && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
          <p className="font-medium text-primary">Selecionado: {selectedInfo.region.label}</p>
          <p className="text-muted-foreground">{selectedInfo.subregion.label} ({selectedInfo.subregion.code})</p>
        </div>
      )}

      {selectedCodes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feridas mapeadas</p>
          <div className="flex flex-wrap gap-2">
            {selectedCodes.map((code) => (
              <Badge key={code} variant="outline">
                {code}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default BodyDiagram;
