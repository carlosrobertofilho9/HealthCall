import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WoundEvolutionTable from './WoundEvolutionTable';
import type { WoundEntry, WoundPhoto } from '../types';

const mocks = vi.hoisted(() => ({
  mockPrint: vi.fn(),
  mockResolveMetadata: vi.fn(),
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => mocks.mockPrint,
}));

vi.mock('../services/woundPhotoMetadataService', () => ({
  LEGACY_GEO_CUTOFF_ISO: '2026-04-21T00:00:00.000Z',
  isLegacyPhotoCreatedAt: (createdAt?: string | null) => {
    if (!createdAt) return true;
    return Date.parse(createdAt) < Date.parse('2026-04-21T00:00:00.000Z');
  },
  resolveWoundPhotoMetadataOnDemand: mocks.mockResolveMetadata,
}));

const makeEntry = (overrides: Partial<WoundEntry> = {}): WoundEntry => ({
  id: 'entry-1',
  wound_id: 'wound-1',
  recorded_at: '2026-04-20T10:00:00.000Z',
  professional_id: 'prof-1',
  measure_length_cm: 3,
  measure_width_cm: 2,
  measure_depth_cm: 0.5,
  area_cm2: 6,
  bed_aspect: ['Granulação'],
  edges: ['Regulares'],
  exudate: 'seroso',
  odor: 'ausente',
  perilesional_skin: ['Íntegra'],
  pain_scale: 2,
  uses_antibiotic: true,
  antibiotic_type: 'Sulfadiazina de Prata',
  uses_ointment: false,
  ointment_type: null,
  dressing_type: 'Hidrogel',
  dressing_notes: null,
  non_conformity_detected: false,
  non_conformity_type: null,
  non_conformity_description: null,
  non_conformity_action: null,
  observations: 'Evolução favorável.',
  next_change_date: '2026-04-21',
  created_at: '2026-04-20T10:00:00.000Z',
  profiles: { full_name: 'Maria Silva' },
  ...overrides,
});

const makePhoto = (overrides: Partial<WoundPhoto> = {}): WoundPhoto => ({
  id: 'photo-1',
  wound_id: 'wound-1',
  entry_id: null,
  storage_path: 'wound-1/photo-1.jpg',
  captured_at: '2026-04-21T09:00:00.000Z',
  display_order: 0,
  description: null,
  is_primary: false,
  created_by: 'user-1',
  created_at: '2026-04-21T09:00:00.000Z',
  deleted_at: null,
  deleted_by: null,
  signed_url: 'https://example.com/photo-1.jpg',
  ...overrides,
});

describe('WoundEvolutionTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockResolveMetadata.mockResolvedValue({
      metadata: {
        latitude: -23.55,
        longitude: -46.63,
      },
      source: 'exif_download',
    });
  });

  it('renderiza estado vazio sem evoluções', () => {
    render(<WoundEvolutionTable entries={[]} />);
    expect(screen.getAllByText(/Sem evolução registrada/i).length).toBeGreaterThan(0);
  });

  it('renderiza colunas principais e usa fallback para professional_id', () => {
    const withName = makeEntry();
    const withoutName = makeEntry({
      id: 'entry-2',
      recorded_at: '2026-04-19T10:00:00.000Z',
      professional_id: 'profissional-sem-nome',
      profiles: undefined,
    });

    render(<WoundEvolutionTable entries={[withName, withoutName]} />);

    expect(screen.getAllByText('Data').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Medida').length).toBeGreaterThan(0);
    expect(screen.getAllByText('C x L x P').length).toBeGreaterThan(0);
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Próxima Troca')).toBeInTheDocument();
    expect(screen.getAllByText('Profissional').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0);
    expect(screen.getAllByText('profissional-sem-nome').length).toBeGreaterThan(0);
  });

  it('exibe informações clínicas completas ao expandir os detalhes da linha', () => {
    const entry = makeEntry({
      uses_ointment: true,
      ointment_type: 'AGE',
      non_conformity_detected: true,
      non_conformity_type: 'Sem cobertura adequada',
      non_conformity_description: 'Paciente sem cobertura primária.',
      non_conformity_action: 'Realizado novo curativo e orientação.',
      observations: 'Evolução com melhora parcial.',
    });

    render(<WoundEvolutionTable entries={[entry]} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver detalhes/i }));

    expect(screen.getByText(/ATB: Sulfadiazina de Prata/)).toBeInTheDocument();
    expect(screen.getByText(/Pomada: AGE/)).toBeInTheDocument();
    expect(screen.getAllByText(/Sem cobertura adequada - Paciente sem cobertura primária/).length).toBeGreaterThan(0);
  });

  it('pré-carrega metadados antes de imprimir', async () => {
    const entry = makeEntry();
    const photo = makePhoto();

    render(<WoundEvolutionTable entries={[entry]} photos={[photo]} mode="page" />);
    fireEvent.click(screen.getByRole('button', { name: /Imprimir/i }));

    await waitFor(() => expect(mocks.mockResolveMetadata).toHaveBeenCalledWith(photo));
    await waitFor(() => expect(mocks.mockPrint).toHaveBeenCalledTimes(1));
  });
});
