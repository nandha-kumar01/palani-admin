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
  CircularProgress,
  Tooltip,
  InputAdornment,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { notifications } from '@mantine/notifications';

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
  Hotel,
  People,
  AttachMoney,
  Wifi,
  LocalParking,
  Kitchen,
  Bathtub,
  Tv,
  ExpandMore,
  CheckCircle,
  Cancel,
  TrendingUp,
  Person,
  Business,
  FilterList,
  RestartAlt,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface Madangal {
  _id: string;
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  cost: number;
  costType: 'free' | 'donation' | 'fixed';
  contact: {
    name?: string;
    phone?: string;
    email?: string;
  };
  images: string[];
  rules: string[];
  checkInTime?: string;
  checkOutTime?: string;
  isActive: boolean;
  currentlyAvailable: boolean;
  bookings: Array<{
    userId: string;
    checkIn: string;
    checkOut: string;
    numberOfPeople: number;
    status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  }>;
  createdAt: string;
}

interface MadangalStats {
  total: number;
  active: number;
  available: number;
  totalCapacity: number;
}

type MadangalForm = {
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  capacity: number;
  facilities: string[];
  cost: number;
  costType: 'free' | 'donation' | 'fixed';
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  images: string[];
  rules: string[];
  checkInTime: string;
  checkOutTime: string;
  isActive: boolean;
  currentlyAvailable: boolean;
};

const initialMadangalForm: MadangalForm = {
  name: '',
  description: '',
  location: {
    latitude: 0,
    longitude: 0,
    address: '',
  },
  capacity: 1,
  facilities: [],
  cost: 0,
  costType: 'free',
  contact: {
    name: '',
    phone: '',
    email: '',
  },
  images: [],
  rules: [],
  checkInTime: '',
  checkOutTime: '',
  isActive: true,
  currentlyAvailable: true,
};

const facilityOptions = [
  'Bed',
  'Bathroom',
  'Kitchen',
  'WiFi',
  'TV',
  'AC',
  'Fan',
  'Parking',
  'Water',
  'Electricity',
  'Balcony',
  'Refrigerator',
  'Hot Water',
  'Security',
  'Prayer Room',
];

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

export default function MadangalPage() {
  const [madangals, setMadangals] = useState<Madangal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMadangal, setEditingMadangal] = useState<Madangal | null>(null);
  const [madangalForm, setMadangalForm] = useState<MadangalForm>(initialMadangalForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Filter states
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Photo view modal
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');

  // View details modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMadangal, setSelectedMadangal] = useState<Madangal | null>(null);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [madangalToDelete, setMadangalToDelete] = useState<Madangal | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New rule input
  const [newRule, setNewRule] = useState('');

  // Statistics state
  const [stats, setStats] = useState<MadangalStats>({
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
    fetchMadangals();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Toast helper function
  // Helper function for showing toasts
  const showToast = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    
    if (severity === 'success') {
      showNotification(message, 'success');
    } else if (severity === 'error') {
      showNotification(message, 'error');
    } else {
      showNotification(message, 'info');
    }
  };

  // Filter madangals based on search criteria
  const filteredMadangals = madangals.filter(madangal => {
    const matchesName = nameFilter === '' || madangal.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesLocation = locationFilter === '' || madangal.location.address.toLowerCase().includes(locationFilter.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = madangal.isActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !madangal.isActive;
    } else if (statusFilter === 'available') {
      matchesStatus = madangal.currentlyAvailable && madangal.currentOccupancy < madangal.capacity;
    } else if (statusFilter === 'occupied') {
      matchesStatus = madangal.currentOccupancy >= madangal.capacity;
    }
    
    return matchesName && matchesLocation && matchesStatus;
  });

  // Filter functions
  const handleApplyFilters = () => {
    showNotification('Filters applied successfully!', 'success');
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setLocationFilter('');
    setStatusFilter('all');
    showNotification('Filters reset successfully!', 'info');
  };

  const fetchMadangals = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/madangal', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const madangalsData = data.madangals || [];
        setMadangals(madangalsData);
        
        // Calculate accurate stats
        const total = madangalsData.length;
        const active = madangalsData.filter((item: Madangal) => item.isActive === true).length;
        const available = madangalsData.filter((item: Madangal) => 
          item.currentlyAvailable === true && item.isActive === true && 
          item.currentOccupancy < item.capacity
        ).length;
        const totalCapacity = madangalsData.reduce((sum: number, item: Madangal) => {
          return sum + (item.capacity || 0);
        }, 0);
   
        
        setStats({ total, active, available, totalCapacity });
      } else {
        showNotification('Failed to fetch madangals', 'error');
      }
    } catch (error) {
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleOpenDialog = (madangal?: Madangal) => {
    if (madangal) {
      setEditingMadangal(madangal);
      setMadangalForm({
        name: madangal.name,
        description: madangal.description || '',
        location: madangal.location,
        capacity: madangal.capacity,
        facilities: madangal.facilities,
        cost: madangal.cost,
        costType: madangal.costType,
        contact: {
          name: madangal.contact.name || '',
          phone: madangal.contact.phone || '',
          email: madangal.contact.email || '',
        },
        images: madangal.images,
        rules: madangal.rules,
        checkInTime: madangal.checkInTime || '',
        checkOutTime: madangal.checkOutTime || '',
        isActive: madangal.isActive,
        currentlyAvailable: madangal.currentlyAvailable,
      });
    } else {
      setEditingMadangal(null);
      setMadangalForm(initialMadangalForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMadangal(null);
    setMadangalForm(initialMadangalForm);
    setNewRule('');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMessage = 'Please select an image file';
      showToast(errorMessage, 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMessage = 'File size should be less than 5MB';
      showToast(errorMessage, 'error');
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
        setMadangalForm({ 
          ...madangalForm, 
          images: [...madangalForm.images, data.url] 
        });
        showToast('Photo uploaded successfully!', 'success');
      } else {
        console.error('Upload error:', data);
        const errorMessage = data.error || 'Failed to upload photo';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = 'Error uploading photo';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...madangalForm.images];
    newImages.splice(index, 1);
    setMadangalForm({ ...madangalForm, images: newImages });
  };

  const addRule = () => {
    if (newRule.trim()) {
      setMadangalForm({
        ...madangalForm,
        rules: [...madangalForm.rules, newRule.trim()]
      });
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    const newRules = [...madangalForm.rules];
    newRules.splice(index, 1);
    setMadangalForm({ ...madangalForm, rules: newRules });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Client-side validation
    if (!madangalForm.name.trim()) {
      showNotification('Madangal name is required', 'error');
      setSubmitting(false);
      return;
    }

    if (!madangalForm.location.address.trim()) {
      showNotification('Address is required', 'error');
      setSubmitting(false);
      return;
    }

    if (madangalForm.capacity < 1) {
      showNotification('Capacity must be at least 1', 'error');
      setSubmitting(false);
      return;
    }


    try {
      const token = localStorage.getItem('token');
      const url = editingMadangal 
        ? `/api/admin/madangal/${editingMadangal._id}`
        : '/api/admin/madangal';
      
      const method = editingMadangal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(madangalForm),
      });

      if (response.ok) {
        const successMessage = editingMadangal ? 'Madangal updated successfully!' : 'Madangal created successfully!';
        showToast(successMessage, 'success');
        handleCloseDialog();
        fetchMadangals();
      } else {
        const data = await response.json();
        console.error('API Error Response:', data);
        const errorMessage = data.error || 'Operation failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Network Error:', error);
      const errorMessage = 'Network error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (madangalId: string) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/madangal/${madangalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast('Madangal deleted successfully!', 'success');
        setDeleteModalOpen(false);
        setMadangalToDelete(null);
        fetchMadangals();
      } else {
        const errorMessage = 'Failed to delete madangal';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      const errorMessage = 'Network error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAvailability = async (madangal: Madangal) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/madangal/${madangal._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...madangal,
          currentlyAvailable: !madangal.currentlyAvailable,
        }),
      });

      if (response.ok) {
        const statusText = !madangal.currentlyAvailable ? 'available' : 'unavailable';
        showToast(`Madangal marked as ${statusText}!`, 'success');
        fetchMadangals();
      } else {
        const errorMessage = 'Failed to update availability';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      const errorMessage = 'Network error occurred';
      showToast(errorMessage, 'error');
    }
  };

  const handleViewDetails = (madangal: Madangal) => {
    setSelectedMadangal(madangal);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (madangal: Madangal) => {
    setMadangalToDelete(madangal);
    setDeleteModalOpen(true);
  };

  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoViewOpen(true);
  };

  const handleClosePhotoView = () => {
    setPhotoViewOpen(false);
    setSelectedPhoto('');
  };

  const generateGoogleMapsUrl = (lat: number, lng: number) => {
    if (lat === 0 && lng === 0) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage === 0) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  const getCostDisplay = (cost: number, costType: string) => {
    if (costType === 'free') return 'Free';
    if (costType === 'donation') return `₹${cost} (Donation)`;
    return `₹${cost}`;
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
              Loading Madangal..
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
            title="Total Madangals"
            value={stats.total}
            icon={<Business sx={{ fontSize: 20 }} />}
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
            title="Available Now"
            value={stats.available}
            icon={<Hotel sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            loading={statsLoading}
          />
          <StatCard
            title="Total Capacity"
            value={stats.totalCapacity}
            icon={<Person sx={{ fontSize: 20 }} />}
            color="#667eea"
            loading={statsLoading}
          />
        </Box>

        {/* Madangals Table */}
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
                  Madangal (Stay)
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchMadangals}
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
                  Add Madangal
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
                  Filter Madangals
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Madangal Name"
                    placeholder="Enter madangal name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Hotel color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
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
                      },
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status Filter"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                      }}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="occupied">Fully Occupied</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplyFilters}
                    startIcon={<FilterList />}
                    sx={{ 
                      borderRadius: 2, 
                      px: 3, 
                      py: 1,
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
                      borderRadius: 2, 
                      px: 3, 
                      py: 1,
                      borderColor: '#667eea',
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
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Photos</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Cost</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Availability</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center', width: '200px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell align="center"><Skeleton width={30} /></TableCell>
                        <TableCell><Skeleton width="80%" /></TableCell>
                        <TableCell><Skeleton variant="rectangular" width={60} height={60} /></TableCell>
                        <TableCell><Skeleton width="90%" /></TableCell>
                        <TableCell><Skeleton width={60} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell align="center"><Skeleton width={60} /></TableCell>
                        <TableCell align="center"><Skeleton width={60} /></TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Skeleton variant="rectangular" width={36} height={36} />
                            <Skeleton variant="rectangular" width={36} height={36} />
                            <Skeleton variant="rectangular" width={36} height={36} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredMadangals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No madangals found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMadangals.map((madangal, index) => (
                      <TableRow key={madangal._id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                            {index + 1}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {madangal.name}
                          </Typography>
                          {madangal.description && (
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                              {madangal.description.substring(0, 50)}...
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {madangal.images.length > 0 ? (
                            <Box display="flex" gap={1}>
                              {madangal.images.slice(0, 2).map((image, idx) => (
                                <Box
                                  key={idx}
                                  component="img"
                                  src={image}
                                  alt={`${madangal.name} ${idx + 1}`}
                                  onClick={() => handlePhotoClick(image)}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                    '&:hover': { transform: 'scale(1.1)' },
                                  }}
                                />
                              ))}
                              {madangal.images.length > 2 && (
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: 'grey.200',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  +{madangal.images.length - 2}
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Photo color="disabled" fontSize="small" />
                            </Box>
                          )}
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LocationOn fontSize="small" color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body2" noWrap>
                              {madangal.location.address.substring(0, 30)}...
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <People fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {madangal.currentOccupancy}/{madangal.capacity}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${Math.round((madangal.currentOccupancy / madangal.capacity) * 100)}%`}
                              color={getOccupancyColor(madangal.currentOccupancy, madangal.capacity)}
                            />
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <AttachMoney fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {getCostDisplay(madangal.cost, madangal.costType)}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            icon={madangal.currentlyAvailable ? <CheckCircle sx={{ fontSize: '16px !important', color: '#ffffff !important' }} /> : <Cancel sx={{ fontSize: '16px !important', color: '#ffffff !important' }} />}
                            label={madangal.currentlyAvailable ? 'Available' : 'Unavailable'}
                            size="medium"
                            onClick={() => handleToggleAvailability(madangal)}
                            sx={{
                              minWidth: '130px',
                              height: '34px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: madangal.currentlyAvailable ? '#06b6d4' : '#f59e0b',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: madangal.currentlyAvailable ? '#0891b2' : '#d97706',
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

                        <TableCell align="center">
                          <Chip
                            icon={madangal.isActive ? <CheckCircle sx={{ fontSize: '18px !important', color: '#ffffff !important' }} /> : <Cancel sx={{ fontSize: '18px !important', color: '#ffffff !important' }} />}
                            label={madangal.isActive ? 'Active' : 'Inactive'}
                            size="medium"
                            sx={{
                              minWidth: 110,
                              height:34,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: madangal.isActive ? '#22c55e' : '#ef4444',
                              color: 'white',
                              border: '1px solid #16a34a',
                              '&:hover': {
                                backgroundColor: madangal.isActive ? '#16a34a' : '#dc2626',
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

                        <TableCell align="center" sx={{ py: 2, width: '200px' }}>
                          <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                            <Tooltip title="View Details" placement="top" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(madangal)}
                                sx={{ 
                                  color: '#3b82f6',
                                  borderColor: '#3b82f6',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid',
                                  borderRadius: 2,
                                  '&:hover': { 
                                    backgroundColor: '#dbeafe',
                                    transform: 'translateY(-1px)',
                                  },
                                }}
                              >
                                <RemoveRedEye fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Madangal" placement="top" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(madangal)}
                                sx={{ 
                                  color: '#f59e0b',
                                  borderColor: '#f59e0b',
                                  backgroundColor: '#fffbeb',
                                  border: '1px solid',
                                  borderRadius: 2,
                                  '&:hover': { 
                                    backgroundColor: '#fef3c7',
                                    transform: 'translateY(-1px)',
                                  },
                                }}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Madangal" placement="top" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(madangal)}
                                sx={{ 
                                  color: '#ef4444',
                                  borderColor: '#ef4444',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid',
                                  borderRadius: 2,
                                  '&:hover': { 
                                    backgroundColor: '#fee2e2',
                                    transform: 'translateY(-1px)',
                                  },
                                }}
                              >
                                <DeleteOutline fontSize="small" />
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
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
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
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
            <Typography component="span" variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {editingMadangal ? 'Edit Madangal' : 'Add Madangal'}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
            <Box sx={{ p: 4, maxHeight: '70vh', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {/* Basic Information */}
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Card sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 600 }}>
                      Basic Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Madangal Name"
                        placeholder="Enter madangal name..."
                        value={madangalForm.name}
                        onChange={(e) => setMadangalForm({ ...madangalForm, name: e.target.value })}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <TextField
                        fullWidth
                        label="Description"
                        placeholder="Enter description..."
                        value={madangalForm.description}
                        onChange={(e) => setMadangalForm({ ...madangalForm, description: e.target.value })}
                        multiline
                        rows={3}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <Box display="flex" gap={2}>
                        <TextField
                          fullWidth
                          label="Capacity"
                          type="number"
                          value={madangalForm.capacity}
                          onChange={(e) => setMadangalForm({ ...madangalForm, capacity: parseInt(e.target.value) || 1 })}
                          required
                          inputProps={{ min: 1 }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <FormControl fullWidth>
                          <InputLabel>Cost Type</InputLabel>
                          <Select
                            value={madangalForm.costType}
                            label="Cost Type"
                            onChange={(e) => setMadangalForm({ ...madangalForm, costType: e.target.value as 'free' | 'donation' | 'fixed' })}
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="free">Free</MenuItem>
                            <MenuItem value="donation">Donation</MenuItem>
                            <MenuItem value="fixed">Fixed Price</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      {madangalForm.costType !== 'free' && (
                        <TextField
                          fullWidth
                          label="Cost Amount (₹)"
                          type="number"
                          value={madangalForm.cost}
                          onChange={(e) => setMadangalForm({ ...madangalForm, cost: parseInt(e.target.value) || 0 })}
                          inputProps={{ min: 0 }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}

                      {/* Status and Availability Settings */}
                      <Box display="flex" flexDirection="column" gap={3}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                          Status & Availability Settings
                        </Typography>
                        
                        <Box display="flex" gap={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={madangalForm.isActive}
                                onChange={(e) => setMadangalForm({ ...madangalForm, isActive: e.target.checked })}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#FF6B35',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 107, 53, 0.08)',
                                    },
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#FF6B35',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  Active Status
                                </Typography>
                                <Chip
                                  label={madangalForm.isActive ? 'Active' : 'Inactive'}
                                  color={madangalForm.isActive ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                            }
                            sx={{ margin: 0 }}
                          />
                          
                          <FormControlLabel
                            control={
                              <Switch
                                checked={madangalForm.currentlyAvailable}
                                onChange={(e) => setMadangalForm({ ...madangalForm, currentlyAvailable: e.target.checked })}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#FFA726',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 167, 38, 0.08)',
                                    },
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#FFA726',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  Availability
                                </Typography>
                                <Chip
                                  label={madangalForm.currentlyAvailable ? 'Available' : 'Unavailable'}
                                  color={madangalForm.currentlyAvailable ? 'primary' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            }
                            sx={{ margin: 0 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Box>

                {/* Location Details */}
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Card sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 600 }}>
                      Location Details
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Address"
                        placeholder="Enter complete address..."
                        value={madangalForm.location.address}
                        onChange={(e) => setMadangalForm({
                          ...madangalForm,
                          location: { ...madangalForm.location, address: e.target.value }
                        })}
                        required
                        multiline
                        rows={2}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <Box display="flex" gap={2}>
                        <TextField
                          fullWidth
                          label="Latitude"
                          type="number"
                          value={madangalForm.location.latitude}
                          onChange={(e) => setMadangalForm({
                            ...madangalForm,
                            location: { ...madangalForm.location, latitude: parseFloat(e.target.value) || 0 }
                          })}
                          required
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          fullWidth
                          label="Longitude"
                          type="number"
                          value={madangalForm.location.longitude}
                          onChange={(e) => setMadangalForm({
                            ...madangalForm,
                            location: { ...madangalForm.location, longitude: parseFloat(e.target.value) || 0 }
                          })}
                          required
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Box>

                      {madangalForm.location.latitude !== 0 && madangalForm.location.longitude !== 0 && (
                        <Button
                          variant="outlined"
                          startIcon={<OpenInNew />}
                          onClick={() => window.open(generateGoogleMapsUrl(madangalForm.location.latitude, madangalForm.location.longitude), '_blank')}
                          sx={{ borderRadius: 2 }}
                        >
                          View on Google Maps
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Box>
              </Box>

              {/* Contact Information */}
              <Box sx={{ mt: 4 }}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 600 }}>
                    Contact Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <TextField
                      sx={{ 
                        minWidth: '250px', 
                        flex: 1,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      label="Contact Person Name"
                      value={madangalForm.contact.name}
                      onChange={(e) => setMadangalForm({
                        ...madangalForm,
                        contact: { ...madangalForm.contact, name: e.target.value }
                      })}
                    />

                    <TextField
                      sx={{ 
                        minWidth: '250px', 
                        flex: 1,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      label="Phone Number"
                      value={madangalForm.contact.phone}
                      onChange={(e) => setMadangalForm({
                        ...madangalForm,
                        contact: { ...madangalForm.contact, phone: e.target.value }
                      })}
                    />

                    <TextField
                      sx={{ 
                        minWidth: '250px', 
                        flex: 1,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      label="Email"
                      type="email"
                      value={madangalForm.contact.email}
                      onChange={(e) => setMadangalForm({
                        ...madangalForm,
                        contact: { ...madangalForm.contact, email: e.target.value }
                      })}
                    />

                    <TextField
                      sx={{ 
                        minWidth: '200px',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      label="Check-in Time"
                      type="time"
                      value={madangalForm.checkInTime}
                      onChange={(e) => setMadangalForm({ ...madangalForm, checkInTime: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      sx={{ 
                        minWidth: '200px',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      label="Check-out Time"
                      type="time"
                      value={madangalForm.checkOutTime}
                      onChange={(e) => setMadangalForm({ ...madangalForm, checkOutTime: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Card>
              </Box>

              {/* Facilities */}
              <Box sx={{ mt: 4 }}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 600 }}>
                    Facilities
                  </Typography>
                  
                  <Autocomplete
                    multiple
                    options={facilityOptions}
                    value={madangalForm.facilities}
                    onChange={(event, newValue) => {
                      setMadangalForm({ ...madangalForm, facilities: newValue });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Facilities"
                        placeholder="Choose facilities..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                          size="small"
                        />
                      ))
                    }
                  />
                </Card>
              </Box>

              {/* Photos Section */}
              <Box sx={{ mt: 4 }}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 600 }}>
                    Photos ({madangalForm.images.length})
                  </Typography>
                  
                  {/* Upload Area */}
                  <Box sx={{ 
                    border: '2px dashed #e2e8f0',
                    borderRadius: 3,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    mb: 3,
                    position: 'relative',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {uploading ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="textSecondary">
                          Uploading image...
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Photo sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Click to upload photos (Max 5MB each)
                        </Typography>
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<CloudUpload />}
                          sx={{
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #FF6B35, #FFA726)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #E55A2B, #FF9800)',
                            },
                          }}
                        >
                          Upload Photos
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handlePhotoUpload}
                          />
                        </Button>
                      </>
                    )}
                  </Box>

                  {/* Uploaded Images Grid */}
                  {madangalForm.images.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                        Uploaded Images:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {madangalForm.images.map((image, index) => (
                          <Box key={index} sx={{ position: 'relative', width: '150px' }}>
                            <Box
                              component="img"
                              src={image}
                              alt={`Upload ${index + 1}`}
                              onClick={() => handlePhotoClick(image)}
                              sx={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 2,
                                border: '2px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                },
                              }}
                            />
                            <Tooltip title="Remove Image" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  color: '#ef4444',
                                  width: 28,
                                  height: 28,
                                  '&:hover': {
                                    backgroundColor: 'white',
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 4,
                                left: 4,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              {index + 1}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Card>
              </Box>

              {/* Rules Section */}
              <Box sx={{ mt: 4 }}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 600 }}>
                    Rules & Guidelines
                  </Typography>
                  
                  <Box display="flex" gap={2} mb={2}>
                    <TextField
                      fullWidth
                      label="Add Rule"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRule()}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button
                      variant="outlined"
                      onClick={addRule}
                      sx={{ borderRadius: 2, minWidth: 100 }}
                    >
                      Add
                    </Button>
                  </Box>

                  {madangalForm.rules.length > 0 && (
                    <Box>
                      {madangalForm.rules.map((rule, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={2} mb={1}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {index + 1}. {rule}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeRule(index)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Card>
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
              sx={{ borderRadius: 2, px: 4, py: 1.5 }}
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {submitting ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  {editingMadangal ? 'Updating...' : 'Creating...'}
                </Box>
              ) : (
                editingMadangal ? 'Update Madangal' : 'Create Madangal'
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
                alt="Madangal Full View"
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

        {/* View Details Modal */}
        <Dialog 
          open={viewModalOpen} 
          onClose={() => setViewModalOpen(false)} 
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
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
              onClick={() => setViewModalOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
            <Typography component="span" variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {selectedMadangal?.name}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4, backgroundColor: '#f8fafc' }}>
            {selectedMadangal && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Basic Info Card */}
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedMadangal.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Capacity</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedMadangal.currentOccupancy}/{selectedMadangal.capacity} people
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Cost</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {getCostDisplay(selectedMadangal.cost, selectedMadangal.costType)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Check-in / Check-out</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedMadangal.checkInTime || 'Not set'} - {selectedMadangal.checkOutTime || 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                  {selectedMadangal.description && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">Description</Typography>
                      <Typography variant="body1">{selectedMadangal.description}</Typography>
                    </Box>
                  )}
                </Card>

                {/* Location Card */}
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                    Location Details
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationOn color="primary" />
                    <Typography variant="body1">{selectedMadangal.location.address}</Typography>
                  </Box>
                  {selectedMadangal.location.latitude !== 0 && selectedMadangal.location.longitude !== 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<OpenInNew />}
                      onClick={() => window.open(generateGoogleMapsUrl(selectedMadangal.location.latitude, selectedMadangal.location.longitude), '_blank')}
                      sx={{ borderRadius: 2 }}
                    >
                      View on Google Maps
                    </Button>
                  )}
                </Card>

                {/* Contact Card */}
                {(selectedMadangal.contact.name || selectedMadangal.contact.phone || selectedMadangal.contact.email) && (
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Contact Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      {selectedMadangal.contact.name && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">Contact Person</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedMadangal.contact.name}</Typography>
                        </Box>
                      )}
                      {selectedMadangal.contact.phone && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">Phone</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedMadangal.contact.phone}</Typography>
                        </Box>
                      )}
                      {selectedMadangal.contact.email && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">Email</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedMadangal.contact.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                )}

                {/* Facilities Card */}
                {selectedMadangal.facilities.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Facilities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedMadangal.facilities.map((facility, index) => (
                        <Chip
                          key={index}
                          label={facility}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Card>
                )}

                {/* Rules Card */}
                {selectedMadangal.rules.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Rules & Guidelines
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedMadangal.rules.map((rule, index) => (
                        <Typography key={index} variant="body2">
                          {index + 1}. {rule}
                        </Typography>
                      ))}
                    </Box>
                  </Card>
                )}

                {/* Images Card */}
                {selectedMadangal.images.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Photos ({selectedMadangal.images.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {selectedMadangal.images.map((image, index) => (
                        <Box
                          key={index}
                          component="img"
                          src={image}
                          alt={`${selectedMadangal.name} ${index + 1}`}
                          onClick={() => handlePhotoClick(image)}
                          sx={{
                            width: 120,
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'scale(1.05)' },
                          }}
                        />
                      ))}
                    </Box>
                  </Card>
                )}

                {/* Status Card */}
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                    Status Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip
                      label={selectedMadangal.isActive ? 'Active' : 'Inactive'}
                      color={selectedMadangal.isActive ? 'success' : 'default'}
                    />
                    <Chip
                      label={selectedMadangal.currentlyAvailable ? 'Available' : 'Unavailable'}
                      color={selectedMadangal.currentlyAvailable ? 'primary' : 'warning'}
                    />
                    <Typography variant="body2" color="textSecondary">
                      Created: {new Date(selectedMadangal.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Card>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
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
              Delete Madangal
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to delete this madangal?
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setDeleteModalOpen(false)}
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
              onClick={() => madangalToDelete && handleDelete(madangalToDelete._id)}
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

        {/* React Toastify Container */}
        
      </Box>
    </AdminLayout>
  );
}
