import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

describe('Tabs', () => {
  it('renders the controlled active tab and emits changes', () => {
    const onValueChange = vi.fn();

    render(
      <Tabs value="one" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="one">Um</TabsTrigger>
          <TabsTrigger value="two">Dois</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Conteudo um</TabsContent>
        <TabsContent value="two">Conteudo dois</TabsContent>
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Um' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Conteudo um')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Dois' }));

    expect(onValueChange).toHaveBeenCalledWith('two');
    expect(screen.queryByText('Conteudo dois')).not.toBeInTheDocument();
  });

  it('supports defaultValue without controlled state', () => {
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">Um</TabsTrigger>
          <TabsTrigger value="two">Dois</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Conteudo um</TabsContent>
        <TabsContent value="two">Conteudo dois</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText('Conteudo um')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Dois' }));

    expect(screen.getByRole('tab', { name: 'Dois' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Conteudo dois')).toBeInTheDocument();
  });
});
