'use client';

import { useState, useEffect, useCallback, memo } from 'react';
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
  Avatar,
  TextField,
  InputAdornment,
  Tooltip,
  Badge,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Skeleton,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Block,
  CheckCircle,
  Visibility,
  DirectionsWalk,
  Person,
  TrendingUp,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Phone,
  Email,
  CalendarToday,
  Place,
  Groups,
  Security,
  ManageAccounts,
  RemoveRedEye,
  EditOutlined,
  DeleteOutline,
  Refresh,
  Delete as DeleteIcon,
  FilterList,
  TrendingUp as RouteIcon,
  HomeWork,
  RestartAlt,
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isAdmin: boolean;
  isTracking: boolean;
  pathayathiraiStatus: 'not_started' | 'in_progress' | 'completed';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  startDate?: Date;
  endDate?: Date;
  totalDistance: number;
  visitedTemples: any[];
  groupId?: string;
  groupName?: string;
  joinedGroupAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  isActive: boolean;
  isAdmin: boolean;
  pathayathiraiStatus: 'not_started' | 'in_progress' | 'completed';
  groupId?: string;
}

interface UserStats {
  total: number;
  active: number;
  tracking: number;
  onPathayathirai: number;
  deleted?: number;
}

const StatCard = ({ title, value, icon, color, loading = false }: {
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
          {loading ? <Skeleton variant="circular" width={24} height={24} /> : icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, tracking: 0, onPathayathirai: 0 });
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Individual filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
    isAdmin: false,
    pathayathiraiStatus: 'not_started',
    groupId: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Search filter toggle state
  const [showSearchFilter, setShowSearchFilter] = useState(false);

  // Optimized form handlers for better typing performance
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, phone: value }));
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, password: value }));
  }, []);

  const handleStatusChange = useCallback((e: any) => {
    setFormData(prev => ({ ...prev, pathayathiraiStatus: e.target.value }));
  }, []);

  const handleGroupChange = useCallback((e: any) => {
    setFormData(prev => ({ ...prev, groupId: e.target.value || undefined }));
  }, []);

  const handleActiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isActive: e.target.checked }));
  }, []);

  const handleAdminChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isAdmin: e.target.checked }));
  }, []);

  // Filter handlers for better performance
  const handleNameFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNameFilter(e.target.value);
  }, []);

  const handleEmailFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailFilter(e.target.value);
  }, []);

  const handlePhoneFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneFilter(e.target.value);
  }, []);

  const handleGroupFilterChange = useCallback((e: any) => {
    setGroupFilter(e.target.value);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [nameFilter, emailFilter, phoneFilter, groupFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setShowLoadingAnimation(true);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters for individual filters
      const params = new URLSearchParams();
      if (nameFilter) params.append('name', nameFilter);
      if (emailFilter) params.append('email', emailFilter);
      if (phoneFilter) params.append('phone', phoneFilter);
      if (groupFilter) params.append('group', groupFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const queryString = params.toString();
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Add a delay to show the smooth loading animation
        setTimeout(() => {
          setUsers(data.users);
          setStats(data.stats);
          setShowLoadingAnimation(false);
          setLoading(false);
        }, 2500);
      } else {
        setError('Failed to fetch users');
        setShowLoadingAnimation(false);
        setLoading(false);
      }
    } catch (error) {
      setError('Network error');
      setShowLoadingAnimation(false);
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    setGroupFilter('');
    setSearchTerm('');
  };

  const handleApplyFilters = () => {
    fetchUsers();
    toast.success('Filters applied successfully!', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const handleResetFilters = () => {
    clearAllFilters();
    toast.info('All filters have been reset!', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        console.error('Failed to fetch groups');
      }
    } catch (error) {
      console.error('Network error fetching groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', user?: User) => {
    setDialogMode(mode);
    setSelectedUser(user || null);
    
    if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        isActive: true,
        isAdmin: false,
        pathayathiraiStatus: 'not_started',
        groupId: '',
      });
    } else if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', // Always empty for security
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        pathayathiraiStatus: user.pathayathiraiStatus,
        groupId: user.groupId || '',
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Name is required!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone number is required!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    // Phone number validation (basic check for digits and common formats)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10 || !phoneRegex.test(cleanPhone)) {
      toast.error('Please enter a valid phone number (at least 10 digits)!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    // For password validation - only validate if password is provided
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters if provided!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = dialogMode === 'add' ? '/api/admin/users' : `/api/admin/users/${selectedUser?._id}`;
      const method = dialogMode === 'add' ? 'POST' : 'PUT';
      
      // Prepare form data for submission
      const submitData = { ...formData };
      
      // Remove password if it's empty or not provided
      if (!submitData.password?.trim()) {
        delete submitData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const message = dialogMode === 'add' ? 'User created successfully!' : 'User updated successfully!';
        toast.success(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        handleCloseDialog();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Operation failed!', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error('Network error! Please check your connection.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('User deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Delete failed!', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error('Network error! Please check your connection.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        const message = !isActive ? 'User activated successfully!' : 'User deactivated successfully!';
        toast.success(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Status update failed!', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error('Network error! Please check your connection.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance.toFixed(0)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Format the date in a single line
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return formattedDate;
  };

  return (
    <AdminLayout>
      <Box>
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
                                                  speed={1.5}
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
              Loading Users..
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
       

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3, 
          mb: 3 
        }}>
          <StatCard
            title="Total Users"
            value={stats.total.toLocaleString()}
            icon={<Person />}
            color="#667eea"
          />
          <StatCard
            title="Active Users"
            value={stats.active}
            icon={<CheckCircle />}
            color="#764ba2"
          />
          <StatCard
            title="Currently Tracking"
            value={stats.tracking}
            icon={<LocationOn />}
            color="#8B5CF6"
          />
          <StatCard
            title="On Pathayathirai"
            value={stats.onPathayathirai}
            icon={<DirectionsWalk />}
            color="#667eea"
          />
        </Box>


        {/* Users Table */}
        <Card>
          <CardContent>
            {/* Header with Actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={() => setShowSearchFilter(!showSearchFilter)}
                  sx={{
                    backgroundColor: showSearchFilter ? '#e6efff' : '#f5f5f5',
                    color: showSearchFilter ? '#667eea' : '#666',
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: '#e6efff',
                      color: '#667eea',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FilterList sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#374151' }}>
                  Users

                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchUsers}
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
                  variant="outlined" 
                  onClick={() => router.push('/admin/users/deleted')}
                  startIcon={<DeleteOutline />}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                    },
                  }}
                >
                  Deleted Users ({stats.deleted || 0})
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('add')}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Add User
                </Button>
              </Box>
            </Box>

            {/* Individual Filter Fields */}
            {showSearchFilter && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                  Filter Users
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                      fullWidth
                      label="User Name"
                      placeholder="Enter user name..."
                      value={nameFilter}
                      onChange={handleNameFilterChange}
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
                          transition: 'all 0.2s ease',
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
                      onChange={handleEmailFilterChange}
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
                          transition: 'all 0.2s ease',
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
                      onChange={handlePhoneFilterChange}
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
                          transition: 'all 0.2s ease',
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
                          transition: 'all 0.2s ease',
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
                      <InputLabel>Group</InputLabel>
                      <Select
                        value={groupFilter}
                        label="Group"
                        onChange={handleGroupFilterChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <Groups color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">
                          <em>All Groups</em>
                        </MenuItem>
                        <MenuItem value="solo">Solo Travelers</MenuItem>
                        {groups.map((group) => (
                          <MenuItem key={group._id} value={group._id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Action Buttons Below */}
                  <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={handleResetFilters}
                      startIcon={<RestartAlt />}
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
                      onClick={handleApplyFilters}
                      startIcon={<FilterList />}
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
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2,
                      textAlign: 'center',
                      width: '5%'
                    }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3,
                      width: '18%'
                    }}>
                      User Information
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3, 
                      textAlign: 'left',
                      width: '12%'
                    }}>
                      Joined Date
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 4,
                      width: '15%'
                    }}>
                      Contact Details
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '10%'
                    }}>
                      Group
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '8%'
                    }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '10%'
                    }}>
                      Journey Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '8%'
                    }}>
                      Tracking
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '8%'
                    }}>
                      Progress
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3, 
                      textAlign: 'center',
                      width: '10%'
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3, 
                      textAlign: 'center',
                      width: '18%'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`} sx={{ '& .MuiTableCell-root': { py: 2.5 } }}>
                        {/* S.No */}
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Skeleton 
                            variant="text" 
                            width={30} 
                            height={20}
                            sx={{ mx: 'auto' }}
                          />
                        </TableCell>

                        {/* User Information */}
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Skeleton 
                              variant="circular" 
                              width={40} 
                              height={40}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton 
                                variant="text" 
                                width="80%" 
                                height={24}
                                sx={{ mb: 0.5 }}
                              />
                              <Skeleton 
                                variant="text" 
                                width="60%" 
                                height={16}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell sx={{ textAlign: 'left', px: 3 }}>
                          <Skeleton 
                            variant="text" 
                            width={80} 
                            height={20}
                          />
                        </TableCell>

                        {/* Contact Details */}
                        <TableCell sx={{ minWidth: 200, px: 4 }}>
                          <Box>
                            <Skeleton 
                              variant="text" 
                              width="85%" 
                              height={20}
                              sx={{ mb: 0.5 }}
                            />
                            <Skeleton 
                              variant="text" 
                              width="70%" 
                              height={20}
                            />
                          </Box>
                        </TableCell>

                        {/* Group */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={60} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Role */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={60} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Journey Status */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={80} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Tracking */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <Skeleton 
                              variant="circular" 
                              width={18} 
                              height={18}
                            />
                            <Skeleton 
                              variant="text" 
                              width={40} 
                              height={16}
                            />
                          </Box>
                        </TableCell>

                        {/* Progress */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Skeleton 
                              variant="text" 
                              width={40} 
                              height={20}
                            />
                            <Skeleton 
                              variant="text" 
                              width={60} 
                              height={14}
                            />
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={70} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center" sx={{ py: 2, width: 200 }}>
                          <Box 
                            display="flex" 
                            justifyContent="center" 
                            alignItems="center"
                            gap={1}
                            sx={{ minHeight: 48, width: '100%' }}
                          >
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Actual Data Rows
                    users.map((user,index) => (
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
                       <TableCell align="center" sx={{ py: 2.5, px: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '0.875rem'
                          }}
                        >
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 250, px: 3 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main',
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
                                mb: 0.5
                              }}
                            >
                              {user.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'left', px: 3, minWidth: 120, maxWidth: 140 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {formatJoinDate(user.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 200, px: 4 }}>
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

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" justifyContent="center">
                          {user.groupName ? (
                            <Chip
                              label={user.groupName}
                              color="info"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 34,
                                borderRadius: 2.5,
                                minWidth: 110,
                                px: 1.5,
                                '& .MuiChip-label': { 
                                  px: 2,
                                  py: 0.75
                                }
                              }}
                            />
                          ) : (
                            <Chip
                              label="Solo"
                              color="default"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 34,
                                borderRadius: 2.5,
                                minWidth: 110,
                                px: 1.5,
                                '& .MuiChip-label': { 
                                  px: 2,
                                  py: 0.75
                                }
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            label={user.isAdmin ? 'Admin' : 'User'}
                            color={user.isAdmin ? 'primary' : 'default'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              px: 1.5,
                              '& .MuiChip-label': { 
                                px: 2,
                                py: 0.75
                              }
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            label={getStatusLabel(user.pathayathiraiStatus)}
                            color={getStatusColor(user.pathayathiraiStatus)}
                            size="small"
                            icon={user.pathayathiraiStatus === 'in_progress' ? <DirectionsWalk sx={{ fontSize: 16 }} /> : undefined}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              px: 1.5,
                              '& .MuiChip-label': { 
                                px: 2,
                                py: 0.75
                              },
                              '& .MuiChip-icon': { 
                                fontSize: 16,
                                ml: 0.5
                              }
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          {user.isTracking ? (
                            <Badge color="success" variant="dot">
                              <LocationOn 
                                sx={{ 
                                  color: '#10b981', 
                                  fontSize: 18,
                                  animation: 'pulse 2s infinite'
                                }} 
                              />
                            </Badge>
                          ) : (
                            <LocationOn 
                              sx={{ 
                                color: '#d1d5db', 
                                fontSize: 18
                              }} 
                            />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: user.isTracking ? '#10b981' : '#6b7280',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            {user.isTracking ? 'Live' : 'Offline'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
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

                      <TableCell sx={{ textAlign: 'center', px: 3 }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                            variant={user.isActive ? 'filled' : 'outlined'}
                            icon={user.isActive ? <CheckCircle sx={{ fontSize: 16 }} /> : <Block sx={{ fontSize: 16 }} />}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              px: 1.5,
                              '& .MuiChip-label': { 
                                px: 2,
                                py: 0.75
                              },
                              '& .MuiChip-icon': { 
                                fontSize: 16,
                                ml: 0.5
                              },
                              ...(user.isActive ? {
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                border: '1px solid #16a34a',
                                '&:hover': {
                                  backgroundColor: '#16a34a',
                                }
                              } : {
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: '1px solid #dc2626',
                                '&:hover': {
                                  backgroundColor: '#dc2626',
                                }
                              })
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2.5, px: 3, width: 200 }}>
                        <Box 
                          display="flex" 
                          justifyContent="center" 
                          alignItems="center"
                          gap={1.5}
                          sx={{
                            minHeight: 50,
                            width: '100%',
                            '& .action-button': {
                              width: 38,
                              height: 38,
                              borderRadius: 2.5,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: '1px solid',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
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
                              onClick={() => handleOpenDialog('view', user)}
                           sx={{ 
                                  color: '#3b82f6',
                                  borderColor: '#3b82f6',
                                  backgroundColor: '#eff6ff',
                                  '&:hover': { 
                                    backgroundColor: '#dbeafe',
                                    borderColor: '#2563eb',
                                    color: '#2563eb',
                                  },
                                }}
                            >
                              <RemoveRedEye fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit User" placement="top" arrow>
                            <IconButton 
                              className="action-button"
                              size="small" 
                              onClick={() => handleOpenDialog('edit', user)}
                              sx={{
                                color: '#f59e0b',
                                borderColor: '#f59e0b',
                                backgroundColor: '#fffbeb',
                                '&:hover': { 
                                  backgroundColor: '#fef3c7',
                                  borderColor: '#d97706',
                                  color: '#d97706',
                                },
                              }}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={user.isActive ? 'Deactivate User' : 'Activate User'} placement="top" arrow>
                            <IconButton
                              className="action-button"
                              size="small"
                              onClick={() => handleToggleStatus(user._id, user.isActive)}
                              sx={{
                                color: user.isActive ? '#ef4444' : '#10b981',
                                borderColor: user.isActive ? '#ef4444' : '#10b981',
                                backgroundColor: user.isActive ? '#fef2f2' : '#f0fdf4',
                                '&:hover': { 
                                  backgroundColor: user.isActive ? '#fee2e2' : '#dcfce7',
                                  borderColor: user.isActive ? '#dc2626' : '#059669',
                                  color: user.isActive ? '#dc2626' : '#059669',
                                },
                              }}
                            >
                              {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          {/* Always render delete button container for consistent spacing */}
                          {!user.isAdmin ? (
                            <Tooltip title="Delete User" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => handleDeleteUser(user._id)}
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
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box sx={{ width: 36, height: 36 }} /> // Empty space for admin users
                          )}

                          {/* Always render location button container for consistent spacing */}
                          {user.isTracking ? (
                            <Tooltip title="View Live Location" placement="top" arrow>
                              <IconButton 
                                className="action-button"
                                size="small"
                                sx={{
                                  color: '#10b981',
                                  borderColor: '#10b981',
                                  backgroundColor: '#f0fdf4',
                                  '&:hover': { 
                                    backgroundColor: '#dcfce7',
                                    borderColor: '#059669',
                                    color: '#059669',
                                  },
                                  animation: 'pulse 2s infinite',
                                }}
                              >
                                <LocationOn fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box sx={{ width: 36, height: 36 }} /> // Empty space for non-tracking users
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit/View User Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          TransitionProps={{
            timeout: {
              enter: 500,
              exit: 300,
            },
          }}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
              transform: 'scale(0.8)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: 'slideInUp 0.5s ease-out forwards',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s ease-in-out',
            },
            '@keyframes slideInUp': {
              '0%': {
                transform: 'scale(0.8) translateY(60px)',
                opacity: 0,
              },
              '100%': {
                transform: 'scale(1) translateY(0px)', 
                opacity: 1,
              },
            },
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.4)',
              },
              '70%': {
                boxShadow: '0 0 0 8px rgba(46, 125, 50, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)',
              },
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              textAlign: 'center', 
              py: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderBottom: '3px solid rgba(255,255,255,0.2)'
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  letterSpacing: '0.5px'
                }}
              >
                {dialogMode === 'add' && 'Add New User'}
                {dialogMode === 'edit' && 'Edit User'}
                {dialogMode === 'view' && 'User Details'}
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ 
            p: 4,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
            }
          }}>
            
            {dialogMode === 'view' && selectedUser ? (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #e3f2fd'
                        }}
                      >
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h5" 
                            gutterBottom 
                            color="primary" 
                            sx={{ 
                              fontWeight: 700,
                              mb: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <Person sx={{ fontSize: 28, color: '#3b82f6' }} />
                            Personal Information
                          </Typography>
                          <Stack spacing={3}>
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Person sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Full Name
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.name}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Email sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Email Address
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.email}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Phone sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Phone Number
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.phone}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <CalendarToday sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Member Since
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Groups sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Group Status
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.groupName ? selectedUser.groupName : 'Solo Traveler'}
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #e3f2fd'
                        }}
                      >
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h5" 
                            gutterBottom 
                            color="primary" 
                            sx={{ 
                              fontWeight: 700,
                              mb: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <DirectionsWalk sx={{ fontSize: 28, color: '#3b82f6' }} />
                            Journey Information
                          </Typography>
                          <Stack spacing={3}>
                            <Box 
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                                Journey Status
                              </Typography>
                              <Chip
                                label={getStatusLabel(selectedUser.pathayathiraiStatus)}
                                color={getStatusColor(selectedUser.pathayathiraiStatus)}
                                size="medium"
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  height: 32
                                }}
                              />
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <RouteIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Total Distance Covered
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {formatDistance(selectedUser.totalDistance)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <HomeWork sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Temples Visited
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.visitedTemples.length} temples
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: selectedUser.isTracking ? '#f0fdf4' : '#fef2f2',
                                borderRadius: 2,
                                border: selectedUser.isTracking ? '1px solid #bbf7d0' : '1px solid #fecaca'
                              }}
                            >
                              <LocationOn sx={{ 
                                color: selectedUser.isTracking ? '#16a34a' : '#dc2626', 
                                fontSize: 20 
                              }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Live Tracking
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.95rem',
                                    color: selectedUser.isTracking ? '#16a34a' : '#dc2626'
                                  }}
                                >
                                  {selectedUser.isTracking ? 'Active' : 'Inactive'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {selectedUser.currentLocation && (
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                gap={2}
                                sx={{
                                  p: 2,
                                  backgroundColor: '#f0f9ff',
                                  borderRadius: 2,
                                  border: '1px solid #bae6fd'
                                }}
                              >
                                <Place sx={{ color: '#0ea5e9', fontSize: 20 }} />
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                    Current Location
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                    {selectedUser.currentLocation.latitude.toFixed(4)}, {selectedUser.currentLocation.longitude.toFixed(4)}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                  
                  <Card 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #e3f2fd'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        color="primary" 
                        sx={{ 
                          fontWeight: 700,
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <ManageAccounts sx={{ fontSize: 28, color: '#3b82f6' }} />
                        Account Status
                      </Typography>
                      <Stack direction="row" spacing={3} sx={{ justifyContent: 'center' }}>
                        <Box 
                          sx={{
                            p: 3,
                            backgroundColor: selectedUser.isActive ? '#f0fdf4' : '#fef2f2',
                            borderRadius: 3,
                            border: selectedUser.isActive ? '2px solid #bbf7d0' : '2px solid #fecaca',
                            textAlign: 'center',
                            minWidth: 150,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            }
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                            Account Status
                          </Typography>
                          <Chip
                            label={selectedUser.isActive ? 'Active' : 'Inactive'}
                            color={selectedUser.isActive ? 'success' : 'error'}
                            size="medium"
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              height: 36,
                              px: 2
                            }}
                          />
                        </Box>
                        
                        <Box 
                          sx={{
                            p: 3,
                            backgroundColor: selectedUser.isAdmin ? '#eff6ff' : '#f8fafc',
                            borderRadius: 3,
                            border: selectedUser.isAdmin ? '2px solid #bfdbfe' : '2px solid #e2e8f0',
                            textAlign: 'center',
                            minWidth: 150,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            }
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                            User Role
                          </Typography>
                          <Chip
                            label={selectedUser.isAdmin ? 'Administrator' : 'Standard User'}
                            color={selectedUser.isAdmin ? 'primary' : 'default'}
                            size="medium"
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              height: 36,
                              px: 2
                            }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            ) : (
              <Box component="form" sx={{ mt: 2 }}>
                <Stack spacing={4}>
                  {/* Personal Information Section */}
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        mb: 1, 
                        color: '#1565c0',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Person sx={{ color: '#1565c0', fontSize: 28 }} />
                      Personal Information
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 3,
                        color: '#64748b',
                        fontStyle: 'italic',
                        paddingLeft: 5
                      }}
                    >
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={handleNameChange}
                            required
                            disabled={dialogMode === 'view'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'name',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            required
                            disabled={dialogMode === 'view'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Phone color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'tel',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleEmailChange}
                            required
                            disabled={dialogMode === 'view'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'email',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            placeholder="Enter secure password (min 8 characters)"
                            value={formData.password}
                            onChange={handlePasswordChange}
                            required={dialogMode === 'add'}
                            disabled={dialogMode === 'view'}
                            helperText={dialogMode === 'edit' ? 'Leave empty to keep current password' : ''}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Security color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'new-password',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Journey & Group Configuration */}
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        mb: 1, 
                        color: '#2e7d32',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <DirectionsWalk sx={{ color: '#2e7d32', fontSize: 28 }} />
                      Journey & Group Configuration
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 3,
                        color: '#64748b',
                        fontStyle: 'italic',
                        paddingLeft: 5
                      }}
                    >
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                          <FormControl 
                            fullWidth 
                            disabled={dialogMode === 'view'}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                minHeight: 56,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                              '& .MuiSelect-select': {
                                padding: '16px 14px',
                                display: 'flex',
                                alignItems: 'center',
                              },
                            }}
                          >
                            <InputLabel>Journey Status</InputLabel>
                            <Select
                              value={formData.pathayathiraiStatus}
                              label="Journey Status"
                              onChange={handleStatusChange}
                              renderValue={(selected) => {
                                const statusMap = {
                                  'not_started': { label: 'Not Started', color: '#9e9e9e' },
                                  'in_progress': { label: 'In Progress', color: '#4caf50' },
                                  'completed': { label: 'Completed', color: '#2196f3' }
                                };
                                const status = statusMap[selected as keyof typeof statusMap];
                                return status ? (
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box 
                                      sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        borderRadius: '50%', 
                                        backgroundColor: status.color 
                                      }} 
                                    />
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {status.label}
                                    </Typography>
                                  </Box>
                                ) : selected;
                              }}
                            >
                              <MenuItem value="not_started" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#9e9e9e' 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      Not Started
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Ready to begin spiritual journey
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                              <MenuItem value="in_progress" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#4caf50' 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      In Progress
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Currently on pathayathirai
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                              <MenuItem value="completed" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#2196f3' 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      Completed
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Journey completed successfully
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <FormControl 
                            fullWidth 
                            disabled={dialogMode === 'view' || groupsLoading}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                minHeight: 56,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                              '& .MuiSelect-select': {
                                padding: '16px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: '24px',
                              },
                              '& .MuiInputLabel-root': {
                                backgroundColor: 'white',
                                padding: '0 8px',
                                fontSize: '0.875rem',
                                '&.Mui-focused': {
                                  color: '#2e7d32',
                                },
                              },
                              '& .MuiInputLabel-shrink': {
                                transform: 'translate(14px, -9px) scale(0.75)',
                              },
                            }}
                          >
                            <InputLabel>Choose Group or Travel Type</InputLabel>
                            <Select
                              value={formData.groupId || ''}
                              label="Choose Group or Travel Type"
                              onChange={handleGroupChange}
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return '';
                                }
                                const selectedGroup = groups.find(g => g._id === selected);
                                return selectedGroup ? (
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Groups sx={{ color: '#1976d2', fontSize: 20 }} />
                                    <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                                      {selectedGroup.name}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Person sx={{ color: '#757575', fontSize: 20 }} />
                                    <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                                      Single Traveler
                                    </Typography>
                                  </Box>
                                );
                              }}
                            >
                              <MenuItem value="" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Person 
                                    sx={{ 
                                      color: '#757575', 
                                      fontSize: 20 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      Single Traveler
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Travel individually without a group
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                              {groups.map((group) => (
                                <MenuItem key={group._id} value={group._id} sx={{ py: 2 }}>
                                  <Box display="flex" alignItems="center" gap={2} width="100%">
                                    <Groups 
                                      sx={{ 
                                        color: '#1976d2', 
                                        fontSize: 20 
                                      }} 
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {group.name}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {group.memberCount} of {group.maxMembers} members
                                      </Typography>
                                    </Box>
                                    <Chip 
                                      label={`${group.memberCount}/${group.maxMembers}`} 
                                      size="small" 
                                      color={group.memberCount < group.maxMembers ? "success" : "warning"}
                                      variant="outlined"
                                      sx={{ ml: 1 }}
                                    />
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {groupsLoading && (
                            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="textSecondary">
                                Loading groups...
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Account Settings */}
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        mb: 1, 
                        color: '#c62828',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <ManageAccounts sx={{ color: '#c62828', fontSize: 28 }} />
                      Account Settings
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 3,
                        color: '#64748b',
                        fontStyle: 'italic',
                        paddingLeft: 5
                      }}
                    >
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                      <Box sx={{ flex: 1 }}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #e9ecef',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f1f3f4',
                              borderColor: '#3b82f6',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isActive}
                                onChange={handleActiveChange}
                                disabled={dialogMode === 'view'}
                                color="success"
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#4caf50',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#4caf50',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Active User
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  User can access the application
                                </Typography>
                              </Box>
                            }
                          />
                        </Card>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #e9ecef',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f1f3f4',
                              borderColor: '#3b82f6',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isAdmin}
                                onChange={handleAdminChange}
                                disabled={dialogMode === 'view'}
                                color="primary"
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#c62828',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#c62828',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Admin User
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Has administrative privileges
                                </Typography>
                              </Box>
                            }
                          />
                        </Card>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            gap: 2,
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              startIcon={<Cancel />}
              variant="outlined"
              sx={{
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#bdbdbd',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              {dialogMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {dialogMode !== 'view' && (
              <Button 
                onClick={handleFormSubmit}
                variant="contained"
                startIcon={<Save />}
                disabled={formLoading}
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
              >
                {formLoading ? <CircularProgress size={20} /> : (dialogMode === 'add' ? 'Create User' : 'Update User')}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={cancelDeleteUser}
          maxWidth="xs"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600 , color: '#ef4444'}}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <DeleteIcon sx={{ color: '#ef4444' }} />
            Delete User
          </Box> 
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              Are you sure you want to delete this user?
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteUser}
              variant="outlined"
              size="medium"
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
              onClick={confirmDeleteUser}
              variant="contained"
              color="error"
              size="medium"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
      </Box>
    </AdminLayout>
  );
}
