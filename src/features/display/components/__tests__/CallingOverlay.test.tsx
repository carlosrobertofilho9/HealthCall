import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallingOverlay } from '../CallingOverlay';

describe('CallingOverlay', () => {
  it('renderiza nome e destino', () => {
    render(<CallingOverlay visible patientName="Maria Silva" room="Triagem" />);

    expect(screen.getByText('Chamando')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Triagem')).toBeInTheDocument();
  });

  it('aplica apresentação de triagem', () => {
    render(<CallingOverlay visible patientName="Maria Silva" room="Triagem" />);

    expect(screen.getByTestId('calling-destination')).toHaveAttribute('data-destination-kind', 'triagem');
    expect(screen.getByText('emergency')).toBeInTheDocument();
  });

  it('aplica apresentação de consultório médico', () => {
    render(<CallingOverlay visible patientName="João Souza" room="Consultório Médico" />);

    expect(screen.getByTestId('calling-destination')).toHaveAttribute('data-destination-kind', 'medico');
    expect(screen.getByText('medical_services')).toBeInTheDocument();
  });

  it('usa apresentação padrão para destino desconhecido', () => {
    render(<CallingOverlay visible patientName="Ana Lima" room="Sala Azul" />);

    expect(screen.getByTestId('calling-destination')).toHaveAttribute('data-destination-kind', 'padrao');
    expect(screen.getByText('meeting_room')).toBeInTheDocument();
  });
});
