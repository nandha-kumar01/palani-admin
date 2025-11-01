'use client';

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  Fab,
  Tooltip,
  Grid,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Schedule,
  Phone,
  Email,
  Visibility,
  CloudUpload,
  Photo,
  Refresh,
  RemoveRedEye,
  EditOutlined,
  DeleteOutline,
  Close,
  OpenInNew,
  Place,
  CheckCircle,
  TrendingUp,
  Visibility as VisibilityIcon,
  Description,
  CalendarToday,
  People,
  Settings,
  Info,
  Image,
  FilterList,
  RestartAlt,
  Cancel,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';
interface Temple {
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timings: {
    opening: string;
    closing: string;
  };
  photo?: string;
  isActive: boolean;
  visitCount: number;
  createdAt: string;
}

interface TempleStats {
  total: number;
  active: number;
  popular: number;
  totalVisits: number;
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
          {loading ? <Skeleton variant="circular" width={40} height={40} /> : icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const initialTempleForm = {
  name: '',
  location: {
    latitude: 0,
    longitude: 0,
    address: '',
  },
  timings: {
    opening: '',
    closing: '',
  },
  photo: '',
};

export default function TemplesPage() {
  // Notification Helper Function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const config = {
      title: type === 'success' ? '✅ Success' : 
             type === 'error' ? '❌ Error' : 
             type === 'warning' ? '⚠️ Warning' : '💡 Info',
      message,
      color: type === 'success' ? 'green' : 
             type === 'error' ? 'red' : 
             type === 'warning' ? 'yellow' : 'blue',
      autoClose: 5000,
      position: 'top-right' as const,
      styles: {
        root: {
          backgroundColor: '#ffffff',
          border: `2px solid ${type === 'success' ? '#10b981' : 
                                type === 'error' ? '#ef4444' : 
                                type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
          '&::before': { backgroundColor: 'transparent' },
        },
        title: { 
          color: type === 'success' ? '#059669' : 
                 type === 'error' ? '#dc2626' : 
                 type === 'warning' ? '#d97706' : '#2563eb',
          fontWeight: 600 
        },
        description: { 
          color: type === 'success' ? '#047857' : 
                 type === 'error' ? '#b91c1c' : 
                 type === 'warning' ? '#b45309' : '#1d4ed8' 
        },
        closeButton: {
          color: type === 'success' ? '#059669' : 
                 type === 'error' ? '#dc2626' : 
                 type === 'warning' ? '#d97706' : '#2563eb',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
        },
      }
    };
    notifications.show(config);
  };

  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [viewingTemple, setViewingTemple] = useState<Temple | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [templeForm, setTempleForm] = useState(initialTempleForm);
  const [submitting, setSubmitting] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);

  const [uploading, setUploading] = useState(false);
  
  // Filter states
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'popular'

  // Filter functions
  const handleApplyFilters = () => {
    // Filters are applied in real-time through filteredTemples, but we can add toast feedback
    showNotification('Filters applied successfully!', 'success');
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setLocationFilter('');
    setStatusFilter('all');
    setShowSearchFilter(false);
    showNotification('All filters have been reset!', 'info');
  };

  // Photo view modal
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');

  // Delete confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [templeToDelete, setTempleToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Statistics state
  const [stats, setStats] = useState<TempleStats>({
    total: 0,
    active: 0,
    popular: 0,
    totalVisits: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchTemples();
  }, []);

   useEffect(() => {
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, 4000); // 3 seconds
  
      return () => clearTimeout(timer);
    }, []);

  // Filter temples based on search criteria
  const filteredTemples = temples.filter(temple => {
    const matchesName = nameFilter === '' || temple.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesLocation = locationFilter === '' || temple.location.address.toLowerCase().includes(locationFilter.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = temple.isActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !temple.isActive;
    } else if (statusFilter === 'popular') {
      matchesStatus = temple.visitCount > 50;
    }
    
    return matchesName && matchesLocation && matchesStatus;
  });

  const fetchTemples = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch all temples without pagination for accurate statistics
      const response = await fetch('/api/admin/temples?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const templesData = data.temples;
        setTemples(templesData);
        
        // Calculate accurate stats
        const total = templesData.length;
        const active = templesData.filter((temple: Temple) => temple.isActive === true).length;
        const popular = templesData.filter((temple: Temple) => temple.visitCount > 50).length;
        const totalVisits = templesData.reduce((sum: number, temple: Temple) => {
          return sum + (temple.visitCount || 0);
        }, 0);
     
        
        setStats({ total, active, popular, totalVisits });
      } else {
        showNotification('Failed to fetch temples', 'error');
      }
    } catch (error) {
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleOpenDialog = (temple?: Temple) => {
    if (temple) {
      setEditingTemple(temple);
      setTempleForm({
        name: temple.name,
        location: temple.location,
        timings: temple.timings,
        photo: temple.photo || '',
      });
    } else {
      setEditingTemple(null);
      setTempleForm(initialTempleForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemple(null);
    setTempleForm(initialTempleForm);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size should be less than 5MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTempleForm({ ...templeForm, photo: data.url });
        showNotification('Photo uploaded successfully', 'success');
      } else {
        console.error('Upload error:', data);
        showNotification(data.error || 'Failed to upload photo', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Error uploading photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingTemple 
        ? `/api/admin/temples/${editingTemple._id}`
        : '/api/admin/temples';
      
      const method = editingTemple ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templeForm),
      });

      if (response.ok) {
        showNotification(editingTemple ? 'Temple updated successfully' : 'Temple created successfully', 'success');
        handleCloseDialog();
        fetchTemples();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      showNotification('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (templeId: string) => {
    setTempleToDelete(templeId);
    setDeleteDialog(true);
  };

  const confirmDeleteTemple = async () => {
    if (!templeToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/temples/${templeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showNotification('Temple deleted successfully', 'success');
        fetchTemples();
      } else {
        showNotification('Failed to delete temple', 'error');
      }
    } catch (error) {
      showNotification('Network error', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
      setTempleToDelete(null);
    }
  };

  const cancelDeleteTemple = () => {
    setDeleteDialog(false);
    setTempleToDelete(null);
  };

  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoViewOpen(true);
  };

  const handleClosePhotoView = () => {
    setPhotoViewOpen(false);
    setSelectedPhoto('');
  };

  // Handle viewing temple details
  const handleViewTemple = (temple: Temple) => {
    setViewingTemple(temple);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewingTemple(null);
  };

  // Generate Google Maps URL
  const generateGoogleMapsUrl = (lat: number, lng: number) => {
    if (lat === 0 && lng === 0) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
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

        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3, 
          mb: 3 
        }}>
          <StatCard
            title="Total Temples"
            value={stats.total}
            icon={<Place sx={{ fontSize: 20 }} />}
            color="#667eea"
            loading={statsLoading}
          />
          <StatCard
            title="Active Temples"
            value={stats.active}
            icon={<CheckCircle sx={{ fontSize: 20 }} />}
            color="#764ba2"
            loading={statsLoading}
          />
          <StatCard
            title="Popular Temples"
            value={stats.popular}
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            loading={statsLoading}
          />
          <StatCard
            title="Total Visits"
            value={stats.totalVisits}
            icon={<VisibilityIcon sx={{ fontSize: 20 }} />}
            color="#667eea"
            loading={statsLoading}
          />
        </Box>

        {/* Temples Table */}
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
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#374151' }}>
                  Temples
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchTemples}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                  startIcon={<Refresh />}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Add Temple
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
                  Filter Temples
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                      fullWidth
                      label="Temple Name"
                      placeholder="Enter temple name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Photo color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            '& fieldset': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                          },
                          '&.Mui-focused': {
                            '& fieldset': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Location"
                      placeholder="Enter location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            '& fieldset': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                          },
                          '&.Mui-focused': {
                            '& fieldset': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      }}
                    />
                </Box>

                {/* Filter Action Buttons */}
                <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<RestartAlt />}
                    onClick={handleResetFilters}
                    sx={{
                      borderColor: '#667eea',
                      color: '#667eea',
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#764ba2',
                        backgroundColor: '#667eea10',
                        color: '#764ba2',
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
                      color: 'white',
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
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
                          <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>S.No</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Temple Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Photo</TableCell>
              
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Timings</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Visits</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center', width: '200px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        {/* S.No Skeleton */}
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        
                        {/* Temple Name Skeleton */}
                        <TableCell>
                          <Skeleton variant="text" width="80%" height={24} />
                        </TableCell>
                        
                        {/* Photo Skeleton */}
                        <TableCell>
                          <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 2 }} />
                        </TableCell>
                        
                        {/* Location Skeleton */}
                        <TableCell>
                          <Box>
                            <Skeleton variant="text" width="90%" height={20} />
                            <Skeleton variant="text" width="60%" height={16} />
                          </Box>
                        </TableCell>
                        
                        {/* Timings Skeleton */}
                        <TableCell>
                          <Skeleton variant="text" width="70%" height={20} />
                        </TableCell>
                        
                        {/* Status Skeleton */}
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={60} height={24} sx={{ mx: 'auto' }} />
                        </TableCell>
                        
                        {/* Visits Skeleton */}
                        <TableCell align="center">
                          <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        
                        {/* Actions Skeleton */}
                        <TableCell align="center" sx={{ width: '200px' }}>
                          <Box display="flex" gap="8px" alignItems="center" justifyContent="center">
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredTemples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No temples found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemples.map((temple,index) => (
                      <TableRow key={temple._id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                         <TableCell align="center" sx={{ py: 2 }}>
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
                         <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {temple.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {temple.photo ? (
                            <Box
                              component="img"
                              src={temple.photo}
                              alt={temple.name}
                              onClick={() => handlePhotoClick(temple.photo!)}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                },
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                bgcolor: 'grey.200',
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Photo color="disabled" />
                            </Box>
                          )}
                        </TableCell>
                       
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LocationOn fontSize="small" color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body2" noWrap>
                              {temple.location.address.substring(0, 30)}...
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                            {temple.location.latitude.toFixed(4)}, {temple.location.longitude.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Schedule fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {temple.timings.opening} - {temple.timings.closing}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={temple.isActive ? <CheckCircle sx={{ fontSize: '18px !important', color: '#ffffff !important' }} /> : <Cancel sx={{ fontSize: '18px !important', color: '#ffffff !important' }} />}
                            label={temple.isActive ? 'Active' : 'Inactive'}
                            size="medium"
                            sx={{
                              minWidth: '110px',
                              height: '34px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: temple.isActive ? '#22c55e' : '#ef4444',
                        border: '1px solid #16a34a',

                              color: 'white',
                              '&:hover': {
                                backgroundColor: temple.isActive ? '#16a34a' : '#dc2626',
                                transform: 'scale(1.02)',
                              },
                              '& .MuiChip-icon': {
                                marginLeft: '8px',
                                marginRight: '-4px',
                              },
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {temple.visitCount}
                          </Typography>
                        </TableCell>
                    <TableCell align="center" sx={{ py: 2, width: '200px' }}>
                                              <Box 
                                                display="flex" 
                                                justifyContent="center" 
                                                alignItems="center"
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
                            {/* View Button */}
                            <Tooltip title="View Details" placement="top" arrow>
                                                         <IconButton
                                                           className="action-button"
                                                           size="small"
                                                           onClick={() => handleViewTemple(temple)}
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

                            {/* Edit Button */}
                          
                            <Tooltip title="Edit Temple" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                               onClick={() => handleOpenDialog(temple)}
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

                            {/* Delete Button */}
                            <Tooltip title="Delete Temple" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                               onClick={() => handleDelete(temple._id)}
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    )))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
           
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              margin: 2,
              maxWidth: '980px',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2, 
            pt: 3, 
            px: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            textAlign: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea, #764ba2, #8b6cc1)',
            }
          }}>
            {/* Close Icon */}
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {editingTemple ? ' Edit Temple' : 'Add Temple'}
            </Typography>
  
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                {/* Left Column - Basic Information */}
                <Box sx={{ flex: 1 }}>
                  <Card sx={{ 
                    p: 3, 
                    height: 'fit-content',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  }}>
                    <Typography variant="h6" sx={{ 
                      mb: 3, 
                      color: '#374151', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                   Basic Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Temple Name */}
                      <TextField
                        fullWidth
                        label="Temple Name"
                        placeholder="Enter temple name..."
                        value={templeForm.name}
                        onChange={(e) => setTempleForm({ ...templeForm, name: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              '& fieldset': {
                                borderColor: '#3b82f6',
                                borderWidth: 2,
                              },
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                            },
                            '&.Mui-focused': {
                              '& fieldset': {
                                borderColor: '#3b82f6',
                                borderWidth: 2,
                              },
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                            },
                          },
                        }}
                      />

                      {/* Photo Upload Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 2, 
                          color: '#374151', 
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                        Temple Photo
                        </Typography>
                        
                        <Box sx={{ 
                          border: '2px dashed #e2e8f0',
                          borderRadius: 3,
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#f57c00',
                            backgroundColor: '#fff3e0',
                          }
                        }}>
                          {templeForm.photo ? (
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                              <Box
                                component="img"
                                src={templeForm.photo}
                                alt="Temple"
                                onClick={() => handlePhotoClick(templeForm.photo)}
                                sx={{
                                  width: 120,
                                  height: 120,
                                  objectFit: 'cover',
                                  borderRadius: 3,
                                  border: '3px solid #f57c00',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                                  },
                                }}
                              />
                              <Box sx={{ mt: 2 }}>
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<CloudUpload />}
                                  disabled={uploading}
                                  size="small"
                                  sx={{
                                    borderRadius: 2,
                                    borderColor: '#f57c00',
                                    color: '#f57c00',
                                    '&:hover': {
                                      borderColor: '#e65100',
                                      backgroundColor: '#fff3e0',
                                    },
                                  }}
                                >
                                  {uploading ? 'Changing...' : 'Change Photo'}
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                  />
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box>
                              <Photo sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                No photo uploaded yet
                              </Typography>
                              <Button
                                variant="contained"
                                component="label"
                                startIcon={<CloudUpload />}
                                disabled={uploading}
                                sx={{
                                  borderRadius: 2,
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                  },
                                }}
                              >
                                {uploading ? 'Uploading...' : 'Upload Photo'}
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                />
                              </Button>
                              <Typography variant="caption" display="block" sx={{ mt: 1, color: '#64748b' }}>
                                Supports JPG, PNG (Max 5MB)
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Box>

                {/* Right Column - Location & Timings */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Location Section */}
                    <Card sx={{ 
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    }}>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        color: '#374151', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                       Location Details
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Address */}
                        <TextField
                          fullWidth
                          label="Temple Address"
                          placeholder="Enter complete address..."
                          value={templeForm.location.address}
                          onChange={(e) => setTempleForm({
                            ...templeForm,
                            location: { ...templeForm.location, address: e.target.value }
                          })}
                          required
                          multiline
                          rows={3}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                '& fieldset': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                              },
                              '&.Mui-focused': {
                                '& fieldset': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                              },
                            },
                          }}
                        />

                        {/* Coordinates Row */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label="Latitude"
                              placeholder="0.000000"
                              type="text"
                              value={templeForm.location.latitude}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers, decimal point, and minus sign
                                if (/^-?\d*\.?\d*$/.test(value)) {
                                  setTempleForm({
                                    ...templeForm,
                                    location: { ...templeForm.location, latitude: parseFloat(value) || 0 }
                                  });
                                }
                              }}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: 'white',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    '& fieldset': {
                                      borderColor: '#3b82f6',
                                      borderWidth: 2,
                                    },
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                  },
                                  '&.Mui-focused': {
                                    '& fieldset': {
                                      borderColor: '#3b82f6',
                                      borderWidth: 2,
                                    },
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                  },
                                },
                              }}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label="Longitude"
                              placeholder="0.000000"
                              type="text"
                              value={templeForm.location.longitude}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers, decimal point, and minus sign
                                if (/^-?\d*\.?\d*$/.test(value)) {
                                  setTempleForm({
                                    ...templeForm,
                                    location: { ...templeForm.location, longitude: parseFloat(value) || 0 }
                                  });
                                }
                              }}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: 'white',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    '& fieldset': {
                                      borderColor: '#3b82f6',
                                      borderWidth: 2,
                                    },
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                  },
                                  '&.Mui-focused': {
                                    '& fieldset': {
                                      borderColor: '#3b82f6',
                                      borderWidth: 2,
                                    },
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                  },
                                },
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Google Maps Link */}
                        {templeForm.location.latitude !== 0 && templeForm.location.longitude !== 0 && (
                          <Box sx={{ 
                            mt: 2, 
                            p: 2, 
                            backgroundColor: '#f0f9ff', 
                            borderRadius: 2,
                            border: '1px solid #bae6fd'
                          }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <LocationOn sx={{ color: '#0284c7', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ color: '#0c4a6e', fontWeight: 600 }}>
                                Google Maps Location
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<OpenInNew />}
                              onClick={() => window.open(generateGoogleMapsUrl(templeForm.location.latitude, templeForm.location.longitude), '_blank')}
                              sx={{
                                borderColor: '#0284c7',
                                color: '#0284c7',
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 2,
                                '&:hover': {
                                  borderColor: '#0369a1',
                                  backgroundColor: '#f0f9ff',
                                },
                              }}
                            >
                              View on Google Maps
                            </Button>
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: '#475569' }}>
                              Coordinates: {templeForm.location.latitude.toFixed(6)}, {templeForm.location.longitude.toFixed(6)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>

                    {/* Timings Section */}
                    <Card sx={{ 
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    }}>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        color: '#374151', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                       Temple Timings
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Opening Time"
                            type="time"
                            value={templeForm.timings.opening}
                            onChange={(e) => setTempleForm({
                              ...templeForm,
                              timings: { ...templeForm.timings, opening: e.target.value }
                            })}
                            InputLabelProps={{ shrink: true }}
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'white',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  '& fieldset': {
                                    borderColor: '#3b82f6',
                                    borderWidth: 2,
                                  },
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                },
                                '&.Mui-focused': {
                                  '& fieldset': {
                                    borderColor: '#3b82f6',
                                    borderWidth: 2,
                                  },
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                },
                              },
                            }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Closing Time"
                            type="time"
                            value={templeForm.timings.closing}
                            onChange={(e) => setTempleForm({
                              ...templeForm,
                              timings: { ...templeForm.timings, closing: e.target.value }
                            })}
                            InputLabelProps={{ shrink: true }}
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'white',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  '& fieldset': {
                                    borderColor: '#3b82f6',
                                    borderWidth: 2,
                                  },
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                },
                                '&.Mui-focused': {
                                  '& fieldset': {
                                    borderColor: '#3b82f6',
                                    borderWidth: 2,
                                  },
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Box>
              </Box>


            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 4, 
            pt: 2, 
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            gap: 2 
          }}>
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                borderColor: '#e2e8f0',
                color: '#64748b',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f1f5f9',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                  boxShadow: 'none',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {submitting ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  {editingTemple ? 'Updating...' : 'Creating...'}
                </Box>
              ) : (
                editingTemple ? 'Update Temple' : 'Create Temple'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Photo View Modal */}
        <Dialog
          open={photoViewOpen}
          onClose={handleClosePhotoView}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden',
            }
          }}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              onClick={handleClosePhotoView}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                },
              }}
            >
              <Close />
            </IconButton>
            {selectedPhoto && (
              <Box
                component="img"
                src={selectedPhoto}
                alt="Temple Full View"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: 3,
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={cancelDeleteTemple}
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
              <Delete sx={{ color: '#ef4444' }} />
              Delete Temple
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to delete this temple?
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteTemple}
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
              onClick={confirmDeleteTemple}
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

        {/* View Temple Details Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              overflow: 'hidden',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2, 
            pt: 3, 
            px: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            textAlign: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea, #764ba2, #8b6cc1)',
            }
          }}>
            <IconButton
              onClick={handleCloseViewDialog}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              Temple Details
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
            {viewingTemple && (
              <Box sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                  gap: 3 
                }}>
                  {/* Basic Information Card */}
                  <Card sx={{ 
                    height: '100%',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: '#f1f5f9',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Info sx={{ color: '#667eea', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Basic Information
                        </Typography>
                      </Box>
                      <Box sx={{ space: 1.5 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.875rem' }}>
                            Temple Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {viewingTemple.name}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.875rem' }}>
                            Address
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#475569' }}>
                            {viewingTemple.location.address || 'Not specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.875rem' }}>
                            Coordinates
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#475569' }}>
                            {viewingTemple.location.latitude}, {viewingTemple.location.longitude}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Timings Card */}
                  <Card sx={{ 
                    height: '100%',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: '#f1f5f9',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Schedule sx={{ color: '#667eea', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Temple Timings
                        </Typography>
                      </Box>
                      <Box sx={{ space: 1.5 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.875rem' }}>
                            Opening Time
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {viewingTemple.timings.opening || 'Not specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.875rem' }}>
                            Closing Time
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {viewingTemple.timings.closing || 'Not specified'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Location Card */}
                  <Card sx={{ 
                    height: '100%',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: '#f1f5f9',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <LocationOn sx={{ color: '#667eea', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Location Details
                        </Typography>
                      </Box>
                      <Box sx={{ space: 1.5 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.875rem' }}>
                            Status
                          </Typography>
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              backgroundColor: '#dcfce7',
                              color: '#16a34a',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                        {generateGoogleMapsUrl(viewingTemple.location.latitude, viewingTemple.location.longitude) && (
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<OpenInNew />}
                              onClick={() => window.open(generateGoogleMapsUrl(viewingTemple.location.latitude, viewingTemple.location.longitude), '_blank')}
                              sx={{
                                borderColor: '#667eea',
                                color: '#667eea',
                                '&:hover': {
                                  borderColor: '#5a6fd8',
                                  backgroundColor: '#f1f5f9',
                                },
                              }}
                            >
                              View on Maps
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Photo Card */}
                  <Card sx={{ 
                    height: '100%',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: '#f1f5f9',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image sx={{ color: '#667eea', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Temple Photo
                        </Typography>
                      </Box>
                      <Box sx={{ space: 1.5 }}>
                        {viewingTemple.photo ? (
                          <Box sx={{ textAlign: 'center' }}>
                            <img
                              src={viewingTemple.photo}
                              alt={viewingTemple.name}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                              }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Photo />}
                              onClick={() => handlePhotoClick(viewingTemple.photo!)}
                              sx={{
                                mt: 2,
                                borderColor: '#667eea',
                                color: '#667eea',
                                '&:hover': {
                                  borderColor: '#5a6fd8',
                                  backgroundColor: '#f1f5f9',
                                },
                              }}
                            >
                              View Full Size
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            backgroundColor: '#f8fafc',
                            borderRadius: 2,
                            border: '2px dashed #cbd5e1'
                          }}>
                            <Image sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              No photo available
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
