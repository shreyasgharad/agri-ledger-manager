
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCard from '../dashboard/StatsCard';
import { Users } from 'lucide-react';

// Mock the lucide-react icon
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon">Users Icon</div>,
}));

describe('StatsCard', () => {
  it('renders basic stats card correctly', () => {
    const { getByText } = render(
      <StatsCard
        title="Total Users"
        value={100}
        description="Active users"
        icon={Users}
      />
    );

    expect(getByText('Total Users')).toBeDefined();
    expect(getByText('100')).toBeDefined();
    expect(getByText('Active users')).toBeDefined();
  });

  it('renders trend information when provided', () => {
    const { getByText } = render(
      <StatsCard
        title="Revenue"
        value="$1,000"
        icon={Users}
        trend={{ value: 10, isPositive: true }}
      />
    );

    expect(getByText('+10%')).toBeDefined();
  });
});
