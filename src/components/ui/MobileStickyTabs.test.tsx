import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileStickyTabs, type MobileStickyTabItem } from './MobileStickyTabs';

const items: MobileStickyTabItem[] = [
  { value: 'new', label: 'Nova' },
  { value: 'list', label: 'Lista', badge: 7 },
  { value: 'done', label: 'Feitas', disabled: true },
];

describe('MobileStickyTabs', () => {
  it('renders active, badge, and emits changes', () => {
    const onValueChange = vi.fn();

    render(
      <MobileStickyTabs
        value="new"
        onValueChange={onValueChange}
        items={items}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Nova' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('7')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Lista 7' }));

    expect(onValueChange).toHaveBeenCalledWith('list');
  });

  it('does not emit changes for disabled tabs', () => {
    const onValueChange = vi.fn();

    render(
      <MobileStickyTabs
        value="new"
        onValueChange={onValueChange}
        items={items}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Feitas' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('rejects more than five options', () => {
    const tooManyItems = Array.from({ length: 6 }, (_, index) => ({
      value: String(index),
      label: `Tab ${index}`,
    }));

    expect(() => {
      render(
        <MobileStickyTabs
          value="0"
          onValueChange={vi.fn()}
          items={tooManyItems}
        />,
      );
    }).toThrow('MobileStickyTabs supports between 1 and 5 options.');
  });
});
