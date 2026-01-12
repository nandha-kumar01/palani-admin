'use client';

import { useState, useEffect } from 'react';
import Player from 'react-lottie-player';
import Loading from '../../../../../Loading.json';
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
  CircularProgress,
  Avatar,
  TextField,
  InputAdornment,
  Tooltip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Skeleton,
    Pagination,
  PaginationItem,
} from '@mui/material';
import {
  Search,
  RestoreFromTrash,
  DeleteForever,
  Person,
  Email,
  Phone,
  CalendarToday,
  Groups,
  Refresh,
  ArrowBack,
  TrendingDown,
  Schedule,
  Today,
  FilterList,
  RestartAlt,
  CheckCircle,
  Cancel,
  AdminPanelSettings,
  Group,
  DirectionsWalk,
  Flag,
  LocationOn,
  
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

interface DeletedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isAdmin: boolean;
  isTracking: boolean;
  pathayathiraiStatus: 'not_started' | 'in_progress' | 'completed';
  totalDistance: number;
  visitedTemples: any[];
  groupId?: string;
  groupName?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string;
  deletedDate: string;
  deletedTime: string;
}

interface DeletedUserStats {
  totalDeleted: number;
  deletedToday: number;
  deletedThisWeek: number;
  deletedThisMonth: number;
}

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

export default function DeletedUsersPage() {
  const router = useRouter();
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [stats, setStats] = useState<DeletedUserStats>({ 
    totalDeleted: 0, 
    deletedToday: 0, 
    deletedThisWeek: 0, 
    deletedThisMonth: 0 
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  
  // Individual filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Search filter toggle state
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  
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
  
  // Dialog states
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [userToRestore, setUserToRestore] = useState<string | null>(null);
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState(false);
  const [userToPermanentDelete, setUserToPermanentDelete] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Filter functions
  const handleApplyFilters = () => {
      setPage(1);       // 🔥 important
    fetchDeletedUsers();
  };
const handleResetFilters = () => {
  setNameFilter('');
  setEmailFilter('');
  setPhoneFilter('');
  setRoleFilter('');
  setStatusFilter('');
  setSearchTerm('');
  setShowSearchFilter(false);

  // 🔥 reset button click pannina data refresh
  fetchDeletedUsers();
};


  useEffect(() => {
    fetchDeletedUsers();
  }, [nameFilter, emailFilter, phoneFilter, roleFilter, statusFilter, searchTerm]);

  // Timer for loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const fetchDeletedUsers = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters for individual filters
      const params = new URLSearchParams();
      if (nameFilter) params.append('name', nameFilter);
      if (emailFilter) params.append('email', emailFilter);
      if (phoneFilter) params.append('phone', phoneFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const queryString = params.toString();
      const url = `/api/admin/users/deleted${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeletedUsers(data.deletedUsers);
        setStats(data.stats);
      } else {
        setError('Failed to fetch deleted users');
        showNotification('Failed to fetch deleted users', 'error');
      }
    } catch (error) {
      setError('Network error');
      showNotification('Network error occurred', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    setUserToRestore(userId);
    setRestoreDialog(true);
  };

  const confirmRestoreUser = async () => {
    if (!userToRestore) return;
    
    setRestoring(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users/deleted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userToRestore }),
      });

      if (response.ok) {
        showNotification('User restored successfully!', 'success');
        fetchDeletedUsers();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Restore failed!', 'error');
      }
    } catch (error) {
      showNotification('Network error! Please check your connection.', 'error');
    } finally {
      setRestoring(false);
      setRestoreDialog(false);
      setUserToRestore(null);
    }
  };

  const cancelRestoreUser = () => {
    setRestoreDialog(false);
    setUserToRestore(null);
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setSearchTerm('');
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance.toFixed(0)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'On Journey';
      case 'completed':
        return 'Completed';
      default:
        return 'Not Started';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'success';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Helper function for Group chip
  const getGroupChip = (user: DeletedUser) => {
    const hasGroup = user.groupId && user.groupName;
    
    return (
      <Chip
        icon={<Group />}
        label={hasGroup ? user.groupName : 'No Group'}
        sx={{
          backgroundColor: hasGroup ? '#9c27b0' : '#9e9e9e',
          color: 'white',
          fontSize: '0.8rem',
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
    );
  };

  // Helper function for Role chip
  const getRoleChip = (user: DeletedUser) => {
    const role = user.isAdmin ? 'Admin' : 'User';
    const isAdmin = user.isAdmin;
    
    return (
      <Chip
        icon={<AdminPanelSettings />}
        label={role}
        sx={{
          backgroundColor: isAdmin ? '#3f51b5' : '#607d8b',
          color: 'white',
          fontSize: '0.8rem',
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
    );
  };

  // Helper function for Journey Status chip
  const getJourneyStatusChip = (user: DeletedUser) => {
    const status = user.pathayathiraiStatus;
    let statusColor = '#9e9e9e'; // Default gray for not_started
    let statusText = 'Not Started';
    let statusIcon = <Flag />;

    switch (status) {
      case 'in_progress':
        statusColor = '#2196f3'; // Blue for in progress
        statusText = 'In Progress';
        statusIcon = <DirectionsWalk />;
        break;
      case 'completed':
        statusColor = '#4caf50'; // Green for completed
        statusText = 'Completed';
        statusIcon = <CheckCircle />;
        break;
      default:
        statusColor = '#9e9e9e'; // Gray for not started
        statusText = 'Not Started';
        statusIcon = <Flag />;
    }

    return (
      <Chip
        icon={statusIcon}
        label={statusText}
        sx={{
          backgroundColor: statusColor,
          color: 'white',
          fontSize: '0.8rem',
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
    );
  };

  // Helper function for Status chip (Active/Inactive)
  const getStatusChip = (user: DeletedUser) => {
    const isActive = user.isActive;
    
    return (
      <Chip
        icon={isActive ? <CheckCircle /> : <Cancel />}
        label={isActive ? 'Active' : 'Inactive'}
        sx={{
          backgroundColor: isActive ? '#22c55e' : '#ef4444',
          color: 'white',
          fontSize: '0.8rem',
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
    );
  };

  const [page, setPage] = useState(1);
const rowsPerPage = 10;

const handlePageChange = (_: any, value: number) => {
  setPage(value);
};

  const totalPages = Math.ceil(deletedUsers.length / rowsPerPage);

const paginatedUsers = deletedUsers.slice(
  (page - 1) * rowsPerPage,
  page * rowsPerPage
);

 useEffect(() => {
  fetchDeletedUsers();
}, []);
 

  return (
    <AdminLayout>
      <Box>
        
        {/* Statistics Cards */}
        <Box sx={{ mb: 4 }}>
        
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
            gap: 2,
            mb: 3 
          }}>
            <StatCard
              title="Total Deleted"
              value={stats.totalDeleted.toLocaleString()}
              icon={<DeleteForever sx={{ fontSize: 38 }} />}
              color="#667eea"
              loading={statsLoading}
            />
            <StatCard
              title="Deleted Today"
              value={stats.deletedToday}
              icon={<Today sx={{ fontSize: 38 }} />}
              color="#764ba2"
              loading={statsLoading}
            />
            <StatCard
              title="This Week"
              value={stats.deletedThisWeek}
              icon={<Schedule sx={{ fontSize: 38 }} />}
              color="#8B5CF6"
              loading={statsLoading}
            />
            <StatCard
              title="This Month"
              value={stats.deletedThisMonth}
              icon={<TrendingDown sx={{ fontSize: 38 }} />}
              color="#667eea"
              loading={statsLoading}
            />
          </Box>
        </Box>

        {/* Deleted Users Table */}
        <Card>
          <CardContent>
            {/* Table Card Header with Actions */}
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
                  Deleted Users List
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchDeletedUsers}
                  startIcon={<Refresh />}
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
                  startIcon={<ArrowBack />}
                  onClick={() => router.push('/admin/users')}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    },
                  }}
                >
                  Back to Users
                </Button>
              </Box>
            </Box>

            {/* Individual Filter Fields */}
            {showSearchFilter && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8f9ff', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e0e7ff' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: 'bold' }}>
                  Filter Deleted Users
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="User Name"
                    placeholder="Enter user name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
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
                  
                  <TextField
                    fullWidth
                    label="Email"
                    placeholder="Enter email address..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
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

                  <TextField
                    fullWidth
                    label="Phone"
                    placeholder="Enter phone number..."
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="action" />
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
                    startIcon={<FilterList />}
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

            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #f0f0f0' } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      User Information
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Contact Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Group
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Journey Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Progress
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Deleted On
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`} sx={{ '& .MuiTableCell-root': { py: 2.5 } }}>
                        <TableCell align="center">
                          <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 0.5 }} />
                              <Skeleton variant="text" width="60%" height={16} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Skeleton variant="text" width="85%" height={20} sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width="70%" height={20} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Skeleton variant="text" width={40} height={20} />
                            <Skeleton variant="text" width={60} height={14} />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Skeleton variant="text" width={80} height={20} />
                            <Skeleton variant="text" width={60} height={14} />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 2 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : deletedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                          <DeleteForever sx={{ fontSize: 64, color: '#d1d5db' }} />
                          <Typography variant="h6" color="textSecondary">
                            No deleted users found
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {searchTerm ? 'Try adjusting your search criteria' : 'All users are currently active'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Actual Data Rows
                    paginatedUsers.map((user, index) => (
                      <TableRow 
                        key={user._id} 
                        hover 
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#f9fafb',
                            transition: 'all 0.2s ease',
                          },
                          '& .MuiTableCell-root': { py: 2.5 }
                        }}
                      >
                        <TableCell align="center">
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
                        
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar 
                              sx={{ 
                                bgcolor: '#ef4444',
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                                fontWeight: 600
                              }}
                            >
                              {user?.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: '#111827',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.2,
                                  mb: 0.5,
                                  position: 'relative',
                                  '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '50%',
                                    left: 0,
                                    right: 0,
                                    height: '1px',
                                    backgroundColor: '#dc2626',
                                  }
                                }}
                              >
                                {user.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label="DELETED"
                                  size="small"
                                  sx={{
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    fontSize: '0.65rem',
                                    height: 20,
                                    fontWeight: 600,
                                    border: '1px solid #fecaca'
                                  }}
                                />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#6b7280',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}
                                >
                                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ minWidth: 200 }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#374151',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <Email sx={{ fontSize: 14, color: '#6b7280' }} />
                              {user.email}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#6b7280',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <Phone sx={{ fontSize: 14, color: '#6b7280' }} />
                              {user.phone}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getGroupChip(user)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getRoleChip(user)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getJourneyStatusChip(user)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 700,
                                color: '#374151',
                                fontSize: '0.8rem'
                              }}
                            >
                              {formatDistance(user.totalDistance)}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Box 
                                sx={{ 
                                  width: 4, 
                                  height: 4, 
                                  borderRadius: '50%', 
                                  backgroundColor: '#f59e0b'
                                }} 
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#6b7280',
                                  fontSize: '0.65rem',
                                  fontWeight: 500
                                }}
                              >
                                {user.visitedTemples.length} temples
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getStatusChip(user)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#dc2626',
                                fontSize: '0.8rem'
                              }}
                            >
                              {user.deletedDate}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#6b7280',
                                fontSize: '0.7rem'
                              }}
                            >
                              {user.deletedTime}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 2, width: 150 }}>
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
                            <Tooltip title="Restore User" placement="top" arrow>
                              <IconButton 
                                className="action-button"
                                size="small" 
                                onClick={() => handleRestoreUser(user._id)}
                                sx={{
                                  color: '#10b981',
                                  borderColor: '#10b981',
                                  backgroundColor: '#f0fdf4',
                                  '&:hover': { 
                                    backgroundColor: '#dcfce7',
                                    borderColor: '#059669',
                                    color: '#059669',
                                  },
                                }}
                              >
                                <RestoreFromTrash fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

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

        {/* Restore Confirmation Dialog */}
        <Dialog
          open={restoreDialog}
          onClose={cancelRestoreUser}
          maxWidth="xs"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: '#10b981' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <RestoreFromTrash sx={{ color: '#10b981' }} />
              Restore User
            </Box>
          </DialogTitle>
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to restore this user?
            </Typography>
        
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelRestoreUser} 
              variant="outlined"
              size="medium"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#bdbdbd',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmRestoreUser} 
              variant="contained"
              color="success"
              size="medium"
              disabled={restoring}
              startIcon={restoring ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
                backgroundColor: '#10b981',
                '&:hover': {
                  backgroundColor: '#059669',
                },
              }}
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogActions>
        </Dialog>

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
                Loading Deleted Users..
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}
