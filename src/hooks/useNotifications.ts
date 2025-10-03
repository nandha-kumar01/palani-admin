import { useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  onMessageListener,
  storeFCMToken,
  sendNotificationToUser,
} from '@/lib/firebase';

interface NotificationState {
  permission: NotificationPermission | null;
  token: string | null;
  supported: boolean;
  loading: boolean;
  error: string | null;
}

interface UseNotificationsOptions {
  userId?: string;
  autoRequest?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const [state, setState] = useState<NotificationState>({
    permission: null,
    token: null,
    supported: typeof window !== 'undefined' && 'Notification' in window,
    loading: false,
    error: null,
  });

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    if (!state.supported) {
      setState(prev => ({ ...prev, error: 'Notifications not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check current permission
      const currentPermission = Notification.permission;
      setState(prev => ({ ...prev, permission: currentPermission }));

      if (currentPermission === 'granted') {
        // Get FCM token
        const token = await requestNotificationPermission();
        if (token && options.userId) {
          await storeFCMToken(options.userId, token);
          setState(prev => ({ ...prev, token }));
        }
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize notifications' 
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.supported, options.userId]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!state.supported) return false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        setState(prev => ({ 
          ...prev, 
          permission: 'granted',
          token 
        }));

        if (options.userId) {
          await storeFCMToken(options.userId, token);
        }

        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          permission: Notification.permission,
          error: 'Permission denied or token not available'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to request permission' 
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.supported, options.userId]);

  // Send notification to user
  const sendNotification = useCallback(async (
    targetUserId: string,
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      await sendNotificationToUser(targetUserId, title, body, data);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!state.supported) return;

    const unsubscribe = onMessageListener().then((payload: any) => {
      // Show notification in foreground
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/favicon.ico',
          data: payload.data,
        });
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, [state.supported]);

  // Auto-initialize if requested
  useEffect(() => {
    if (options.autoRequest && options.userId) {
      initializeNotifications();
    }
  }, [options.autoRequest, options.userId, initializeNotifications]);

  return {
    ...state,
    initializeNotifications,
    requestPermission,
    sendNotification,
  };
};

// Hook for location-based notifications
export const useLocationNotifications = (userId: string) => {
  const { sendNotification } = useNotifications();

  const notifyLocationUpdate = useCallback(async (
    targetUserId: string,
    userName: string,
    location: { latitude: number; longitude: number }
  ) => {
    return await sendNotification(
      targetUserId,
      'Location Update',
      `${userName} has updated their location`,
      {
        type: 'location_update',
        userId,
        location: JSON.stringify(location),
      }
    );
  }, [sendNotification, userId]);

  const notifyGroupJoin = useCallback(async (
    targetUserId: string,
    userName: string,
    groupName: string
  ) => {
    return await sendNotification(
      targetUserId,
      'Group Update',
      `${userName} joined ${groupName}`,
      {
        type: 'group_join',
        userId,
        groupName,
      }
    );
  }, [sendNotification, userId]);

  const notifyEmergency = useCallback(async (
    targetUserId: string,
    userName: string,
    location: { latitude: number; longitude: number }
  ) => {
    return await sendNotification(
      targetUserId,
      '🚨 Emergency Alert',
      `${userName} needs help at their current location`,
      {
        type: 'emergency',
        userId,
        location: JSON.stringify(location),
        priority: 'high',
      }
    );
  }, [sendNotification, userId]);

  return {
    notifyLocationUpdate,
    notifyGroupJoin,
    notifyEmergency,
  };
};
