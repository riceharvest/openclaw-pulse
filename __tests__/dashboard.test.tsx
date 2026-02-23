import { render, screen } from '@testing-library/react';
import Dashboard from '../app/page';
import { act } from 'react';

// Mock fetch for the API call
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      totalTokens: 1000,
      totalInput: 600,
      totalOutput: 400,
      totalCacheRead: 100,
      history: [
        { timestamp: new Date().toISOString(), agent: 'main', model: 'gpt-4', input: 100, output: 50, total: 150 }
      ],
      byModel: {
        'openai/gpt-4': { total: 150, input: 100, output: 50 }
      },
      chartData: [{ date: '2026-02-23', tokens: 150 }]
    }),
  })
) as jest.Mock;

// Mock ResizeObserver which is needed for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Dashboard Component', () => {
  it('renders correctly without crashing', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    expect(screen.getByText('OpenClaw Pulse')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
  });

  it('displays mock data correctly', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });
});
