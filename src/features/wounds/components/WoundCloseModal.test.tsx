import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WoundCloseModal from './WoundCloseModal';

describe('WoundCloseModal', () => {
  it('exibe erro quando motivo do fechamento está vazio', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <WoundCloseModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirmar encerramento/i }));

    expect(await screen.findByText(/motivo do fechamento é obrigatório/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia dados quando o formulário está válido', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <WoundCloseModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Descreva o motivo do fechamento/i), {
      target: { value: 'Paciente transferido para UBS.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar encerramento/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
