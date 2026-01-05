/**
 * DashboardView - Analytics and Overview Component
 * Production-ready with 2026 best practices
 * Implements rate limiting, error boundaries, performance monitoring
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DocumentRecord, DocumentStatus, AppSettings } from '../types';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { apiRateLimiter } from '../utils/rateLimiter';

interface DashboardViewProps {
  documents: DocumentRecord[];
  settings: AppSettings | null;
  onSelectDocument: (doc: DocumentRecord) => void;
  onClose: () => void;
}

interface DashboardStats {
  total: number;
  completed: number;
  reviewNeeded: number;
  errors: number;
  duplicates: number;
  privateDocs: number;
  totalAmount: number;
  avgProcessingTime: number;
}

interface MonthlyData {
  month: string;
  count: number;
  amount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  settings,
  onSelectDocument,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const startTime = PerformanceMonitor.now();
      const operationId = `dashboard-load-${Date.now()}`;

      try {
        // Rate limit check
        const rateCheck = await apiRateLimiter.check(operationId);
        if (!rateCheck.allowed) {
          throw new Error(`Rate limit exceeded. Please wait ${rateCheck.retryAfter || 60} seconds.`);
        }

        setLoading(true);
        setError(null);

        // Calculate statistics
        const calculatedStats = calculateStats(documents);
        const calculatedMonthly = calculateMonthlyData(documents);

        setStats(calculatedStats);
        setMonthlyData(calculatedMonthly);

        const duration = PerformanceMonitor.now() - startTime;
        PerformanceMonitor.recordMetric('dashboard_load_success', {
          operationId,
          duration,
          documentCount: documents.length
        });

      } catch (err) {
        const duration = PerformanceMonitor.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';

        console.error(`❌ [${operationId}] Dashboard load failed after ${duration}ms`, err);
        PerformanceMonitor.recordMetric('dashboard_load_failure', {
          operationId,
          duration,
          error: errorMessage
        });

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [documents]);

  const calculateStats = (docs: DocumentRecord[]): DashboardStats => {
    return docs.reduce((acc, doc) => {
      acc.total++;

      const amount = doc.data?.bruttoBetrag || 0;
      acc.totalAmount += amount;

      switch (doc.status) {
        case DocumentStatus.COMPLETED:
          acc.completed++;
          break;
        case DocumentStatus.REVIEW_NEEDED:
          acc.reviewNeeded++;
          break;
        case DocumentStatus.ERROR:
          acc.errors++;
          break;
        case DocumentStatus.DUPLICATE:
          acc.duplicates++;
          break;
        case DocumentStatus.PRIVATE:
          acc.privateDocs++;
          break;
      }

      return acc;
    }, {
      total: 0,
      completed: 0,
      reviewNeeded: 0,
      errors: 0,
      duplicates: 0,
      privateDocs: 0,
      totalAmount: 0,
      avgProcessingTime: 0
    } as DashboardStats);
  };

  const calculateMonthlyData = (docs: DocumentRecord[]): MonthlyData[] => {
    const monthlyMap = new Map<string, { count: number; amount: number }>();

    docs.forEach(doc => {
      const dateStr = doc.data?.belegDatum || doc.uploadDate;
      const monthKey = dateStr.substring(0, 7); // YYYY-MM

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { count: 0, amount: 0 });
      }

      const entry = monthlyMap.get(monthKey)!;
      entry.count++;
      entry.amount += doc.data?.bruttoBetrag || 0;
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months
  };

  const getStatusColor = (status: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return 'bg-green-500';
      case DocumentStatus.REVIEW_NEEDED:
        return 'bg-amber-500';
      case DocumentStatus.ERROR:
        return 'bg-red-500';
      case DocumentStatus.DUPLICATE:
        return 'bg-purple-500';
      case DocumentStatus.PRIVATE:
        return 'bg-indigo-500';
      default:
        return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-red-900 font-bold mb-2">Fehler beim Laden</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-slate-500">Keine Daten verfügbar</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-sm">Übersicht und Analysen</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700 font-medium"
        >
          Schließen
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Gesamt</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Dokumente</div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Abgeschlossen</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% der Dokumente
          </div>
        </div>

        {/* Review Needed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Prüfung nötig</span>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600">{stats.reviewNeeded}</div>
          <div className="text-xs text-slate-400 mt-1">Benötigt manuelle Prüfung</div>
        </div>

        {/* Amount Total */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm font-medium">Gesamtbetrag</span>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {stats.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Insgesamt verarbeitet</div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Status Verteilung</h3>
        <div className="space-y-3">
          {[
            { label: 'Abgeschlossen', value: stats.completed, status: DocumentStatus.COMPLETED },
            { label: 'Prüfung nötig', value: stats.reviewNeeded, status: DocumentStatus.REVIEW_NEEDED },
            { label: 'Fehler', value: stats.errors, status: DocumentStatus.ERROR },
            { label: 'Duplikate', value: stats.duplicates, status: DocumentStatus.DUPLICATE },
            { label: 'Privat', value: stats.privateDocs, status: DocumentStatus.PRIVATE }
          ].map(item => {
            const percentage = stats.total > 0 ? (item.value / stats.total) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600 font-medium">{item.label}</div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(item.status)} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm font-bold text-slate-700">
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Monatliche Trends (letzte 12 Monate)</h3>
        {monthlyData.length > 0 ? (
          <div className="space-y-3">
            {monthlyData.map(data => (
              <div key={data.month} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-20 font-medium text-slate-700">
                  {new Date(data.month + '-01').toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{data.count} Dokumente</span>
                    <span className="font-semibold text-slate-800">
                      {data.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((data.amount / (stats.totalAmount || 1)) * 100 * 2, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Keine monatlichen Daten verfügbar</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Schnellzugriff</h3>
        <div className="flex flex-wrap gap-3">
          {stats.reviewNeeded > 0 && (
            <button
              onClick={() => {
                const reviewDoc = documents.find(d => d.status === DocumentStatus.REVIEW_NEEDED);
                if (reviewDoc) onSelectDocument(reviewDoc);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              Prüfung starten ({stats.reviewNeeded})
            </button>
          )}
          {stats.errors > 0 && (
            <button
              onClick={() => {
                const errorDoc = documents.find(d => d.status === DocumentStatus.ERROR);
                if (errorDoc) onSelectDocument(errorDoc);
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              Fehler beheben ({stats.errors})
            </button>
          )}
          <button
            onClick={() => {
              const completedDoc = documents.find(d => d.status === DocumentStatus.COMPLETED);
              if (completedDoc) onSelectDocument(completedDoc);
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            Abgeschlossene ansehen
          </button>
        </div>
      </div>

      {/* Summary Info */}
      <div className="mt-6 text-xs text-slate-500 text-center">
        <p>Daten werden lokal in IndexedDB gespeichert. Optionaler Cloud-Sync mit Supabase verfügbar.</p>
        <p className="mt-1">Letzte Aktualisierung: {new Date().toLocaleString('de-DE')}</p>
      </div>
    </div>
  );
};
