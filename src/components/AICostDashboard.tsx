/**
 * 🔱 ULTRA 2026 - AI Cost Dashboard Component
 * Real-time cost monitoring and analytics
 */

import { useState, useEffect } from 'react';
import { aiService } from '@/services/aiService';
import { useAuth } from '@/hooks/useAuth';
import { type AICost } from '@/lib/ultra';

interface CostReport {
  total: number;
  byProvider: Record<string, number>;
  byDay: Record<string, number>;
  trend: 'up' | 'down' | 'stable';
}

export function AICostDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState<CostReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCostReport();
  }, [user]);

  const loadCostReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const rawReport = aiService.getCostReport(user.id);
      
      // Transform to dashboard format
      const byDay = calculateByDay(rawReport);
      const trend = calculateTrend(byDay);

      setReport({
        total: rawReport.total,
        byProvider: rawReport.byProvider,
        byDay,
        trend,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost report');
    } finally {
      setLoading(false);
    }
  };

  const calculateByDay = (raw: { total: number; byProvider: Record<string, number> }): Record<string, number> => {
    // In real implementation, would query historical data
    // For now, return mock daily breakdown
    const today = new Date().toISOString().split('T')[0];
    return {
      [today]: raw.total,
    };
  };

  const calculateTrend = (byDay: Record<string, number>): 'up' | 'down' | 'stable' => {
    const days = Object.keys(byDay).sort();
    if (days.length < 2) return 'stable';

    const today = byDay[days[days.length - 1]];
    const yesterday = byDay[days[days.length - 2]];

    if (today > yesterday * 1.1) return 'up';
    if (today < yesterday * 0.9) return 'down';
    return 'stable';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-400';
      case 'down': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-border animate-pulse">
        <div className="h-6 w-32 bg-surface-hover rounded mb-4"></div>
        <div className="h-8 w-48 bg-surface-hover rounded mb-2"></div>
        <div className="h-4 w-24 bg-surface-hover rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-border border-error">
        <h3 className="text-lg font-semibold text-error mb-2">⚠️ Error Loading Cost Report</h3>
        <p className="text-sm text-text-secondary">{error}</p>
        <button 
          onClick={loadCostReport}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-2">AI Cost Dashboard</h3>
        <p className="text-sm text-text-secondary">No cost data available yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface rounded-lg border border-border space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">AI Cost Report</h2>
          <p className="text-sm text-text-secondary">Real-time cost tracking</p>
        </div>
        <button
          onClick={loadCostReport}
          className="px-3 py-1.5 bg-surface-hover hover:bg-surface-active rounded text-sm transition-colors"
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Total Cost */}
      <div className="bg-surface-hover p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Total Cost (All Time)</p>
            <p className="text-3xl font-bold text-text-primary">
              {formatCurrency(report.total)}
            </p>
          </div>
          <div className={`text-2xl ${getTrendColor(report.trend)}`}>
            {getTrendIcon(report.trend)}
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">By Provider</h3>
        <div className="space-y-2">
          {Object.entries(report.byProvider).map(([provider, amount]) => (
            <div key={provider} className="flex items-center justify-between p-2 bg-surface-hover rounded">
              <span className="capitalize text-text-primary">{provider}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-surface rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ 
                      width: `${(amount / report.total) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-mono text-text-primary">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Daily Usage</h3>
        <div className="space-y-2">
          {Object.entries(report.byDay).map(([date, amount]) => (
            <div key={date} className="flex items-center justify-between p-2 bg-surface-hover rounded">
              <span className="text-sm text-text-primary">
                {new Date(date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
              <span className="text-sm font-mono text-text-primary">
                {formatCurrency(amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Alert */}
      {report.total > 50 && (
        <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg">
          <p className="text-yellow-200 text-sm">
            ⚠️ Warning: AI costs have exceeded €50. Consider optimizing prompts or switching to SiliconFlow.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            // Export functionality
            const dataStr = JSON.stringify(report, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-cost-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
          }}
          className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded text-sm transition-colors"
        >
          📥 Export JSON
        </button>
        <button
          onClick={() => {
            // CSV export
            const csv = [
              ['Provider', 'Cost (EUR)'],
              ...Object.entries(report.byProvider),
              ['Total', report.total.toString()],
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-cost-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded text-sm transition-colors"
        >
          📊 Export CSV
        </button>
      </div>
    </div>
  );
}

/**
 * Compact version for dashboard overview
 */
export function AICostDashboardCompact() {
  const { user } = useAuth();
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const report = aiService.getCostReport(user.id);
    setTotal(report.total);
    setLoading(false);
  }, [user]);

  if (loading) {
    return <div className="h-6 w-20 bg-surface-hover rounded animate-pulse"></div>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-secondary">AI Cost:</span>
      <span className="font-mono font-semibold text-text-primary">
        €{total?.toFixed(2) ?? '0.00'}
      </span>
    </div>
  );
}
