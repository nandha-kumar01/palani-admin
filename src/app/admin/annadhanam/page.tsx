'use client';

import { useState, useEffect } from 'react';
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
  Tooltip,
  InputAdornment,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  Add,
  Restaurant,
  LocationOn,
  Schedule,
  Phone,
  Person,
  Visibility,
  CloudUpload,
  Photo,
  Refresh,
  RemoveRedEye,
  EditOutlined,
  DeleteOutline,
  Close,
  OpenInNew,
  AccessTime,
  Groups,
  CheckCircle,
  Cancel,
  ExpandMore,
  Info,
   Delete as DeleteIcon,
  TrendingUp,
  RestaurantMenu,
  People,
  FilterList,
  RestartAlt,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import { notifications } from '@mantine/notifications';
import AdminLayout from '@/components/admin/AdminLayout';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface Timing {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Annadhanam {
  _id: string;
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timings: Timing[];
  foodType: string;
  capacity?: number;
  currentAvailability: boolean;
  organizer: {
    name: string;
    contact: string;
  };
  images: string[];
  isActive: boolean;
  specialInstructions?: string;
  createdAt: string;
}

interface AnnadhanamStats {
  total: number;
  active: number;
  available: number;
  totalCapacity: number;
}

const foodTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'all', label: 'All Meals' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 25px ${color}25`,
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
const initialAnnadhanamForm = {
  name: '',
  description: '',
  location: {
    latitude: 0,
    longitude: 0,
    address: '',
  },
  timings: daysOfWeek.map(day => ({
    day,
    startTime: '06:00',
    endTime: '18:00',
    isAvailable: true,
  })),
  foodType: 'lunch',
  capacity: 0,
  currentAvailability: true,
  organizer: {
    name: '',
    contact: '',
  },
  images: [] as string[],
  isActive: true,
  specialInstructions: '',
};

export default function AnnadhanamPage() {
  const [annadhanamList, setAnnadhanamList] = useState<Annadhanam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAnnadhanam, setEditingAnnadhanam] = useState<Annadhanam | null>(null);
  const [annadhanamForm, setAnnadhanamForm] = useState(initialAnnadhanamForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Filter states
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Photo view modal
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');

  // Delete confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [annadhanamToDelete, setAnnadhanamToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View dialog states
  const [viewDialog, setViewDialog] = useState(false);
  const [viewingAnnadhanam, setViewingAnnadhanam] = useState<Annadhanam | null>(null);

  // Statistics state
  const [stats, setStats] = useState<AnnadhanamStats>({
    total: 0,
    active: 0,
    available: 0,
    totalCapacity: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

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

  useEffect(() => {
    fetchAnnadhanamList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Filter annadhanam based on search criteria
  const filteredAnnadhanamList = annadhanamList.filter(annadhanam => {
    const matchesName = nameFilter === '' || annadhanam.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesLocation = locationFilter === '' || annadhanam.location.address.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesFoodType = foodTypeFilter === 'all' || annadhanam.foodType === foodTypeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = annadhanam.isActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !annadhanam.isActive;
    }
    
    return matchesName && matchesLocation && matchesFoodType && matchesStatus;
  });

  const handleApplyFilters = () => {
    // Filters are applied automatically through filteredAnnadhanamList
    showNotification('Filters applied successfully!', 'success');
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setLocationFilter('');
    setFoodTypeFilter('all');
    setStatusFilter('all');
    showNotification('Filters reset successfully!', 'info');
  };

  const fetchAnnadhanamList = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/annadhanam', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const annadhanamData = data.annadhanamList;
        setAnnadhanamList(annadhanamData);
        
        // Calculate accurate stats
        const total = annadhanamData.length;
        const active = annadhanamData.filter((item: Annadhanam) => item.isActive === true).length;
        const available = annadhanamData.filter((item: Annadhanam) => 
          item.currentAvailability === true && item.isActive === true
        ).length;
        const totalCapacity = annadhanamData.reduce((sum: number, item: Annadhanam) => {
          return sum + (item.capacity || 0);
        }, 0);
        
        
        setStats({ total, active, available, totalCapacity });
      } else {
        setError('Failed to fetch annadhanam list');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleOpenDialog = (annadhanam?: Annadhanam) => {
    if (annadhanam) {
      setEditingAnnadhanam(annadhanam);
      setAnnadhanamForm({
        name: annadhanam.name,
        description: annadhanam.description || '',
        location: annadhanam.location,
        timings: annadhanam.timings,
        foodType: annadhanam.foodType,
        capacity: annadhanam.capacity || 0,
        currentAvailability: annadhanam.currentAvailability,
        organizer: annadhanam.organizer,
        images: annadhanam.images,
        isActive: annadhanam.isActive,
        specialInstructions: annadhanam.specialInstructions || '',
      });
    } else {
      setEditingAnnadhanam(null);
      setAnnadhanamForm(initialAnnadhanamForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAnnadhanam(null);
    setAnnadhanamForm(initialAnnadhanamForm);
    setError('');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file!', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size should be less than 5MB!', 'error');
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
        setAnnadhanamForm({ 
          ...annadhanamForm, 
          images: [...annadhanamForm.images, data.url]
        });
        showNotification('Photo uploaded successfully!', 'success');
      } else {
        console.error('Upload error:', data);
        showNotification(data.error || 'Failed to upload photo!', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Error uploading photo! Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingAnnadhanam 
        ? `/api/admin/annadhanam/${editingAnnadhanam._id}`
        : '/api/admin/annadhanam';
      
      const method = editingAnnadhanam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(annadhanamForm),
      });

      if (response.ok) {
        showNotification(editingAnnadhanam ? 'Annadhanam updated successfully!' : 'Annadhanam created successfully!', 'success');
        handleCloseDialog();
        fetchAnnadhanamList();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Operation failed!', 'error');
      }
    } catch (error) {
      showNotification('Network error! Please check your connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (annadhanamId: string) => {
    setAnnadhanamToDelete(annadhanamId);
    setDeleteDialog(true);
  };

  const confirmDeleteAnnadhanam = async () => {
    if (!annadhanamToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/annadhanam/${annadhanamToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Annadhanam deleted successfully!', 'success');
        fetchAnnadhanamList();
      } else {
        showNotification(data.error || 'Failed to delete annadhanam!', 'error');
      }
    } catch (error) {
      showNotification('Network error! Please check your connection.', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
      setAnnadhanamToDelete(null);
    }
  };

  const cancelDeleteAnnadhanam = () => {
    setDeleteDialog(false);
    setAnnadhanamToDelete(null);
  };

  const handleViewAnnadhanam = (annadhanam: Annadhanam) => {
    setViewingAnnadhanam(annadhanam);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setViewingAnnadhanam(null);
  };

  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoViewOpen(true);
  };

  const handleClosePhotoView = () => {
    setPhotoViewOpen(false);
    setSelectedPhoto('');
  };

  const removePhoto = (index: number) => {
    const newImages = annadhanamForm.images.filter((_, i) => i !== index);
    setAnnadhanamForm({ ...annadhanamForm, images: newImages });
  };

  const updateTiming = (index: number, field: string, value: string | boolean) => {
    const newTimings = [...annadhanamForm.timings];
    newTimings[index] = { ...newTimings[index], [field]: value };
    setAnnadhanamForm({ ...annadhanamForm, timings: newTimings });
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
              Loading Annadhanam...
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
        
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3, 
          mb: 3 
        }}>
          <StatCard
            title="Total Annadhanam"
            value={stats.total}
            icon={<RestaurantMenu sx={{ fontSize: 20 }} />}
            color="#667eea"
            loading={statsLoading}
          />
          <StatCard
            title="Active Centers"
            value={stats.active}
            icon={<CheckCircle sx={{ fontSize: 20 }} />}
            color="#764ba2"
            loading={statsLoading}
          />
          <StatCard
            title="Currently Available"
            value={stats.available}
            icon={<Restaurant sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            loading={statsLoading}
          />
          <StatCard
            title="Total Capacity"
            value={stats.totalCapacity}
            icon={<People sx={{ fontSize: 20 }} />}
            color="#667eea"
            loading={statsLoading}
          />
        </Box>

        {/* Annadhanam Table */}
        <Card>
          <CardContent>
            {/* Header with Actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={() => setShowSearchFilter(!showSearchFilter)}
                  sx={{
                    backgroundColor: showSearchFilter ? '#667eea15' : '#f5f5f5',
                    color: showSearchFilter ? '#667eea' : '#666',
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: '#667eea15',
                      color: '#667eea',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Filter width={20} height={20} />
                </IconButton>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#374151' }}>
                Annadhanam
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchAnnadhanamList}
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
                  Add Annadhanam
                </Button>
              </Box>
            </Box>

            {/* Filter Section */}
            {showSearchFilter && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                  Filter Annadhanam
                </Typography>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr) 80px 80px' }, 
                  gap: 2, 
                  mb: 2 
                }}>
                  <TextField
                    fullWidth
                    label="Name"
                    placeholder="Enter annadhanam name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Restaurant color="action" />
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

                  <FormControl fullWidth>
                    <InputLabel>Food Type</InputLabel>
                    <Select
                      value={foodTypeFilter}
                      label="Food Type"
                      onChange={(e) => setFoodTypeFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {foodTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
<FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplyFilters}
                    startIcon={<FilterList />}
                    sx={{ 
                      height: '40px',
                      minWidth: '80px',
                      marginTop:"15px",
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    Filter
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleResetFilters}
                    startIcon={<RestartAlt />}
                    sx={{ 
                      height: '40px',
                      minWidth: '80px',
                      borderColor: '#667eea',
                      marginTop:"15px",
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a6fd8',
                        backgroundColor: '#667eea15',
                      },
                    }}
                  >
                    Reset
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
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Food Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Organizer</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Availability</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center', width: '200px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell><Skeleton variant="text" width="80%" height={24} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="90%" height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width="70%" height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width={30} height={20} /></TableCell>
                        <TableCell align="center"><Skeleton variant="rounded" width={60} height={24} sx={{ mx: 'auto' }} /></TableCell>
                        <TableCell align="center"><Skeleton variant="rounded" width={80} height={24} sx={{ mx: 'auto' }} /></TableCell>
                        <TableCell align="center" sx={{ width: '200px' }}>
                          <Box display="flex" gap="8px" alignItems="center" justifyContent="center">
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredAnnadhanamList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No annadhanam found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnnadhanamList.map((annadhanam, index) => (
                      <TableRow key={annadhanam._id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
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
                            {annadhanam.name}
                          </Typography>
                          {annadhanam.description && (
                            <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                              {annadhanam.description.substring(0, 40)}...
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            icon={<Restaurant sx={{ fontSize: '16px !important', color: '#ffffff !important' }} />}
                            label={foodTypes.find(type => type.value === annadhanam.foodType)?.label || annadhanam.foodType}
                            size="medium"
                            sx={{
                              minWidth: 110,
                              height: 34,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: '1px solid #2a508fff',
                              '&:hover': {
                                backgroundColor: '#2563eb',
                                transform: 'scale(1.02)',
                              },
                              '& .MuiChip-icon': {
                                marginLeft: '8px',
                                marginRight: '-4px',
                              },
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                            }}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LocationOn fontSize="small" color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body2" noWrap>
                              {annadhanam.location.address.substring(0, 30)}...
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {annadhanam.organizer.name || 'N/A'}
                            </Typography>
                            {annadhanam.organizer.contact && (
                              <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                                {annadhanam.organizer.contact}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Groups fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {annadhanam.capacity || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            icon={annadhanam.isActive ? <CheckCircle sx={{ fontSize: '18px !important', color: '#ffffff !important' }} /> : <Cancel sx={{ fontSize: '18px !important', color: '#ffffff !important' }} />}
                            label={annadhanam.isActive ? 'Active' : 'Inactive'}
                            size="medium"
                            sx={{
                              minWidth: 110,
                              height: 34,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: annadhanam.isActive ? '#22c55e' : '#ef4444',
                              color: 'white',
                             border: '1px solid #16a34a',
                              '&:hover': {
                                backgroundColor: annadhanam.isActive ? '#16a34a' : '#dc2626',
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
                          <Chip
                            icon={annadhanam.currentAvailability ? <CheckCircle sx={{ fontSize: '16px !important', color: '#ffffff !important' }} /> : <Cancel sx={{ fontSize: '16px !important', color: '#ffffff !important' }} />}
                            label={annadhanam.currentAvailability ? 'Available' : 'Not Available'}
                            size="medium"
                            sx={{
                              minWidth: '130px',
                              height: 34,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: annadhanam.currentAvailability ? '#06b6d4' : '#f59e0b',
                              color: 'white',
                              border: 'none',
                              '&:hover': {
                                backgroundColor: annadhanam.currentAvailability ? '#0891b2' : '#d97706',
                                transform: 'scale(1.02)',
                              },
                              '& .MuiChip-icon': {
                                marginLeft: '6px',
                                marginRight: '-2px',
                              },
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                          />
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
                                onClick={() => handleViewAnnadhanam(annadhanam)}
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
                            <Tooltip title="Edit Annadhanam" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => handleOpenDialog(annadhanam)}
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
                            <Tooltip title="Delete Annadhanam" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => handleDelete(annadhanam._id)}
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
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              margin: 2,
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

            <Typography variant="h5" component="div" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {editingAnnadhanam ? 'Edit Annadhanam' : 'Add Annadhanam'}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
            <Box sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 4 
              }}>
                {/* Left Column - Basic Information */}
                <Box>
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
                      <Info />
                      Basic Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Name */}
                      <TextField
                        fullWidth
                        label="Annadhanam Name"
                        placeholder="Enter annadhanam name..."
                        value={annadhanamForm.name}
                        onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, name: e.target.value })}
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

                      {/* Description */}
                      <TextField
                        fullWidth
                        label="Description"
                        placeholder="Enter description..."
                        value={annadhanamForm.description}
                        onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, description: e.target.value })}
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

                      {/* Food Type & Capacity */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Food Type</InputLabel>
                          <Select
                            value={annadhanamForm.foodType}
                            label="Food Type"
                            onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, foodType: e.target.value })}
                          >
                            {foodTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          label="Capacity"
                          placeholder="Number of people"
                          type="number"
                          value={annadhanamForm.capacity}
                          onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, capacity: parseInt(e.target.value) || 0 })}
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

                      {/* Status Switches */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={annadhanamForm.isActive}
                              onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, isActive: e.target.checked })}
                            />
                          }
                          label="Active"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={annadhanamForm.currentAvailability}
                              onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, currentAvailability: e.target.checked })}
                            />
                          }
                          label="Currently Available"
                        />
                      </Box>

                      {/* Special Instructions */}
                      <TextField
                        fullWidth
                        label="Special Instructions"
                        placeholder="Any special instructions..."
                        value={annadhanamForm.specialInstructions}
                        onChange={(e) => setAnnadhanamForm({ ...annadhanamForm, specialInstructions: e.target.value })}
                        multiline
                        rows={2}
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
                  </Card>
                </Box>

                {/* Right Column - Location & Organizer */}
                <Box>
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
                        <LocationOn />
                        Location Details
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Address */}
                        <TextField
                          fullWidth
                          label="Address"
                          placeholder="Enter complete address..."
                          value={annadhanamForm.location.address}
                          onChange={(e) => setAnnadhanamForm({
                            ...annadhanamForm,
                            location: { ...annadhanamForm.location, address: e.target.value }
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
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                          <TextField
                            fullWidth
                            label="Latitude"
                            placeholder="0.000000"
                            type="text"
                            value={annadhanamForm.location.latitude}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^-?\d*\.?\d*$/.test(value)) {
                                setAnnadhanamForm({
                                  ...annadhanamForm,
                                  location: { ...annadhanamForm.location, latitude: parseFloat(value) || 0 }
                                });
                              }
                            }}
                            required
                          />
                          <TextField
                            fullWidth
                            label="Longitude"
                            placeholder="0.000000"
                            type="text"
                            value={annadhanamForm.location.longitude}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^-?\d*\.?\d*$/.test(value)) {
                                setAnnadhanamForm({
                                  ...annadhanamForm,
                                  location: { ...annadhanamForm.location, longitude: parseFloat(value) || 0 }
                                });
                              }
                            }}
                            required
                          />
                        </Box>

                        {/* Google Maps Link */}
                        {annadhanamForm.location.latitude !== 0 && annadhanamForm.location.longitude !== 0 && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<OpenInNew />}
                            onClick={() => window.open(generateGoogleMapsUrl(annadhanamForm.location.latitude, annadhanamForm.location.longitude), '_blank')}
                          >
                            View on Google Maps
                          </Button>
                        )}
                      </Box>
                    </Card>

                    {/* Organizer Section */}
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
                        <Person />
                        Organizer Details
                      </Typography>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Organizer Name"
                          placeholder="Enter organizer name..."
                          value={annadhanamForm.organizer.name}
                          onChange={(e) => setAnnadhanamForm({
                            ...annadhanamForm,
                            organizer: { ...annadhanamForm.organizer, name: e.target.value }
                          })}
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
                        <TextField
                          fullWidth
                          label="Contact Number"
                          placeholder="Enter contact number..."
                          value={annadhanamForm.organizer.contact}
                          onChange={(e) => setAnnadhanamForm({
                            ...annadhanamForm,
                            organizer: { ...annadhanamForm.organizer, contact: e.target.value }
                          })}
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
                    </Card>
                  </Box>
                </Box>
              </Box>

              {/* Full Width Sections */}
              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                    <Schedule />
                    Daily Timings
                  </Typography>

                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
                    gap: 2 
                  }}>
                    {annadhanamForm.timings.map((timing, index) => (
                      <Card key={timing.day} sx={{ p: 2, border: '1px solid #e2e8f0' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                            {timing.day}
                          </Typography>
                          <Switch
                            checked={timing.isAvailable}
                            onChange={(e) => updateTiming(index, 'isAvailable', e.target.checked)}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        {timing.isAvailable && (
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                            <TextField
                              fullWidth
                              label="Start"
                              type="time"
                              value={timing.startTime}
                              onChange={(e) => updateTiming(index, 'startTime', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              size="small"
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
                            <TextField
                              fullWidth
                              label="End"
                              type="time"
                              value={timing.endTime}
                              onChange={(e) => updateTiming(index, 'endTime', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              size="small"
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
                        )}
                      </Card>
                    ))}
                  </Box>
                </Card>

                {/* Photos Section */}
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
                    <Photo />
                    Photos
                  </Typography>

                  {/* Photos Layout - Upload Button on Left, Images on Right */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', md: '200px 1fr' }, 
                    gap: 3,
                    alignItems: 'start'
                  }}>
                    {/* Upload Button */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<CloudUpload />}
                        disabled={uploading}
                        sx={{
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          py: 1.5,
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
                      
                      {annadhanamForm.images.length > 0 && (
                        <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                          {annadhanamForm.images.length} photo{annadhanamForm.images.length !== 1 ? 's' : ''} uploaded
                        </Typography>
                      )}
                    </Box>

                    {/* Photos Grid */}
                    {annadhanamForm.images.length > 0 && (
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
                        gap: 2 
                      }}>
                        {annadhanamForm.images.map((image, index) => (
                          <Card key={index} sx={{ 
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                              transform: 'translateY(-2px)',
                            },
                          }}>
                            <Box
                              component="img"
                              src={image}
                              alt={`Annadhanam ${index + 1}`}
                              onClick={() => handlePhotoClick(image)}
                              sx={{
                                width: '100%',
                                height: 'auto',
                                minHeight: 120,
                                maxHeight: 200,
                                objectFit: 'contain',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.02)',
                                },
                              }}
                            />
                            <IconButton
                              onClick={() => removePhoto(index)}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                color: 'red',
                                width: 24,
                                height: 24,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                },
                              }}
                              size="small"
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 3,
                    borderRadius: 2,
                  }}
                >
                  {error}
                </Alert>
              )}
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
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {submitting ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  {editingAnnadhanam ? 'Updating...' : 'Creating...'}
                </Box>
              ) : (
                editingAnnadhanam ? 'Update Annadhanam' : 'Create Annadhanam'
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
                alt="Annadhanam Full View"
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
          onClose={cancelDeleteAnnadhanam}
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
                   Delete Annadhanam
                 </Box>
               </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              Are you sure you want to delete this annadhanam?
            </Typography>
          
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteAnnadhanam}
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
              onClick={confirmDeleteAnnadhanam}
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

        {/* View Annadhanam Dialog */}
        <Dialog
          open={viewDialog}
          onClose={handleCloseViewDialog}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              margin: 2,
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

            <Typography variant="h5" component="div" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
            View Annadhanam Details
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
            {viewingAnnadhanam && (
              <Box sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                  gap: 4 
                }}>
                  {/* Left Column - Basic Information */}
                  <Box>
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
                        <Info />
                        Basic Information
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Name</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{viewingAnnadhanam.name}</Typography>
                        </Box>

                        {viewingAnnadhanam.description && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Description</Typography>
                            <Typography variant="body2">{viewingAnnadhanam.description}</Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Food Type</Typography>
                            <Chip
                              label={foodTypes.find(type => type.value === viewingAnnadhanam.foodType)?.label || viewingAnnadhanam.foodType}
                              color="primary"
                              size="small"
                            />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Capacity</Typography>
                            <Typography variant="body1">{viewingAnnadhanam.capacity || 'Not specified'}</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Status</Typography>
                            <Chip
                              label={viewingAnnadhanam.isActive ? 'Active' : 'Inactive'}
                              color={viewingAnnadhanam.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Availability</Typography>
                            <Chip
                              label={viewingAnnadhanam.currentAvailability ? 'Available' : 'Not Available'}
                              color={viewingAnnadhanam.currentAvailability ? 'info' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </Box>

                        {viewingAnnadhanam.specialInstructions && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Special Instructions</Typography>
                            <Typography variant="body2">{viewingAnnadhanam.specialInstructions}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Box>

                  {/* Right Column - Location & Organizer */}
                  <Box>
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
                          <LocationOn />
                          Location Details
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Address</Typography>
                            <Typography variant="body2">{viewingAnnadhanam.location.address}</Typography>
                          </Box>

                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Latitude</Typography>
                              <Typography variant="body2">{viewingAnnadhanam.location.latitude}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Longitude</Typography>
                              <Typography variant="body2">{viewingAnnadhanam.location.longitude}</Typography>
                            </Box>
                          </Box>

                          {viewingAnnadhanam.location.latitude !== 0 && viewingAnnadhanam.location.longitude !== 0 && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<OpenInNew />}
                              onClick={() => window.open(generateGoogleMapsUrl(viewingAnnadhanam.location.latitude, viewingAnnadhanam.location.longitude), '_blank')}
                            >
                              View on Google Maps
                            </Button>
                          )}
                        </Box>
                      </Card>

                      {/* Organizer Section */}
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
                          <Person />
                          Organizer Details
                        </Typography>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Name</Typography>
                            <Typography variant="body1">{viewingAnnadhanam.organizer.name || 'Not specified'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1 }}>Contact</Typography>
                            <Typography variant="body1">{viewingAnnadhanam.organizer.contact || 'Not specified'}</Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Box>
                  </Box>
                </Box>

                {/* Full Width Sections */}
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                      <Schedule />
                      Daily Timings
                    </Typography>

                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
                      gap: 2 
                    }}>
                      {viewingAnnadhanam.timings.map((timing, index) => (
                        <Card key={timing.day} sx={{ p: 2, border: '1px solid #e2e8f0' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                              {timing.day}
                            </Typography>
                            <Chip
                              label={timing.isAvailable ? 'Available' : 'Closed'}
                              color={timing.isAvailable ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                          {timing.isAvailable && (
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                              {timing.startTime} - {timing.endTime}
                            </Typography>
                          )}
                        </Card>
                      ))}
                    </Box>
                  </Card>

                  {/* Photos Section */}
                  {viewingAnnadhanam.images.length > 0 && (
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
                        <Photo />
                        Photos ({viewingAnnadhanam.images.length})
                      </Typography>

                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
                        gap: 2 
                      }}>
                        {viewingAnnadhanam.images.map((image, index) => (
                          <Card key={index} sx={{ 
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                              transform: 'translateY(-2px)',
                            },
                          }}>
                            <Box
                              component="img"
                              src={image}
                              alt={`Annadhanam ${index + 1}`}
                              onClick={() => handlePhotoClick(image)}
                              sx={{
                                width: '100%',
                                height: 'auto',
                                minHeight: 120,
                                maxHeight: 200,
                                objectFit: 'contain',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.02)',
                                },
                              }}
                            />
                          </Card>
                        ))}
                      </Box>
                    </Card>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 4, 
            pt: 2, 
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            justifyContent: 'center'
          }}>
            <Button 
              onClick={handleCloseViewDialog}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </AdminLayout>
  );
}
