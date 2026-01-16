'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  NotificationsActive,
  Close,
} from '@mui/icons-material';

/* ===========================
   🔔 NOTIFICATION HOOK
=========================== */

function useNotifications(userId: string) {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('Notification' in window)) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Notification permission not granted');
        return false;
      }

      // ✅ test notification
      new Notification('Notifications Enabled ✅', {
        body: 'You will now receive updates.',
      });

      return true;
    } catch (err) {
      console.error(err);
      setError('Failed to enable notifications');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    supported,
    loading,
    error,
    requestPermission,
  };
}

/* ===========================
   📦 MAIN COMPONENT
=========================== */

interface NotificationManagerProps {
  userId: string;
  userName: string;
  isAdmin?: boolean;
}

export default function NotificationManager({
  userId,
  userName,
  isAdmin = false,
}: NotificationManagerProps) {
  const {
    permission,
    supported,
    loading,
    error,
    requestPermission,
  } = useNotifications(userId);

  // 🔕 App-level mute
  const [appMuted, setAppMuted] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleEnable = async () => {
    const success = await requestPermission();
    setSnackbar({
      open: true,
      message: success
        ? 'Notifications enabled successfully!'
        : 'Failed to enable notifications',
      severity: success ? 'success' : 'error',
    });
  };

  const getStatus = () => {
    if (!supported)
      return { label: 'Not Supported', color: 'error', icon: <NotificationsOff /> };
    if (permission === 'granted' && !appMuted)
      return { label: 'Enabled', color: 'success', icon: <NotificationsActive /> };
    if (permission === 'granted' && appMuted)
      return { label: 'Muted', color: 'warning', icon: <NotificationsOff /> };
    if (permission === 'denied')
      return { label: 'Blocked', color: 'error', icon: <NotificationsOff /> };
    return { label: 'Not Enabled', color: 'warning', icon: <Notifications /> };
  };

  const status = getStatus();

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography
                variant="h6"
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 2,
                  py: 0.8,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  color: '#7353ae',
                  backgroundColor: '#f3e8ff',
                }}
              >
                Push Notifications
              </Typography>

              <Chip
                icon={status.icon}
                label={status.label}
                color={status.color as any}
                variant="outlined"
              />
            </Box>

            {/* Errors */}
            {error && <Alert severity="error">{error}</Alert>}

            {!supported && (
              <Alert severity="warning">
                Push notifications are not supported in this browser.
              </Alert>
            )}

            {/* Enable Section */}
            {supported &&
              permission !== 'granted' &&
              permission !== 'denied' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.8rem', mb: 1.5, color: 'text.secondary' }}
                  >
                    Enable push notifications to receive real-time updates and alerts.
                  </Typography>

                  <Box display="flex" justifyContent="center">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Notifications sx={{ fontSize: 16 }} />}
                      onClick={handleEnable}
                      disabled={loading}
                      sx={{
                        height: 36,
                        minWidth: 220,
                        borderRadius: 2,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        background:
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      {loading ? 'Requesting…' : 'Enable Notifications'}
                    </Button>
                  </Box>
                </Box>
              )}

            {/* Enabled + Mute control */}
            {permission === 'granted' && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}
              >
                <Stack spacing={1.5} alignItems="center">
                  <Alert severity="success">
                    Notifications are enabled. You will receive updates.
                  </Alert>

                  <Button
                    size="small"
                    variant="outlined"
                    color={appMuted ? 'success' : 'error'}
                    onClick={() => setAppMuted(prev => !prev)}
                    sx={{
                      height: 34,
                      minWidth: 200,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {appMuted ? 'Enable Notifications' : 'Disable Notifications'}
                  </Button>

                  {appMuted && (
                    <Typography variant="caption" color="text.secondary">
                      Notifications are muted inside the app
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {/* Blocked */}
            {permission === 'denied' && (
              <Alert severity="error">
                Notifications are blocked. Enable them in browser settings.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        action={
          <IconButton
            size="small"
            onClick={() => setSnackbar(s => ({ ...s, open: false }))}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
