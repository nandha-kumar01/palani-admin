'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface AdminNotificationHook {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  analytics: any;
  fetchNotifications: (filters?: any) => Promise<void>;
  createNotification: (data: any) => Promise<boolean>;
  sendNotification: (id: string) => Promise<boolean>;
  markAsRead: (id: string) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  sendPushNotification: (data: any) => Promise<boolean>;
  refreshAnalytics: () => Promise<void>;
}

export const useAdminNotifications = (options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}): AdminNotificationHook => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoRefresh = false, refreshInterval = 30000 } = options || {};

  // Base fetch function
  const fetchNotifications = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);

      const response = await fetch(`/api/admin/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
        setAnalytics(result.data.analytics);
        
        // Calculate unread count (drafts and new notifications)
        const unread = result.data.notifications.filter((n: any) => 
          n.status === 'draft' || 
          (n.status === 'sent' && new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        ).length;
        setUnreadCount(unread);
      } else {
        setError(result.error || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      setError('Network error occurred');

    } finally {
      setLoading(false);
    }
  }, []);

  // Create notification
  const createNotification = useCallback(async (data: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh notifications list
        await fetchNotifications();
        return true;
      } else {
        setError(result.error || 'Failed to create notification');
        return false;
      }
    } catch (error: any) {
      setError('Network error occurred');

      return false;
    }
  }, [fetchNotifications]);

  // Send notification
  const sendNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/notifications/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Refresh notifications list
        await fetchNotifications();
        return true;
      } else {
        setError(result.error || 'Failed to send notification');
        return false;
      }
    } catch (error: any) {
      setError('Network error occurred');

      return false;
    }
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId'); // Assuming you store user ID
      
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-read',
          userId,
          deviceInfo: {
            platform: navigator.platform,
            browser: navigator.userAgent,
            ip: '' // Will be populated server-side
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setNotifications(prev => prev.map(n => 
          n._id === id 
            ? { ...n, readBy: [...(n.readBy || []), { userId, readAt: new Date() }] }
            : n
        ));
        return true;
      } else {
        setError(result.error || 'Failed to mark as read');
        return false;
      }
    } catch (error: any) {
      setError('Network error occurred');

      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n._id !== id));
        return true;
      } else {
        setError(result.error || 'Failed to delete notification');
        return false;
      }
    } catch (error: any) {
      setError('Network error occurred');

      return false;
    }
  }, []);

  // Send push notification
  const sendPushNotification = useCallback(async (data: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/notifications/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Failed to send push notification');
        return false;
      }
    } catch (error: any) {
      setError('Network error occurred');

      return false;
    }
  }, []);

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/notifications/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      setError('Network error occurred');

    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchNotifications();
        refreshAnalytics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchNotifications, refreshAnalytics]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
    refreshAnalytics();
  }, [fetchNotifications, refreshAnalytics]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    analytics,
    fetchNotifications,
    createNotification,
    sendNotification,
    markAsRead,
    deleteNotification,
    sendPushNotification,
    refreshAnalytics
  };
};

// Hook for real-time notification updates via WebSocket or Server-Sent Events
export const useRealTimeNotifications = (userId: string) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [realTimeNotifications, setRealTimeNotifications] = useState<any[]>([]);

  useEffect(() => {
    // You can implement WebSocket or SSE connection here
    // For now, we'll use periodic polling as a fallback
    
    const connectToRealTime = () => {
      setConnectionStatus('connecting');
      
      // Example WebSocket implementation
      // const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/notifications/${userId}`);
      
      // ws.onopen = () => {
      //   setConnectionStatus('connected');
      // };
      
      // ws.onmessage = (event) => {
      //   const notification = JSON.parse(event.data);
      //   setRealTimeNotifications(prev => [notification, ...prev]);
      // };
      
      // ws.onclose = () => {
      //   setConnectionStatus('disconnected');
      //   // Reconnect after 5 seconds
      //   setTimeout(connectToRealTime, 5000);
      // };
      
      // ws.onerror = () => {
      //   setConnectionStatus('disconnected');
      // };

      // Fallback: Mark as connected for now
      setConnectionStatus('connected');
    };

    if (userId) {
      connectToRealTime();
    }

    return () => {
      // Cleanup WebSocket connection
      setConnectionStatus('disconnected');
    };
  }, [userId]);

  return {
    connectionStatus,
    realTimeNotifications,
    clearRealTimeNotifications: () => setRealTimeNotifications([])
  };
};

export default useAdminNotifications;