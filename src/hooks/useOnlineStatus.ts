/**
 * 🔱 ULTRA 2026 - Online Status Hook
 * Real-time network connectivity monitoring with sync state management
 */

import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  connectionType?: string;
  effectiveType?: string; // 'slow-2g', '2g', '3g', '4g'
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
}

export function useOnlineStatus(): OnlineStatus {
  const [state, setState] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
  });

  // Monitor network quality
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        setState(prev => ({
          ...prev,
          connectionType: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        }));
      };

      updateNetworkInfo();

      if (connection.addEventListener) {
        connection.addEventListener('change', updateNetworkInfo);
        return () => connection.removeEventListener('change', updateNetworkInfo);
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: true,
        lastSync: new Date(),
        isSyncing: true 
      }));

      // Stop syncing after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, isSyncing: false }));
      }, 2000);
    };

    const handleOffline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: false,
        isSyncing: false 
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Trigger manual sync
   */
  const triggerSync = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isSyncing: true,
      lastSync: new Date()
    }));

    // Simulate sync completion
    setTimeout(() => {
      setState(prev => ({ ...prev, isSyncing: false }));
    }, 1500);
  }, []);

  /**
   * Get network quality score (0-100)
   */
  const getNetworkQuality = useCallback((): number => {
    if (!state.isOnline) return 0;

    let score = 100;

    // Penalize slow connections
    if (state.effectiveType === 'slow-2g') score -= 60;
    if (state.effectiveType === '2g') score -= 40;
    if (state.effectiveType === '3g') score -= 20;

    // Penalize high latency
    if (state.rtt && state.rtt > 500) score -= 30;
    if (state.rtt && state.rtt > 1000) score -= 40;

    // Penalize low bandwidth
    if (state.downlink && state.downlink < 1) score -= 20;
    if (state.downlink && state.downlink < 0.5) score -= 30;

    return Math.max(0, Math.min(100, score));
  }, [state]);

  /**
   * Should sync based on network quality
   */
  const shouldSync = useCallback((): boolean => {
    if (!state.isOnline) return false;
    
    const quality = getNetworkQuality();
    return quality >= 50; // Only sync on decent connections
  }, [state.isOnline, getNetworkQuality]);

  /**
   * Get estimated sync time for documents
   */
  const getEstimatedSyncTime = useCallback((documentCount: number): number => {
    if (!state.isOnline) return Infinity;
    
    const quality = getNetworkQuality();
    
    // Base time per document (ms)
    const baseTime = 100;
    
    // Quality multiplier (lower quality = slower)
    const qualityMultiplier = 100 / quality;
    
    // Network type adjustment
    let networkAdjustment = 1;
    if (state.effectiveType === 'slow-2g') networkAdjustment = 5;
    if (state.effectiveType === '2g') networkAdjustment = 3;
    if (state.effectiveType === '3g') networkAdjustment = 1.5;
    
    // RTT adjustment
    const rttAdjustment = state.rtt ? Math.max(1, state.rtt / 100) : 1;
    
    return Math.round(
      documentCount * baseTime * qualityMultiplier * networkAdjustment * rttAdjustment
    );
  }, [state, getNetworkQuality]);

  return {
    ...state,
    triggerSync,
    getNetworkQuality,
    shouldSync,
    getEstimatedSyncTime,
  };
}
