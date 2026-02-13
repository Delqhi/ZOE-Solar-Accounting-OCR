import { useState, useEffect } from 'react';

export function useNotification(timeout = 5000) {
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), timeout);
      return () => clearTimeout(timer);
    }
  }, [notification, timeout]);

  return { notification, setNotification };
}

interface PrivateDocNotification {
  vendor: string;
  amount: number;
  reason: string;
}

export function usePrivateDocNotification(timeout = 8000) {
  const [notification, setNotification] = useState<PrivateDocNotification | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), timeout);
      return () => clearTimeout(timer);
    }
  }, [notification, timeout]);

  return { notification, setNotification };
}
