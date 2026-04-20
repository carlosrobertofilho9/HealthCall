import React from 'react';
import { Badge, Card } from '@/components/ui';
import type { WoundEntry } from '../types';
import { buildTimelineAlerts } from '../utils/woundAlertRules';

interface WoundTimelineProps {
  entries: WoundEntry[];
}

const WoundTimeline: React.FC<WoundTimelineProps> = ({ entries }) => {
  const ordered = [...entries].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  const alerts = buildTimelineAlerts(entries);

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-foreground">Timeline de evolução</h3>

      {alerts.length > 0 && (
        <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Alertas de piora</p>
          <ul className="space-y-1 text-xs text-destructive">
            {alerts.slice(0, 6).map((alert) => (
              <li key={`${alert.currentEntryId}-${alert.type}`}>• {alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {ordered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            Ainda não há registros de evolução.
          </p>
        ) : (
          ordered.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {new Date(entry.recorded_at).toLocaleString('pt-BR')}
                </p>
                <Badge variant="outline">Dor: {entry.pain_scale ?? '-'}</Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">Profissional: {entry.professional_id}</p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">
                  Medidas: {entry.measure_length_cm ?? '-'} x {entry.measure_width_cm ?? '-'} x {entry.measure_depth_cm ?? '-'}
                </Badge>
                {entry.exudate && <Badge variant="outline">Exsudato: {entry.exudate}</Badge>}
                {entry.odor && <Badge variant="outline">Odor: {entry.odor}</Badge>}
                {entry.dressing_type && <Badge variant="outline">Cobertura: {entry.dressing_type}</Badge>}
              </div>

              {entry.observations && <p className="mt-2 text-sm text-foreground">{entry.observations}</p>}
            </article>
          ))
        )}
      </div>
    </Card>
  );
};

export default WoundTimeline;
