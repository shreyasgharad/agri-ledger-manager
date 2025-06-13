
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '../dashboard/StatsCard';
import { Users } from 'lucide-react';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 data-testid="card-title" {...props}>{children}</h3>,
}));

describe('StatsCard', () => {
  it('renders stats card with title and value', () => {
    render(
      <StatsCard
        title="Total Farmers"
        value={150}
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
    );

    expect(screen.getByText('Total Farmers')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders negative trend correctly', () => {
    render(
      <StatsCard
        title="Pending Amount"
        value="₹5000"
        icon={Users}
        trend={{ value: 8, isPositive: false }}
      />
    );

    expect(screen.getByText('-8%')).toBeInTheDocument();
  });
});
