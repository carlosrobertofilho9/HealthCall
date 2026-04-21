import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WoundEvolutionTable from './WoundEvolutionTable';
import type { WoundEntry } from '../types';

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

describe('WoundEvolutionTable', () => {
  it('renderiza estado vazio sem evoluções', () => {
    render(<WoundEvolutionTable entries={[]} />);

    expect(screen.getByText(/Sem evolução registrada/i)).toBeInTheDocument();
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

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Medida')).toBeInTheDocument();
    expect(screen.getByText('C x L x P')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Próxima Troca')).toBeInTheDocument();
    expect(screen.getByText('Profissional')).toBeInTheDocument();

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

    expect(screen.queryByText(/Sem cobertura adequada - Paciente sem cobertura primária/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ver detalhes/i }));

    expect(screen.getByText(/ATB: Sulfadiazina de Prata/)).toBeInTheDocument();
    expect(screen.getByText(/Pomada: AGE/)).toBeInTheDocument();
    expect(screen.getByText(/Sem cobertura adequada - Paciente sem cobertura primária/)).toBeInTheDocument();
    expect(screen.getByText(/Realizado novo curativo e orientação/)).toBeInTheDocument();
    expect(screen.getByText(/Evolução com melhora parcial/)).toBeInTheDocument();
    expect(screen.getByText(/Íntegra/)).toBeInTheDocument();
  });

  it('renderiza cabeçalho documental com dados de paciente e lesão', () => {
    const entry = makeEntry();

    render(
      <WoundEvolutionTable
        entries={[entry]}
        patient={{ full_name: 'João da Silva', document_type: 'CPF', document_value: '12345678900' }}
        wound={{
          anatomical_code: 'MaleoloLE',
          started_at: '2026-04-10',
          classification: 'Grau II',
          etiology: 'Pé Diabético',
        }}
      />,
    );

    expect(screen.getByText('Ficha de Evolução de Curativos')).toBeInTheDocument();
    expect(screen.getByText('João da Silva')).toBeInTheDocument();
    expect(screen.getByText(/MaleoloLE/)).toBeInTheDocument();
    expect(screen.getByText(/Grau II/)).toBeInTheDocument();
    expect(screen.getByText(/Pé Diabético/)).toBeInTheDocument();
  });
});
