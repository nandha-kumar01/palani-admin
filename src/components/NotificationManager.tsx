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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  NotificationsActive,
  Send,
  Close,
} from '@mui/icons-material';
import { useNotifications, useLocationNotifications } from '@/hooks/useNotifications';

interface NotificationManagerProps {
  userId: string;
  userName: string;
  isAdmin?: boolean;
}

export default function NotificationManager({ 
  userId, 
  userName, 
  isAdmin = false 
}: NotificationManagerProps) {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendToUserId, setSendToUserId] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const {
    permission,
    token,
    supported,
    loading,
    error,
    requestPermission,
    sendNotification,
  } = useNotifications({
    userId,
    autoRequest: true,
  });

  const {
    notifyLocationUpdate,
    notifyGroupJoin,
    notifyEmergency,
  } = useLocationNotifications(userId);

  const handleRequestPermission = async () => {
    const success = await requestPermission();
    if (success) {
      setSnackbar({
        open: true,
        message: 'Notifications enabled successfully!',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to enable notifications',
        severity: 'error',
      });
    }
  };

  const handleSendNotification = async () => {
    if (!sendToUserId || !notificationTitle || !notificationBody) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error',
      });
      return;
    }

    const success = await sendNotification(
      sendToUserId,
      notificationTitle,
      notificationBody,
      {
        type: 'admin_message',
        sentBy: userName,
        timestamp: Date.now(),
      }
    );

    if (success) {
      setSnackbar({
        open: true,
        message: 'Notification sent successfully!',
        severity: 'success',
      });
      setShowSendDialog(false);
      setSendToUserId('');
      setNotificationTitle('');
      setNotificationBody('');
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to send notification',
        severity: 'error',
      });
    }
  };

  const getPermissionStatus = () => {
    if (!supported) return { color: 'error', label: 'Not Supported', icon: NotificationsOff };
    if (permission === 'granted') return { color: 'success', label: 'Enabled', icon: NotificationsActive };
    if (permission === 'denied') return { color: 'error', label: 'Denied', icon: NotificationsOff };
    return { color: 'warning', label: 'Not Enabled', icon: Notifications };
  };

  const statusInfo = getPermissionStatus();

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">
                Push Notifications
              </Typography>
              <Chip
                icon={<statusInfo.icon />}
                label={statusInfo.label}
                color={statusInfo.color as any}
                variant="outlined"
              />
            </Box>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {!supported && (
              <Alert severity="warning">
                Push notifications are not supported in this browser.
              </Alert>
            )}

            {supported && permission !== 'granted' && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Enable push notifications to receive real-time updates about location changes, 
                  group activities, and important alerts.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Notifications />}
                  onClick={handleRequestPermission}
                  disabled={loading || permission === 'denied'}
                  fullWidth
                >
                  {loading ? 'Requesting...' : 'Enable Notifications'}
                </Button>
              </Box>
            )}

            {permission === 'granted' && token && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Notifications are enabled! You'll receive real-time updates.
                </Alert>
                
                {isAdmin && (
                  <Button
                    variant="outlined"
                    startIcon={<Send />}
                    onClick={() => setShowSendDialog(true)}
                    fullWidth
                  >
                    Send Notification
                  </Button>
                )}
              </Box>
            )}

            {permission === 'denied' && (
              <Alert severity="error">
                Notifications are blocked. Please enable them in your browser settings to receive updates.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={showSendDialog} onClose={() => setShowSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="User ID"
              value={sendToUserId}
              onChange={(e) => setSendToUserId(e.target.value)}
              placeholder="Enter user ID to send notification to"
            />
            <TextField
              fullWidth
              label="Title"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="Notification title"
            />
            <TextField
              fullWidth
              label="Message"
              value={notificationBody}
              onChange={(e) => setNotificationBody(e.target.value)}
              placeholder="Notification message"
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendNotification}
            variant="contained"
            disabled={!sendToUserId || !notificationTitle || !notificationBody}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
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
