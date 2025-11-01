'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import Player from 'react-lottie-player';
import Loading from '../../../../Loading.json';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Pagination,
  InputAdornment,
  Menu,
  Divider,
  Stack,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Collapse
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Send,
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  DeleteForever,
  Visibility,
  Schedule,
  TrendingUp,
  People,
  CheckCircle,
  Cancel,
  Warning,
  Error as ErrorIcon,
  Info,
  Campaign,
  LocationOn,
  Settings,
  Analytics,
  Refresh,
  Close,
  Close as CloseIcon,
  DraftsOutlined,
  MarkEmailRead,
  NotificationImportant,
  Group,
  Person,
  Public,
  AdminPanelSettings,
  SendOutlined,
  ScheduleSend,
  DeleteOutline,
  EditOutlined,
  VisibilityOutlined,
  SmsOutlined,
  EmailOutlined,
  PhoneAndroidOutlined,
  ComputerOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  DateRange,
  TrendingDown,
  StarBorder,
  Star
} from '@mui/icons-material';
import { notifications as mantineNotifications } from '@mantine/notifications';

import AdminLayout from '@/components/admin/AdminLayout';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'emergency' | 'location' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  senderName: string;
  senderRole: string;
  recipientType: 'individual' | 'group' | 'all' | 'role-based' | 'location-based';
  recipients: Array<{
    userId?: { _id: string; name: string; email: string };
    groupId?: { _id: string; name: string };
    role?: string;
    location?: any;
  }>;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  analytics: {
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    clickCount: number;
    openRate: number;
    clickRate: number;
  };
  scheduledFor?: string;
  expiresAt?: string;
  metadata: {
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
    sound?: string;
    icon?: string;
    category?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  isActive: boolean;
}

interface NotificationFilters {
  type: string;
  status: string;
  priority: string;
  recipientType: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Analytics {
  totalNotifications: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  averageOpenRate: number;
  typeStats: Record<string, number>;
  priorityStats: Record<string, number>;
}

const NotificationTypeColors = {
  info: '#2196f3',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  announcement: '#9c27b0',
  emergency: '#d32f2f',
  location: '#00bcd4',
  system: '#607d8b'
};

const PriorityColors = {
  low: '#9e9e9e',
  medium: '#2196f3',
  high: '#ff9800',
  urgent: '#f44336'
};

const StatusColors = {
  draft: '#9e9e9e',
  sent: '#2196f3',
  delivered: '#4caf50',
  read: '#4caf50',
  failed: '#f44336'
};

const StatCard = ({ title, value, icon, color, subtitle, loading = false }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}) => (
  <Card sx={{
    background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
    border: `1px solid ${color}30`,
    transform: 'translateY(0)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 25px ${color}25`,
    }
  }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {loading ? <CircularProgress size={24} /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: color, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: 'green',
      error: 'red',
      warning: 'yellow',
      info: 'blue'
    };

    mantineNotifications.show({
      title: `${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message,
      color: colors[type],
      autoClose: type === 'error' ? 5000 : 4000,
      withCloseButton: true,
    });
  };

  const [filters, setFilters] = useState<NotificationFilters>({
    type: '',
    status: '',
    priority: '',
    recipientType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalCount: 0
  });

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<keyof Notification>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  // Form state for creating notifications
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    recipientType: 'all' as const,
    recipients: [] as any[],
    scheduledFor: '',
    expiresAt: '',
    metadata: {
      actionUrl: '',
      actionText: '',
      imageUrl: ''
    },
    tags: [] as string[]
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('Please login to access notifications', 'error');
        return;
      }
      
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.recipientType && { recipientType: filters.recipientType }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showNotification('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          return;
        }
        
        // Get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setNotifications(result.data?.notifications || []);
        setPagination(prev => ({
          ...prev,
          ...(result.data?.pagination || {})
        }));
        setAnalytics(result.data?.analytics || null);
      } else {
        const errorMsg = result.error || result.message || 'Failed to fetch notifications';
        showNotification(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Fetch notifications error:', error);
      const errorMessage = error.message || 'Network error occurred';
      showNotification(`Failed to fetch notifications: ${errorMessage}`, 'error');
      
      // Set empty data to prevent further errors
      setNotifications([]);
      setAnalytics({
        totalNotifications: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        averageOpenRate: 0,
        typeStats: {},
        priorityStats: {}
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination?.page, pagination?.limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Timer for loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Handle pagination changes
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Trigger fetch with new pagination
    setTimeout(() => fetchNotifications(), 0);
  }, [fetchNotifications]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    // Trigger fetch with new pagination
    setTimeout(() => fetchNotifications(), 0);
  }, [fetchNotifications]);

  const handleCreateNotification = async () => {
    try {
      // Basic validation
      if (!formData.title.trim()) {
        showNotification('Please enter a notification title', 'error');
        return;
      }
      
      if (!formData.message.trim()) {
        showNotification('Please enter a notification message', 'error');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('No authentication token found. Please login again.', 'error');
        return;
      }
      
      // Prepare simplified payload to avoid Group model issues
      const notificationPayload: any = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        recipientType: formData.recipientType, // Keep original recipient type
        recipients: formData.recipientType === 'all' ? [] : formData.recipients,
        scheduledFor: formData.scheduledFor || undefined,
        expiresAt: formData.expiresAt || undefined,
        metadata: {
          actionUrl: formData.metadata.actionUrl || undefined,
          actionText: formData.metadata.actionText || undefined,
          imageUrl: formData.metadata.imageUrl || undefined
        },
        tags: formData.tags || []
      };
      
      // Remove undefined values to clean up payload
      Object.keys(notificationPayload).forEach(key => {
        if (notificationPayload[key] === undefined || notificationPayload[key] === '') {
          delete notificationPayload[key];
        }
      });
            
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showNotification('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          return;
        }
        
        // Get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // Log detailed error for debugging
          console.error('API Error Details:', errorData);
          
          // Show specific error message if available
          if (errorData.details) {
            console.error('Error Details:', errorData.details);
            errorMessage = `${errorMessage}. Details: ${errorData.details}`;
          }
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        showNotification('Notification created successfully!', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchNotifications();
      } else {
        showNotification(result.error || 'Failed to create notification', 'error');
      }
    } catch (error: any) {
      console.error('Create notification error:', error);
      showNotification(`Failed to create notification: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleSendNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('No authentication token found. Please login again.', 'error');
        return;
      }
      
      const response = await fetch(`/api/admin/notifications/${notificationId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showNotification('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          return;
        }
        
        // Get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        showNotification('Notification sent successfully!', 'success');
        fetchNotifications();
      } else {
        showNotification(result.error || 'Failed to send notification', 'error');
      }
    } catch (error: any) {
      console.error('Send notification error:', error);
      showNotification(`Failed to send notification: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('No authentication token found. Please login again.', 'error');
        return;
      }
      
      const response = await fetch(`/api/admin/notifications/${notificationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showNotification('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          return;
        }
        
        // Get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        showNotification('Notification deleted permanently!', 'success');
        fetchNotifications();
      } else {
        showNotification(result.error || 'Failed to delete notification', 'error');
      }
    } catch (error: any) {
      console.error('Delete notification error:', error);
      showNotification(`Failed to delete notification: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const cancelDeleteNotification = () => {
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      recipientType: 'all',
      recipients: [],
      scheduledFor: '',
      expiresAt: '',
      metadata: {
        actionUrl: '',
        actionText: '',
        imageUrl: ''
      },
      tags: []
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info />;
      case 'success': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <ErrorIcon />;
      case 'announcement': return <Campaign />;
      case 'emergency': return <NotificationImportant />;
      case 'location': return <LocationOn />;
      case 'system': return <Settings />;
      default: return <Notifications />;
    }
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case 'individual': return <Person />;
      case 'group': return <Group />;
      case 'all': return <Public />;
      case 'role-based': return <AdminPanelSettings />;
      case 'location-based': return <LocationOn />;
      default: return <People />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send />;
      case 'delivered': return <CheckCircle />;
      case 'read': return <MarkEmailRead />;
      case 'failed': return <Cancel />;
      case 'draft': return <DraftsOutlined />;
      default: return <Notifications />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <NotificationImportant />;
      case 'high': return <Warning />;
      case 'medium': return <Info />;
      case 'low': return <AccessTime />;
      default: return <Info />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const speedDialActions = [
    {
      icon: <Add />,
      name: 'Create Notification',
      onClick: () => setCreateDialogOpen(true)
    },
    {
      icon: <Analytics />,
      name: 'View Analytics',
      onClick: () => {} // TODO: Implement analytics modal
    },
    {
      icon: <Schedule />,
      name: 'Scheduled',
      onClick: () => setFilters(prev => ({ ...prev, status: 'draft' }))
    }
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Enhanced Header with Notification Bell and Count */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          p: 4,
          mb: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />

          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" gap={3}>
              {/* Notification Bell with Badge */}
              <Badge 
                badgeContent={analytics?.totalNotifications || 0} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff4757',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    minWidth: '24px',
                    height: '24px'
                  }
                }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    animation: 'bellRing 2s ease-in-out infinite',
                    '@keyframes bellRing': {
                      '0%, 50%, 100%': { transform: 'rotate(0deg)' },
                      '10%, 30%': { transform: 'rotate(-10deg)' },
                      '20%, 40%': { transform: 'rotate(10deg)' }
                    }
                  }}
                >
                  <NotificationsActive sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Badge>
              
              <Box>
                <Typography variant="h4" component="h1" sx={{ 
                  fontWeight: 'bold', 
                  color: 'white',
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Notification Management Hub
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '1.1rem'
                }}>
                Send real-time notifications • Track engagement • Manage campaigns
                </Typography>
                
                {/* Live Stats */}
                {analytics && (
                  <Box display="flex" gap={3} sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Send sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        {analytics.totalSent || 0} Sent
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircle sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        {analytics.totalDelivered || 0} Delivered
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        {analytics.averageOpenRate?.toFixed(1) || 0}% Open Rate
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            
            {/* Enhanced Action Buttons */}
            <Box display="flex" alignItems="center" gap={2}>
              <Tooltip title="Refresh Notifications">
                <IconButton 
                  onClick={fetchNotifications}
                  disabled={loading}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    transform: loading ? 'rotate(360deg)' : 'rotate(0deg)',
                    transition: 'all 0.6s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'scale(1.1) rotate(180deg)',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }
                  }}
                >
                  <Refresh sx={{ fontSize: 24 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Create New Notification">
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    }
                  }}
                >
                  New Notification
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Enhanced Analytics Cards with Refresh Icons */}
        {analytics ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 3, 
            mb: 4 
          }}>
            <Box sx={{ position: 'relative' }}>
              <StatCard
                title="Total Notifications"
                value={analytics.totalNotifications?.toLocaleString() || '0'}
                icon={<Notifications sx={{ fontSize: 48 }} />}
                color="#667eea"
                loading={loading}
              />
              <Tooltip title="Refresh Total Count">
                <IconButton
                  onClick={fetchNotifications}
                  disabled={loading}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.2)',
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              <StatCard
                title="Sent Notifications"
                value={analytics.totalSent?.toLocaleString() || '0'}
                icon={<Send sx={{ fontSize: 48 }} />}
                color="#4caf50"
                loading={loading}
              />
              <Tooltip title="Refresh Sent Count">
                <IconButton
                  onClick={fetchNotifications}
                  disabled={loading}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#4caf50',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              <StatCard
                title="Delivered"
                value={analytics.totalDelivered?.toLocaleString() || '0'}
                icon={<CheckCircle sx={{ fontSize: 48 }} />}
                color="#2196f3"
                loading={loading}
              />
              <Tooltip title="Refresh Delivery Stats">
                <IconButton
                  onClick={fetchNotifications}
                  disabled={loading}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    color: '#2196f3',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              <StatCard
                title="Average Open Rate"
                value={`${analytics.averageOpenRate?.toFixed(1) || '0'}%`}
                icon={<TrendingUp sx={{ fontSize: 48 }} />}
                color="#ff9800"
                loading={loading}
              />
              <Tooltip title="Refresh Analytics">
                <IconButton
                  onClick={fetchNotifications}
                  disabled={loading}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    color: '#ff9800',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.2)',
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : !loading && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 3, 
            mb: 4 
          }}>
            <StatCard
              title="Total Notifications"
              value="0"
              icon={<Notifications sx={{ fontSize: 48 }} />}
              color="#667eea"
              loading={false}
            />
            <StatCard
              title="Sent Notifications"
              value="0"
              icon={<Send sx={{ fontSize: 48 }} />}
              color="#4caf50"
              loading={false}
            />
            <StatCard
              title="Delivered"
              value="0"
              icon={<CheckCircle sx={{ fontSize: 48 }} />}
              color="#2196f3"
              loading={false}
            />
            <StatCard
              title="Average Open Rate"
              value="0%"
              icon={<TrendingUp sx={{ fontSize: 48 }} />}
              color="#ff9800"
              loading={false}
            />
          </Box>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 2, 
              alignItems: 'center' 
            }}>
              <TextField
                fullWidth
                placeholder="Search notifications..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="location">Location</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="read">Read</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilters({
                  type: '',
                  status: '',
                  priority: '',
                  recipientType: '',
                  search: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })}
                fullWidth
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                onClick={fetchNotifications}
                disabled={loading}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                  }
                }}
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Enhanced Notifications Table */}
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Quick Filter Bar */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: 'fit-content' }}>
            Quick Filters:
            </Typography>
            
            <Chip
              label="All"
              onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
              color={filters.status === '' ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Draft"
              onClick={() => setFilters(prev => ({ ...prev, status: 'draft' }))}
              color={filters.status === 'draft' ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Sent"
              onClick={() => setFilters(prev => ({ ...prev, status: 'sent' }))}
              color={filters.status === 'sent' ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="High Priority"
              onClick={() => setFilters(prev => ({ ...prev, priority: 'high' }))}
              color={filters.priority === 'high' ? 'secondary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Emergency"
              onClick={() => setFilters(prev => ({ ...prev, type: 'emergency' }))}
              color={filters.type === 'emergency' ? 'error' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Tooltip title="View Mode">
              <IconButton
                size="small"
                onClick={() => {
                  if (expandedRows.length === notifications.length) {
                    setExpandedRows([]);
                  } else {
                    setExpandedRows(notifications.map(n => n._id));
                  }
                }}
                sx={{
                  backgroundColor: expandedRows.length > 0 ? '#e3f2fd' : 'transparent',
                  color: expandedRows.length > 0 ? '#1976d2' : 'inherit'
                }}
              >
                {expandedRows.length > 0 ? <VisibilityOutlined /> : <Visibility />}
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderBottom: '1px solid #dee2e6'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              Notifications Table
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  {pagination.totalCount} total notifications
                </Typography>
                <Tooltip title="Refresh Table">
                  <IconButton
                    onClick={fetchNotifications}
                    disabled={loading}
                    sx={{
                      backgroundColor: '#667eea',
                      color: 'white',
                      width: 36,
                      height: 36,
                      '&:hover': {
                        backgroundColor: '#5a6fd8',
                        transform: 'rotate(180deg)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Refresh sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50', textAlign: 'center', width: '60px' }}>
                    S.No
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    <TableSortLabel
                      active={orderBy === 'title'}
                      direction={orderBy === 'title' ? order : 'asc'}
                      onClick={() => {
                        const isAsc = orderBy === 'title' && order === 'asc';
                        setOrder(isAsc ? 'desc' : 'asc');
                        setOrderBy('title');
                        setFilters(prev => ({
                          ...prev,
                          sortBy: 'title',
                          sortOrder: isAsc ? 'desc' : 'asc'
                        }));
                      }}
                    >
                      Notification
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    <TableSortLabel
                      active={orderBy === 'type'}
                      direction={orderBy === 'type' ? order : 'asc'}
                      onClick={() => {
                        const isAsc = orderBy === 'type' && order === 'asc';
                        setOrder(isAsc ? 'desc' : 'asc');
                        setOrderBy('type');
                        setFilters(prev => ({
                          ...prev,
                          sortBy: 'type',
                          sortOrder: isAsc ? 'desc' : 'asc'
                        }));
                      }}
                    >
                      Type & Priority
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50', textAlign: 'center' }}>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => {
                        const isAsc = orderBy === 'status' && order === 'asc';
                        setOrder(isAsc ? 'desc' : 'asc');
                        setOrderBy('status');
                        setFilters(prev => ({
                          ...prev,
                          sortBy: 'status',
                          sortOrder: isAsc ? 'desc' : 'asc'
                        }));
                      }}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Recipients
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Analytics
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'asc'}
                      onClick={() => {
                        const isAsc = orderBy === 'createdAt' && order === 'asc';
                        setOrder(isAsc ? 'desc' : 'asc');
                        setOrderBy('createdAt');
                        setFilters(prev => ({
                          ...prev,
                          sortBy: 'createdAt',
                          sortOrder: isAsc ? 'desc' : 'asc'
                        }));
                      }}
                    >
                      Timeline
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Actions
                  </TableCell>
                  <TableCell padding="checkbox">
                    <Tooltip title="Expand All">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (expandedRows.length === notifications.length) {
                            setExpandedRows([]);
                          } else {
                            setExpandedRows(notifications.map(n => n._id));
                          }
                        }}
                      >
                        {expandedRows.length === notifications.length ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: '#667eea' }} />
                        <Typography variant="body2" color="text.secondary">
                          Loading notifications...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Notifications sx={{ fontSize: 64, color: '#e0e0e0' }} />
                        <Typography variant="h6" color="text.secondary">
                          No notifications found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {filters.search || filters.type || filters.status ? 
                            'Try adjusting your filters to see more results.' :
                            'Create your first notification to get started.'
                          }
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setCreateDialogOpen(true)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            mt: 2
                          }}
                        >
                          Create Notification
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <Fragment key={notification._id}>
                      <TableRow 
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f8f9fa',
                          },
                          cursor: 'pointer'
                        }}
                      >
                        {/* S.No */}
                        <TableCell sx={{ textAlign: 'center', py: 2 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#374151',
                              fontSize: '0.875rem'
                            }}
                          >
                            {(pagination.page - 1) * pagination.limit + notifications.indexOf(notification) + 1}
                          </Typography>
                        </TableCell>
                        
                        {/* Notification Info */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              backgroundColor: NotificationTypeColors[notification.type],
                              width: 40,
                              height: 40
                            }}>
                              {getTypeIcon(notification.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                                {notification.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                {notification.message}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {/* Type & Priority */}
                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Chip
                              icon={getTypeIcon(notification.type)}
                              size="small"
                              label={notification.type.toUpperCase()}
                              sx={{
                                backgroundColor: NotificationTypeColors[notification.type],
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                height: 34,
                                minWidth: 110,
                                borderRadius: 2.5,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                '& .MuiChip-label': { 
                                  px: 1.5,
                                  fontWeight: 600 
                                },
                                '& .MuiChip-icon': {
                                  fontSize: 16,
                                  color: 'white'
                                },
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                }
                              }}
                            />
                            <Chip
                              icon={getPriorityIcon(notification.priority)}
                              size="small"
                              label={notification.priority.toUpperCase()}
                              sx={{
                                backgroundColor: PriorityColors[notification.priority],
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                height: 34,
                                minWidth: 110,
                                borderRadius: 2.5,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                '& .MuiChip-label': { 
                                  px: 1.5,
                                  fontWeight: 600 
                                },
                                '& .MuiChip-icon': {
                                  fontSize: 16,
                                  color: 'white'
                                },
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Chip
                              icon={getStatusIcon(notification.status)}
                              label={notification.status.toUpperCase()}
                              sx={{
                                backgroundColor: StatusColors[notification.status],
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 34,
                                minWidth: 110,
                                borderRadius: 2.5,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                '& .MuiChip-label': { 
                                  px: 1.5,
                                  fontWeight: 600 
                                },
                                '& .MuiChip-icon': {
                                  fontSize: 16,
                                  color: 'white'
                                },
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        
                        {/* Recipients */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getRecipientIcon(notification.recipientType)}
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {notification.analytics.sentCount}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {notification.recipientType.replace('-', ' ')}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {/* Analytics */}
                        <TableCell>
                          <Box sx={{ minWidth: 120 }}>
                            <Box display="flex" alignItems="center" justifyContent="between" sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Open Rate
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color={
                                notification.analytics.openRate > 50 ? '#4caf50' :
                                notification.analytics.openRate > 25 ? '#ff9800' : '#f44336'
                              }>
                                {notification.analytics.openRate.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={notification.analytics.openRate}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: notification.analytics.openRate > 50 ? '#4caf50' :
                                    notification.analytics.openRate > 25 ? '#ff9800' : '#f44336',
                                  borderRadius: 2
                                }
                              }}
                            />
                            <Box display="flex" justifyContent="space-between" sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Delivered: {notification.analytics.deliveredCount}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Read: {notification.analytics.readCount}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {/* Timeline */}
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                              <DateRange sx={{ fontSize: 14, color: '#666' }} />
                              <Typography variant="caption" color="text.secondary">
                                Created
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {formatDate(notification.createdAt)}
                            </Typography>
                            {notification.sentAt && (
                              <>
                                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                                  <Send sx={{ fontSize: 14, color: '#4caf50' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Sent
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="#4caf50">
                                  {formatDate(notification.sentAt)}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell>
                          <Box 
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center" 
                            gap={1}
                            sx={{
                              '& .action-button': {
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: '1px solid',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                }
                              }
                            }}
                          >
                            <Tooltip title="View Details" arrow placement="top">
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => {
                                  setSelectedNotification(notification);
                                  setViewDialogOpen(true);
                                }}
                                sx={{ 
                                  color: '#1976d2',
                                  backgroundColor: '#e3f2fd',
                                  borderColor: '#bbdefb',
                                  '&:hover': {
                                    borderColor: '#1976d2',
                                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                                  }
                                }}
                              >
                                <VisibilityOutlined sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            
                            {notification.status === 'draft' && (
                              <Tooltip title="Send Now" arrow placement="top">
                                <IconButton
                                  className="action-button"
                                  size="small"
                                  onClick={() => handleSendNotification(notification._id)}
                                  sx={{ 
                                    color: '#388e3c',
                                    backgroundColor: '#e8f5e8',
                                    borderColor: '#c8e6c9',
                                    '&:hover': {
                                      borderColor: '#388e3c',
                                      boxShadow: '0 0 0 2px rgba(56, 142, 60, 0.2)',
                                    }
                                  }}
                                >
                                  <SendOutlined sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            <Tooltip title="Delete" arrow placement="top">
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => handleDeleteNotification(notification._id)}
                                disabled={deleting}
                                sx={{ 
                                  color: '#d32f2f',
                                  backgroundColor: '#ffebee',
                                  borderColor: '#ffcdd2',
                                  '&:hover': {
                                    borderColor: '#d32f2f',
                                    boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.2)',
                                  },
                                  '&:disabled': {
                                    backgroundColor: '#f5f5f5',
                                    color: '#bdbdbd',
                                  }
                                }}
                              >
                                {deleting ? (
                                  <CircularProgress size={18} sx={{ color: '#bdbdbd' }} />
                                ) : (
                                  <DeleteOutline sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        
                        {/* Expand/Collapse */}
                        <TableCell padding="checkbox">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (expandedRows.includes(notification._id)) {
                                setExpandedRows(prev => prev.filter(id => id !== notification._id));
                              } else {
                                setExpandedRows(prev => [...prev, notification._id]);
                              }
                            }}
                          >
                            {expandedRows.includes(notification._id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row Content */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse in={expandedRows.includes(notification._id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, m: 1 }}>
                              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                              Detailed Information
                              </Typography>
                              
                              <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                                gap: 3 
                              }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#495057' }}>
                                  Full Message
                                  </Typography>
                                  <Paper sx={{ p: 2, backgroundColor: 'white' }}>
                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                      {notification.message}
                                    </Typography>
                                  </Paper>
                                </Box>
                                
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#495057' }}>
                                  Sender Information
                                  </Typography>
                                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Name:</strong> {notification.senderName}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Role:</strong> {notification.senderRole}
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#495057' }}>
                                  Tags & Metadata
                                  </Typography>
                                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                                    {notification.tags.length > 0 ? (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {notification.tags.map((tag, index) => (
                                          <Chip
                                            key={index}
                                            label={tag}
                                            size="small"
                                            sx={{ fontSize: '0.7rem' }}
                                          />
                                        ))}
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        No tags assigned
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, page) => setPagination(prev => ({ ...prev, page }))}
              color="primary"
              size="large"
            />
          </Box>
        )}

        {/* Create Notification Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Add />
              Create New Notification
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 2, 
              mt: 1 
            }}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                fullWidth
                label="Message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                multiline
                rows={4}
                required
                sx={{ gridColumn: '1 / -1' }}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="location">Location</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ gridColumn: '1 / -1' }}>
                <InputLabel>Recipients</InputLabel>
                <Select
                  value={formData.recipientType}
                  label="Recipients"
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientType: e.target.value as any }))}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="individual">Individual Users</MenuItem>
                  <MenuItem value="group">Group Members</MenuItem>
                  <MenuItem value="role-based">Role Based</MenuItem>
                  <MenuItem value="location-based">Location Based</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Action URL"
                value={formData.metadata.actionUrl}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metadata: { ...prev.metadata, actionUrl: e.target.value }
                }))}
                placeholder="https://example.com"
              />
              <TextField
                fullWidth
                label="Action Text"
                value={formData.metadata.actionText}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metadata: { ...prev.metadata, actionText: e.target.value }
                }))}
                placeholder="View Details"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateNotification}
              disabled={!formData.title || !formData.message}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              Create Notification
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Notification Dialog - Modern Design */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }
          }}
        >
          {selectedNotification && (
            <>
              {/* Header with Gradient Background */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                />
                
                <Box display="flex" alignItems="center" gap={2} sx={{ position: 'relative', zIndex: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 60,
                      height: 60,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    {getTypeIcon(selectedNotification.type)}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                      {selectedNotification.title}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={selectedNotification.type.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 600,
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Chip
                        label={selectedNotification.priority.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: PriorityColors[selectedNotification.priority],
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                      <Chip
                        label={selectedNotification.status.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: StatusColors[selectedNotification.status],
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => setViewDialogOpen(false)}
                    sx={{ 
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      '&:hover': { 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              <DialogContent sx={{ p: 0 }}>
                {/* Message Section */}
                <Box sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    Message Content
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: 'white',
                      border: '1px solid #e9ecef',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#495057' }}>
                      {selectedNotification.message}
                    </Typography>
                  </Paper>
                </Box>


                {/* Timeline Section */}
                <Box sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                   Timeline
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 2,
                        backgroundColor: 'white',
                        borderRadius: 2,
                        border: '1px solid #dee2e6',
                        minWidth: 200
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2'
                        }}
                      >
                      
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDate(selectedNotification.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    {selectedNotification.sentAt && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 2,
                          backgroundColor: 'white',
                          borderRadius: 2,
                          border: '1px solid #dee2e6',
                          minWidth: 200
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#e8f5e8',
                            color: '#2e7d32'
                          }}
                        >
                          🚀
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Sent
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatDate(selectedNotification.sentAt)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa', gap: 2 }}>
                <Button 
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ 
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Close
                </Button>
                {selectedNotification.status === 'draft' && (
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={() => {
                      handleSendNotification(selectedNotification._id);
                      setViewDialogOpen(false);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 3,
                      px: 4,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Send Now
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={cancelDeleteNotification}
          maxWidth="xs"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 2, 
            color: '#d32f2f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}>
            <Delete sx={{ color: '#d32f2f' }} />
            Delete Notification
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to delete this notification?
            </Typography>
          
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteNotification} 
              variant="outlined"
              size="medium"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
              
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteNotification} 
              variant="contained"
              color="error"
              size="medium"
              disabled={deleting}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
                
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Speed Dial */}
        <SpeedDial
          ariaLabel="Notification Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>

        {/* Toast Container - Fixed for Next.js 15 */}
        

        {/* Loading Animation Overlay */}
        {showLoadingAnimation && (
          <Box
              sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <Box
               sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'smoothBounce 2s infinite ease-in-out',
              }}
            >
              <Player
                play
                loop
                animationData={Loading}
                  style={{
                  width: '250px',
                  height: '250px',
                  filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))',
                  display: 'block',
                  margin: '0 auto',
                }}
                speed={1}
              />
              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                  color: '#667eea',
                  fontWeight: 600,
                  animation: 'smoothFadeInOut 2s ease-in-out infinite alternate',
                  '@keyframes smoothFadeInOut': {
                    '0%': {
                      opacity: 0.7,
                    },
                    '100%': {
                      opacity: 1,
                    },
                  },
                }}
              >
                Loading Notifications..
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}