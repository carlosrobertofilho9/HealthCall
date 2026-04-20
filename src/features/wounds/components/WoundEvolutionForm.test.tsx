import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WoundEvolutionForm from './WoundEvolutionForm';

describe('WoundEvolutionForm', () => {
  it('valida campos obrigatórios ao tentar enviar', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <WoundEvolutionForm
        woundId="w1"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Concluir Evolução Clínica/i }));

    expect(await screen.findByText(/Comprimento é obrigatório/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('exige detalhes quando não conformidade está marcada', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <WoundEvolutionForm
        woundId="w1"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Não conformidade detectada/i));
    fireEvent.click(screen.getByRole('button', { name: /Concluir Evolução Clínica/i }));

    expect(await screen.findByText(/Selecione o tipo de não conformidade/i)).toBeInTheDocument();
  });
});
