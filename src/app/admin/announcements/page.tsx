'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  Snackbar,
  Avatar,
  Skeleton,
   Pagination,
  PaginationItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Celebration as CelebrationIcon,
  Send as SendIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CheckCircle,
  Cancel,
  Schedule,
  Campaign,
  PauseCircle,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PriorityHigh as PriorityHighIcon,
  Campaign as CampaignIcon,
  PauseCircle as PauseCircleIcon,
  RestartAlt,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { notifications } from '@mantine/notifications';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'celebration';
  priority?: 'low' | 'medium' | 'high';
  audience: 'all' | 'devotees' | 'volunteers' | 'admins';
  targetAudience: 'all' | 'active_users' | 'specific_location';
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  sendPushNotification: boolean;
  scheduledAt?: string;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// StatCard Component with improved design
const StatCard = ({ title, value, icon, color, loading }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
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
      boxShadow: `0 0 20px #2196F3, 0 8px 25px ${color}25`,
      border: `1px solid ${color}50`,
    }
  }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {loading ? <Skeleton width={60} height={40} /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? <Skeleton width={80} height={20} /> : title}
          </Typography>
        </Box>
        <Box sx={{ color: color, opacity: 0.8 }}>
          {loading ? <Skeleton variant="circular" width={40} height={40} /> : icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Filter states similar to users page
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [titleFilter, setTitleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  // Applied filters are used to actually filter the list only when user clicks "Filter"
  const [appliedFilters, setAppliedFilters] = useState<{ title: string; type: string; status: string; audience: string }>({
    title: '',
    type: '',
    status: '',
    audience: '',
  });
  
  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    notifications.show({
      title: `${icons[type]} ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information'}`,
      message,
      color: type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'orange' : 'blue',
      autoClose: type === 'error' ? 5000 : 4000,
      withCloseButton: true,
      withBorder: true,
      style: {
        borderRadius: '12px',
      },
    });
  };

  // Filter functions
  const handleApplyFilters = () => {
    setAppliedFilters({
      title: titleFilter,
      type: typeFilter,
      status: statusFilter,
      audience: audienceFilter,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setTitleFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setAudienceFilter('');
    setAppliedFilters({ title: '', type: '', status: '', audience: '' });
  };
  
  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent' | 'celebration';
    targetAudience: 'all' | 'active_users' | 'specific_location';
    location: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    sendPushNotification: boolean;
    scheduledAt: string;
    isActive: boolean;
  }>({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    location: {
      latitude: 0,
      longitude: 0,
      radius: 1,
    },
    sendPushNotification: false,
    scheduledAt: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/admin/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch announcements');
      }
      
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      setStatsLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      showNotification(`Failed to fetch announcements: ${errorMessage}`, 'error');
      setStatsLoading(false);
    }
  };



  const handleCreateNew = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      location: { latitude: 0, longitude: 0, radius: 1 },
      sendPushNotification: false,
      scheduledAt: '',
      isActive: true,
    });
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      targetAudience: announcement.targetAudience,
      location: announcement.location || { latitude: 0, longitude: 0, radius: 1 },
      sendPushNotification: announcement.sendPushNotification,
      scheduledAt: announcement.scheduledAt || '',
      isActive: announcement.isActive,
    });
    setSelectedAnnouncement(announcement);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/admin/announcements/${announcementToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to delete announcement');
      }

      await fetchAnnouncements();
      showNotification('Announcement deleted successfully!', 'success');
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showNotification(`Failed to delete announcement: ${errorMessage}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAnnouncementToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const url = dialogMode === 'edit' && selectedAnnouncement
        ? `/api/admin/announcements/${selectedAnnouncement._id}`
        : '/api/admin/announcements';
      
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to save announcement');
      }

      await fetchAnnouncements();
      setDialogOpen(false);
      
      // Show notification message based on mode
      if (dialogMode === 'edit') {
        showNotification('Announcement updated successfully!', 'success');
      } else {
        showNotification('Announcement created successfully!', 'success');
      }
      
    
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showNotification(`Failed to ${dialogMode === 'edit' ? 'update' : 'create'} announcement: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (announcementId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ announcementId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to send notification');
      }

      showNotification('Notification sent successfully!', 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showNotification(`Failed to send notification: ${errorMessage}`, 'error');
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    return (
      (appliedFilters.title === '' || announcement.title.toLowerCase().includes(appliedFilters.title.toLowerCase())) &&
      (appliedFilters.type === '' || announcement.type === appliedFilters.type) &&
      (appliedFilters.status === '' || announcement.isActive.toString() === appliedFilters.status) &&
      (appliedFilters.audience === '' || announcement.audience === appliedFilters.audience)
    );
  });

  // Statistics calculations
  const totalAnnouncements = announcements.length;
  const activeAnnouncements = announcements.filter(a => a.isActive).length;
  const inactiveAnnouncements = announcements.filter(a => !a.isActive).length;
  const importantAnnouncements = announcements.filter(a => a.priority === 'high').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <InfoIcon />;
      case 'warning': return <WarningIcon />;
      case 'urgent': return <ErrorIcon />;
      case 'celebration': return <CelebrationIcon />;
      default: return <InfoIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'urgent': return 'error';
      case 'celebration': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (announcement: Announcement) => {
    if (!announcement.isActive) return 'Inactive';
    if (announcement.scheduledAt && new Date(announcement.scheduledAt) > new Date()) return 'Scheduled';
    return 'Active';
  };

  const getStatusColor = (announcement: Announcement) => {
    if (!announcement.isActive) return 'default';
    if (announcement.scheduledAt && new Date(announcement.scheduledAt) > new Date()) return 'warning';
    return 'success';
  };

  const [page, setPage] = useState(1);
const rowsPerPage = 10;

const totalPages = Math.ceil(filteredAnnouncements.length / rowsPerPage);

const paginatedAnnouncements = filteredAnnouncements.slice(
  (page - 1) * rowsPerPage,
  page * rowsPerPage
);

const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
  setPage(value);
};

useEffect(() => {
  setPage(1);
}, [appliedFilters]);


  return (
    <AdminLayout>
      <Box >
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
                animationData={loadingAnimation}
                play
                loop
                speed={1}
                style={{
                  width: '250px',
                  height: '250px',
                  filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: '#667eea',
                fontWeight: 600,
                textAlign: 'center',
                animation: 'smoothFadeInOut 3s infinite ease-in-out',
                textShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
              }}
            >
              Loading Announcements..
            </Typography>
            <style jsx>{`
              @keyframes smoothFadeInOut {
                0%, 100% { 
                  opacity: 0.5; 
                  transform: translateY(0px);
                }
                50% { 
                  opacity: 1; 
                  transform: translateY(-2px);
                }
              }
              
              @keyframes smoothBounce {
                0%, 100% { 
                  transform: translateY(0px) scale(1);
                }
                50% { 
                  transform: translateY(-5px) scale(1.02);
                }
              }
            `}</style>
          </Box>
        )}
  

        {/* Statistics Cards */}
        <Box sx={{ mb: 4 }}>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
            gap: 2,
            mb: 3 
          }}>
            <StatCard
              title="Total Announcements"
              value={totalAnnouncements.toString()}
              icon={<CampaignIcon sx={{ fontSize: 38 }} />}
              color="#667eea"
              loading={statsLoading}
            />
            <StatCard
              title="Active"
              value={activeAnnouncements.toString()}
              icon={<CheckCircleIcon sx={{ fontSize: 38 }} />}
              color="#764ba2"
              loading={statsLoading}
            />
            <StatCard
              title="Inactive"
              value={inactiveAnnouncements.toString()}
              icon={<PauseCircle sx={{ fontSize: 38 }} />}
              color="#8B5CF6"
              loading={statsLoading}
            />
            <StatCard
              title="Important"
              value={importantAnnouncements.toString()}
              icon={<PriorityHighIcon sx={{ fontSize: 38 }} />}
              color="#667eea"
              loading={statsLoading}
            />
          </Box>
        </Box>

        {/* Announcements Table */}
        <Card>
          <CardContent>
            {/* Header with Actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={() => setShowSearchFilter(!showSearchFilter)}
                  sx={{
                    backgroundColor: showSearchFilter ? '#667eea20' : '#f5f5f5',
                    color: showSearchFilter ? '#667eea' : '#666',
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: '#667eea20',
                      color: '#667eea',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Filter width={20} height={20} />
                </IconButton>
               <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#7353ae' }}>
                Announcements
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchAnnouncements}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  Refresh
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleCreateNew}
                  disabled={loading}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #68306d 100%)',
                    },
                  }}
                >
                  Add Announcement
                </Button>
              </Box>
            </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

            {/* Individual Filter Fields */}
            {showSearchFilter && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
                  Filter Announcements
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                      fullWidth
                      label="Title"
                      placeholder="Enter announcement title"
                      value={titleFilter}
                      onChange={(e) => setTitleFilter(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CampaignIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                    
                    <FormControl
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={typeFilter}
                        label="Type"
                        onChange={(e) => setTypeFilter(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <InfoIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="info">Info</MenuItem>
                        <MenuItem value="warning">Warning</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="celebration">Celebration</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <CheckCircleIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
                      <InputLabel>Audience</InputLabel>
                      <Select
                        value={audienceFilter}
                        label="Audience"
                        onChange={(e) => setAudienceFilter(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <NotificationsIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">All Audiences</MenuItem>
                        <MenuItem value="all">All Users</MenuItem>
                        <MenuItem value="devotees">Devotees</MenuItem>
                        <MenuItem value="volunteers">Volunteers</MenuItem>
                        <MenuItem value="admins">Admins</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<RestartAlt />}
                      onClick={handleResetFilters}
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a6fd8',
                          backgroundColor: '#667eea10',
                          color: '#5a6fd8',
                        },
                      }}
                    >
                      Reset
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<FilterListIcon />}
                      onClick={handleApplyFilters}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        },
                      }}     
                    >
                      Filter
                    </Button>
                  </Box>
                </Box>
            )}

            {/* Table Container */}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #f0f0f0' } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center', width: '60px' }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Announcement Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Target Audience
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Push Notification
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Created
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {statsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} sx={{ '& .MuiTableCell-root': { py: 2.5 } }}>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 250 }}>
                        <Box>
                          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width="60%" height={16} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center">
                          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1.5 }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Skeleton variant="text" width={80} height={16} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center">
                          <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 1.5 }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center">
                          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1.5 }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box>
                          <Skeleton variant="text" width={70} height={16} sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width={60} height={14} />
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2, width: 200 }}>
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 2 }} />
                          <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 2 }} />
                          <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 2 }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
paginatedAnnouncements.map((announcement, index) => (
                    <TableRow 
                      key={announcement._id} 
                      hover 
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f9fafb',
                        },
                        '& .MuiTableCell-root': { py: 2.5 }
                      }}
                    >
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '0.875rem'
                          }}
                        >
{(page - 1) * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#111827',
                              fontSize: '0.9rem',
                              lineHeight: 1.2,
                              mb: 0.5
                            }}
                          >
                            {announcement.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#6b7280',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            {announcement.message.length > 50
                              ? `${announcement.message.substring(0, 50)}...`
                              : announcement.message}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            icon={getTypeIcon(announcement.type)}
                            label={announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                            color={getTypeColor(announcement.type) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                            size="small"
                            sx={{
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
                                color: 'inherit'
                              },
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#374151',
                            fontSize: '0.8rem',
                            fontWeight: 500
                          }}
                        >
                          {announcement.targetAudience.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            icon={announcement.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                            label={getStatusLabel(announcement)}
                            color={getStatusColor(announcement) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 34,
                              minWidth: 110,
                              borderRadius: 2.5,
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              ...(announcement.isActive && {
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                border: '1px solid #16a34a',
                                '&:hover': {
                                  backgroundColor: '#16a34a',
                                }
                              }),
                              ...(!announcement.isActive && {
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: '1px solid #dc2626',
                                '&:hover': {
                                  backgroundColor: '#dc2626',
                                }
                              }),
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
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            icon={announcement.sendPushNotification ? <CheckCircleIcon /> : <CancelIcon />}
                            label={announcement.sendPushNotification ? 'Enabled' : 'Disabled'}
                            color={announcement.sendPushNotification ? 'success' : 'error'}
                            size="small"
                            sx={{
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
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              color: '#374151',
                              fontSize: '0.8rem'
                            }}
                          >
                            {new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              fontSize: '0.65rem',
                              fontWeight: 500
                            }}
                          >
                           {announcement.createdBy?.name && (
  <Typography
    variant="caption"
    sx={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 500 }}
  >
    {announcement.createdBy.name}
  </Typography>
)}

                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2, width: 200 }}>
                        <Box 
                          display="flex" 
                          justifyContent="center" 
                          alignItems="center"
                          gap={1}
                          sx={{
                            minHeight: 48,
                            width: '100%',
                            '& .action-button': {
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: '1px solid',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              flexShrink: 0,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                              }
                            }
                          }}
                        >
                          <Tooltip title="View Details" placement="top" arrow>
                            <IconButton 
                              className="action-button"
                              size="small" 
                              onClick={() => handleView(announcement)}
                              sx={{ 
                                color: '#667eea',
                                borderColor: '#667eea',
                                backgroundColor: '#667eea20',
                                '&:hover': { 
                                  backgroundColor: '#667eea30',
                                  borderColor: '#5a67d8',
                                  color: '#5a67d8',
                                },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Announcement" placement="top" arrow>
                            <IconButton 
                              className="action-button"
                              size="small" 
                              onClick={() => handleEdit(announcement)}
                              sx={{
                                color: '#764ba2',
                                borderColor: '#764ba2',
                                backgroundColor: '#764ba220',
                                '&:hover': { 
                                  backgroundColor: '#764ba230',
                                  borderColor: '#68306d',
                                  color: '#68306d',
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Announcement" placement="top" arrow>
                            <IconButton
                              className="action-button"
                              size="small"
                              onClick={() => handleDeleteClick(announcement)}
                              sx={{
                                color: '#ef4444',
                                borderColor: '#ef4444',
                                backgroundColor: '#fef2f2',
                                '&:hover': { 
                                  backgroundColor: '#fee2e2',
                                  borderColor: '#dc2626',
                                  color: '#dc2626',
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {announcement.sendPushNotification ? (
                            <Tooltip title="Send Notification" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => handleSendNotification(announcement._id)}
                                sx={{
                                  color: '#667eea',
                                  borderColor: '#667eea',
                                  backgroundColor: '#667eea15',
                                  '&:hover': { 
                                    backgroundColor: '#667eea25',
                                    borderColor: '#5a67d8',
                                    color: '#5a67d8',
                                  },
                                }}
                              >
                                <SendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box sx={{ width: 36, height: 36 }} />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredAnnouncements.length === 0 && !statsLoading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                No announcements found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {titleFilter || typeFilter || statusFilter || audienceFilter
                  ? ''
                  : 'Get started by creating your first announcement'}
              </Typography>
            </Box>
          )}

                      {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            size="large"
                            renderItem={(item) => (
                              <PaginationItem
                                {...item}
                                 sx={{
            mx: 0.5,
            minWidth: 42,
            height: 42,
            borderRadius: '50%',
            fontSize: '15px',
            fontWeight: 600,
            transition: 'all 0.25s ease',

            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              boxShadow: '0 6px 14px rgba(102,126,234,0.45)',
              transform: 'scale(1.05)',
            },

            '&:hover': {
              backgroundColor: '#e3f2fd',
              transform: 'translateY(-2px)',
            },
          }}
                              />
                            )}
                          />
                        </Box>
                      )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {dialogMode === 'create' && 'Add Announcement'}
          {dialogMode === 'edit' && 'Edit Announcement'}
          {dialogMode === 'view' && 'Announcement Details'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          {dialogMode === 'view' && selectedAnnouncement ? (
            <Box sx={{ px: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {selectedAnnouncement.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedAnnouncement.message}
                </Typography>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={3}>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" color="textSecondary">Type:</Typography>
                  <Chip
                    icon={getTypeIcon(selectedAnnouncement.type)}
                    label={selectedAnnouncement.type.charAt(0).toUpperCase() + selectedAnnouncement.type.slice(1)}
                    color={getTypeColor(selectedAnnouncement.type) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                    size="small"
                  />
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" color="textSecondary">Target Audience:</Typography>
                  <Typography variant="body2">
                    {selectedAnnouncement.targetAudience.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" color="textSecondary">Status:</Typography>
                  <Chip
                    label={getStatusLabel(selectedAnnouncement)}
                    color={getStatusColor(selectedAnnouncement) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                    size="small"
                  />
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" color="textSecondary">Push Notification:</Typography>
                  <Typography variant="body2">
                    {selectedAnnouncement.sendPushNotification ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
                {selectedAnnouncement.scheduledAt && (
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" color="textSecondary">Scheduled At:</Typography>
                    <Typography variant="body2">
                      {new Date(selectedAnnouncement.scheduledAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" color="textSecondary">Created By:</Typography>
                  <Typography variant="body2">
                    {selectedAnnouncement.createdBy?.name || 'Unknown'} ({selectedAnnouncement.createdBy?.email || 'N/A'})
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ px: 1 }}>
              <Box sx={{ mb: 3, mt: 4 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={dialogMode === 'view'}
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  disabled={dialogMode === 'view'}
                  sx={{ mb: 3 }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box display="flex" gap={2} mb={3}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'warning' | 'urgent' | 'celebration' })}
                      disabled={dialogMode === 'view'}
                    >
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="celebration">Celebration</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Target Audience</InputLabel>
                    <Select
                      value={formData.targetAudience}
                      label="Target Audience"
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as 'all' | 'active_users' | 'specific_location' })}
                      disabled={dialogMode === 'view'}
                    >
                      <MenuItem value="all">All Users</MenuItem>
                      <MenuItem value="active_users">Active Users Only</MenuItem>
                      <MenuItem value="specific_location">Specific Location</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              {(formData.targetAudience as string) === 'specific_location' && (
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={formData.location?.latitude || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        latitude: parseFloat(e.target.value),
                        longitude: formData.location?.longitude || 0,
                        radius: formData.location?.radius || 1,
                      }
                    })}
                    disabled={dialogMode === 'view'}
                  />
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={formData.location?.longitude || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        latitude: formData.location?.latitude || 0,
                        longitude: parseFloat(e.target.value),
                        radius: formData.location?.radius || 1,
                      }
                    })}
                    disabled={dialogMode === 'view'}
                  />
                  <TextField
                    fullWidth
                    label="Radius (km)"
                    type="number"
                    value={formData.location?.radius || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        latitude: formData.location?.latitude || 0,
                        longitude: formData.location?.longitude || 0,
                        radius: parseFloat(e.target.value),
                      }
                    })}
                    disabled={dialogMode === 'view'}
                  />
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Schedule Date & Time"
                type="datetime-local"
                value={formData.scheduledAt || ''}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sendPushNotification}
                        onChange={(e) => setFormData({ ...formData, sendPushNotification: e.target.checked })}
                        disabled={dialogMode === 'view'}
                      />
                    }
                    label="Send Push Notification"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        disabled={dialogMode === 'view'}
                      />
                    }
                    label="Active"
                  />
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setDialogOpen(false)}
            sx={{
              color: '#6c6c6c',
              borderColor: '#d1d5db',
              fontWeight: 'bold',
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(108, 108, 108, 0.1)',
                borderColor: '#9ca3af',
              }
            }}
          >
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              onClick={handleSubmit}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                color: 'white',
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #68306d 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(102, 126, 234, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {loading ? 'Saving...' : dialogMode === 'edit' ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
          }
        }}
      >
       <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: '#ef4444' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <DeleteIcon sx={{ color: '#ef4444' }} />
                  Delete Announcement
                </Box>
              </DialogTitle>
        
        <DialogContent sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body1">
            Are you sure you want to delete this announcement?
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            size="medium"
            disabled={deleting}
            sx={{ 
              px: 3, 
              py: 1,
              borderRadius: 2,
              minWidth: 100
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            size="medium"
            disabled={deleting}
            sx={{ 
              px: 3, 
              py: 1,
              borderRadius: 2,
              minWidth: 100
            }}
          >
            {deleting ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                Deleting...
              </Box>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

     

      </Box>
    </AdminLayout>
  );
}
