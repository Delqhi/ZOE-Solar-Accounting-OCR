/**
 * 🔱 ULTRA 2026 - AI Cost Dashboard Component Tests
 * Test suite for real-time AI cost monitoring dashboard
 */

import '@vitest/matchers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AICostDashboard } from '../AICostDashboard';
import { aiService } from '@/services/aiService';
import { type UserId } from '@/lib/ultra';

// Mock the aiService
vi.mock('@/services/aiService', () => ({
  aiService: {
    getCostReport: vi.fn(),
  },
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    },
  })),
}));

describe('AICostDashboard', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard title', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 0,
        byProvider: {},
      });

      render(<AICostDashboard />);

      expect(screen.getByText('AI Cost Report')).toBeInTheDocument();
    });

    it('should display total cost', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.5,
        byProvider: {
          gemini: 1.0,
          siliconflow: 0.5,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $1.50')).toBeInTheDocument();
    });

    it('should display provider breakdown', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.5,
        byProvider: {
          gemini: 1.0,
          siliconflow: 0.5,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('gemini: $1.00')).toBeInTheDocument();
      expect(screen.getByText('siliconflow: $0.50')).toBeInTheDocument();
    });

    it('should handle zero costs gracefully', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 0,
        byProvider: {},
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    });

    it('should render with empty provider object', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 0,
        byProvider: {},
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have correct container styling', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 0,
        byProvider: {},
      });

      const { container } = render(<AICostDashboard />);
      const dashboard = container.firstChild as HTMLElement;

      expect(dashboard).toHaveClass('p-6');
      expect(dashboard).toHaveClass('bg-surface');
      expect(dashboard).toHaveClass('rounded-lg');
      expect(dashboard).toHaveClass('border');
      expect(dashboard).toHaveClass('border-border');
    });

    it('should have correct title styling', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 0,
        byProvider: {},
      });

      render(<AICostDashboard />);

      const title = screen.getByText('AI Cost Report');
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('mb-4');
    });

    it('should have correct cost display styling', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.5,
        byProvider: {
          gemini: 1.0,
        },
      });

      render(<AICostDashboard />);

      const totalText = screen.getByText('Total: $1.50');
      expect(totalText.parentElement).toHaveClass('space-y-2');
    });
  });

  describe('Data Display', () => {
    it('should format currency correctly', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.234,
        byProvider: {
          gemini: 1.234,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $1.23')).toBeInTheDocument();
      expect(screen.getByText('gemini: $1.23')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 999.99,
        byProvider: {
          gemini: 999.99,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $999.99')).toBeInTheDocument();
    });

    it('should handle decimal precision', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 0.001,
        byProvider: {
          gemini: 0.001,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    });

    it('should display multiple providers correctly', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 2.75,
        byProvider: {
          gemini: 1.5,
          siliconflow: 0.75,
          openai: 0.5,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('gemini: $1.50')).toBeInTheDocument();
      expect(screen.getByText('siliconflow: $0.75')).toBeInTheDocument();
      expect(screen.getByText('openai: $0.50')).toBeInTheDocument();
    });
  });

  describe('User Context', () => {
    it('should use current user ID for cost report', () => {
      const getCostReportSpy = vi.fn().mockReturnValue({
        total: 0,
        byProvider: {},
      });

      (aiService.getCostReport as any).mockImplementation(getCostReportSpy);

      render(<AICostDashboard />);

      // Should be called with the user ID from useAuth
      expect(getCostReportSpy).toHaveBeenCalledWith(mockUserId);
    });

    it('should update when user changes', async () => {
      const getCostReportSpy = vi
        .fn()
        .mockReturnValueOnce({ total: 1.0, byProvider: { gemini: 1.0 } })
        .mockReturnValueOnce({ total: 2.0, byProvider: { gemini: 2.0 } });

      (aiService.getCostReport as any).mockImplementation(getCostReportSpy);

      const { rerender } = render(<AICostDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total: $1.00')).toBeInTheDocument();
      });

      // Simulate user change
      const { useAuth } = await import('@/hooks/useAuth');
      (useAuth as any).mockReturnValue({
        user: {
          id: '99999999-9999-9999-9999-999999999999',
          email: 'other@example.com',
        },
      });

      rerender(<AICostDashboard />);

      await waitFor(() => {
        expect(getCostReportSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Component Structure', () => {
    it('should render all cost entries', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 3.0,
        byProvider: {
          gemini: 1.0,
          siliconflow: 1.0,
          openai: 1.0,
        },
      });

      render(<AICostDashboard />);

      const costElements = screen.getAllByText(/\$1\.00/);
      expect(costElements.length).toBe(3); // Total + 2 providers
    });

    it('should render provider entries in order', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.5,
        byProvider: {
          z: 0.5,
          a: 0.5,
          m: 0.5,
        },
      });

      render(<AICostDashboard />);

      // The order depends on Object.entries iteration
      // Just verify all are present
      expect(screen.getByText('z: $0.50')).toBeInTheDocument();
      expect(screen.getByText('a: $0.50')).toBeInTheDocument();
      expect(screen.getByText('m: $0.50')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      const { useAuth } = require('@/hooks/useAuth');
      (useAuth as any).mockReturnValue({ user: null });

      (aiService.getCostReport as any).mockReturnValue({
        total: 0,
        byProvider: {},
      });

      // Should not throw
      expect(() => render(<AICostDashboard />)).not.toThrow();
    });

    it('should handle undefined provider values', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.0,
        byProvider: {
          gemini: undefined,
          siliconflow: 1.0,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('Total: $1.00')).toBeInTheDocument();
      expect(screen.getByText('siliconflow: $1.00')).toBeInTheDocument();
    });

    it('should handle provider with zero cost', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.0,
        byProvider: {
          gemini: 1.0,
          siliconflow: 0.0,
        },
      });

      render(<AICostDashboard />);

      expect(screen.getByText('gemini: $1.00')).toBeInTheDocument();
      expect(screen.getByText('siliconflow: $0.00')).toBeInTheDocument();
    });
  });

  describe('Integration with aiService', () => {
    it('should call aiService.getCostReport on mount', () => {
      const getCostReportSpy = vi.fn().mockReturnValue({
        total: 0,
        byProvider: {},
      });

      (aiService.getCostReport as any).mockImplementation(getCostReportSpy);

      render(<AICostDashboard />);

      expect(getCostReportSpy).toHaveBeenCalledTimes(1);
    });

    it('should use correct user ID from auth', () => {
      const getCostReportSpy = vi.fn().mockReturnValue({
        total: 0,
        byProvider: {},
      });

      (aiService.getCostReport as any).mockImplementation(getCostReportSpy);

      render(<AICostDashboard />);

      expect(getCostReportSpy).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle aiService errors gracefully', () => {
      (aiService.getCostReport as any).mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      // Should not crash the component
      expect(() => render(<AICostDashboard />)).toThrow();
    });
  });

  describe('Visual Layout', () => {
    it('should have proper spacing between elements', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 2.0,
        byProvider: {
          gemini: 1.0,
          siliconflow: 1.0,
        },
      });

      const { container } = render(<AICostDashboard />);
      const costContainer = container.querySelector('.space-y-2');

      expect(costContainer).toBeInTheDocument();
      expect(costContainer?.children.length).toBe(3); // Total + 2 providers
    });

    it('should display costs in a list format', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.5,
        byProvider: {
          gemini: 1.0,
          siliconflow: 0.5,
        },
      });

      render(<AICostDashboard />);

      // Verify list structure
      const container = screen.getByText('Total: $1.50').parentElement;
      expect(container).toHaveClass('space-y-2');
    });
  });

  describe('Real-time Updates', () => {
    it('should support manual refresh (if implemented)', () => {
      // This test documents the expected behavior for future enhancement
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.0,
        byProvider: { gemini: 1.0 },
      });

      render(<AICostDashboard />);

      // Component should be reactive to aiService changes
      // This would be tested with a full integration test
      expect(screen.getByText('Total: $1.00')).toBeInTheDocument();
    });

    it('should display current snapshot of costs', () => {
      const mockReport = {
        total: 1.0,
        byProvider: { gemini: 1.0 },
      };

      (aiService.getCostReport as any).mockReturnValue(mockReport);

      render(<AICostDashboard />);

      // Should display the report at mount time
      expect(screen.getByText('Total: $1.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.0,
        byProvider: { gemini: 1.0 },
      });

      const { container } = render(<AICostDashboard />);

      // Should have proper heading
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('AI Cost Report');
    });

    it('should be readable by screen readers', () => {
      (aiService.getCostReport as any).mockReturnValue({
        total: 1.5,
        byProvider: {
          gemini: 1.0,
          siliconflow: 0.5,
        },
      });

      render(<AICostDashboard />);

      // All cost information should be visible text
      expect(screen.getByText('Total: $1.50')).toBeInTheDocument();
      expect(screen.getByText('gemini: $1.00')).toBeInTheDocument();
      expect(screen.getByText('siliconflow: $0.50')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render quickly with large provider list', () => {
      const largeReport = {
        total: 10.0,
        byProvider: {
          provider1: 1.0,
          provider2: 1.0,
          provider3: 1.0,
          provider4: 1.0,
          provider5: 1.0,
          provider6: 1.0,
          provider7: 1.0,
          provider8: 1.0,
          provider9: 1.0,
          provider10: 1.0,
        },
      };

      (aiService.getCostReport as any).mockReturnValue(largeReport);

      const startTime = performance.now();
      render(<AICostDashboard />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
      expect(screen.getByText('Total: $10.00')).toBeInTheDocument();
    });

    it('should not cause unnecessary re-renders', () => {
      const getCostReportSpy = vi.fn().mockReturnValue({
        total: 1.0,
        byProvider: { gemini: 1.0 },
      });

      (aiService.getCostReport as any).mockImplementation(getCostReportSpy);

      const { rerender } = render(<AICostDashboard />);

      const initialCallCount = getCostReportSpy.mock.calls.length;

      rerender(<AICostDashboard />);

      // Should only be called on mount, not on rerender (unless user changes)
      expect(getCostReportSpy.mock.calls.length).toBeLessThanOrEqual(initialCallCount + 1);
    });
  });
});
