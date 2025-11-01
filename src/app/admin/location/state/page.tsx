'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Skeleton,
  SelectChangeEvent,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
  Collapse,
  CircularProgress
} from '@mui/material';

import {
  Search as SearchIcon,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Refresh,
  FilterAlt,
  Public,
  LocationCity,
  Visibility,
  VisibilityOff,
  Place,
  LocationOn,
  Map,
  Check,
  Close,
  CheckCircle,
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import { notifications } from '@mantine/notifications';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../../Loading.json';


interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  _id: string;
  serialNo: number;
  name: string;
  code: string;
  countryName: string;
  isActive: boolean;
}

interface StatesResponse {
  success: boolean;
  data: State[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface StateStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}

const StatePage = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Statistics state
  const [stats, setStats] = useState<StateStats>({
    total: 0,
    active: 0,
    inactive: 0,
    recentlyAdded: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Form states
  const [addStateDialogOpen, setAddStateDialogOpen] = useState(false);
  const [editStateDialogOpen, setEditStateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stateToEdit, setStateToEdit] = useState<State | null>(null);
  const [stateToDelete, setStateToDelete] = useState<State | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    countryId: '',
    isActive: true
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

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

  // StatCard component
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
  }> = ({ title, value, icon, color, loading }) => (
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

  // Loading animation control
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 8 seconds

    return () => clearTimeout(timer);
  }, []);

  // Fetch countries for dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const response = await fetch('/api/countries?limit=300'); // Get all countries
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data.countries)) {
          setCountries(data.data.countries);
        } else {
          console.error('Invalid countries data structure:', data);
          showNotification('Failed to fetch countries - invalid data structure', 'error');
          setCountries([]); // Ensure countries is always an array
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        showNotification('Failed to fetch countries', 'error');
        setCountries([]); // Ensure countries is always an array
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch states when country is selected
  useEffect(() => {
    if (selectedCountry) {
      fetchStates();
    } else {
      setStates([]);
      setTotalPages(0);
      resetStats();
    }
  }, [selectedCountry, page, searchTerm]);

  const fetchStates = async () => {
    if (!selectedCountry) return;
    
    try {
      setLoading(true);
      setStatsLoading(true);
      
      const params = new URLSearchParams({
        countryId: selectedCountry,
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/states?${params}`);
      const data: StatesResponse = await response.json();
      
      if (data.success) {
        setStates(data.data);
        setTotalPages(data.pagination.pages);
        
        // Calculate statistics - fetch all states for the selected country
        const allStatesResponse = await fetch(`/api/states?countryId=${selectedCountry}&limit=1000`);
        const allStatesData = await allStatesResponse.json();
        
        if (allStatesData.success) {
          const allStates = allStatesData.data;
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

          const activeCount = allStates.filter((state: State) => state.isActive).length;
          const inactiveCount = allStates.filter((state: State) => !state.isActive).length;
          // Note: States might not have createdAt field, so we'll count all as "recently added" for now
          const recentlyAddedCount = allStates.length; // Placeholder for recently added

          setStats({
            total: allStates.length,
            active: activeCount,
            inactive: inactiveCount,
            recentlyAdded: Math.min(5, allStates.length) // Placeholder value
          });
        }
      } else {
        showNotification('Failed to fetch states', 'error');
        setStates([]);
        resetStats();
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      showNotification('Failed to fetch states', 'error');
      setStates([]);
      resetStats();
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const resetStats = () => {
    setStats({
      total: 0,
      active: 0,
      inactive: 0,
      recentlyAdded: 0
    });
  };

  const handleCountryChange = (event: SelectChangeEvent) => {
    setSelectedCountry(event.target.value);
    setPage(1); // Reset to first page when country changes
    setSearchTerm(''); // Reset search when country changes
    resetStats(); // Reset stats when country changes
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      countryId: selectedCountry,
      isActive: true
    });
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new state
  const handleAddState = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.countryId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showNotification('State added successfully!', 'success');
        setAddStateDialogOpen(false);
        resetForm();
        fetchStates();
      } else {
        showNotification(result.error || 'Failed to add state', 'error');
      }
    } catch (error) {
      showNotification('Error adding state', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit state
  const handleEditState = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !stateToEdit) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // For editing, we only need name, code, and isActive - not countryId
      const editData = {
        name: formData.name,
        code: formData.code,
        isActive: formData.isActive
      };

      const response = await fetch(`/api/states/${stateToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (result.success) {
        showNotification('State updated successfully!', 'success');
        setEditStateDialogOpen(false);
        setStateToEdit(null);
        resetForm();
        fetchStates();
      } else {
        showNotification(result.error || 'Failed to update state', 'error');
      }
    } catch (error) {
      showNotification('Error updating state', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete state
  const handleDeleteState = async () => {
    if (!stateToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/states/${stateToDelete._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showNotification('State deleted successfully!', 'success');
        setDeleteDialogOpen(false);
        setStateToDelete(null);
        fetchStates();
      } else {
        showNotification(result.error || 'Failed to delete state', 'error');
      }
    } catch (error) {
      showNotification('Error deleting state', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (state: State) => {
    setStateToEdit(state);
    setFormData({
      name: state.name,
      code: state.code,
      countryId: selectedCountry, // Keep this for form consistency, but won't send in API call
      isActive: state.isActive
    });
    setEditStateDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (state: State) => {
    setStateToDelete(state);
    setDeleteDialogOpen(true);
  };

  // Filter and sort states
  const filteredAndSortedStates = states.filter(state => {
    const matchesSearch = searchTerm === '' || 
      state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && state.isActive) ||
      (statusFilter === 'inactive' && !state.isActive);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'code':
        return a.code.localeCompare(b.code);
      case 'status':
        return Number(b.isActive) - Number(a.isActive);
      default:
        return a.serialNo - b.serialNo;
    }
  });

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell sx={{ textAlign: 'center' }}>
          <Skeleton variant="text" width={30} />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={150} />
        </TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={120} />
        </TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
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
              Loading States...
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

        {/* Statistics Cards - Show only when country is selected */}
        {selectedCountry && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
              gap: 3 
            }}>
              <StatCard
                title="Total States"
                value={stats.total}
                icon={<LocationCity sx={{ fontSize: 30 }} />}
                color="#667eea"
                loading={statsLoading}
              />
              <StatCard
                title="Active States"
                value={stats.active}
                icon={<LocationOn sx={{ fontSize: 30 }} />}
                color="#22c55e"
                loading={statsLoading}
              />
              <StatCard
                title="Inactive States"
                value={stats.inactive}
                icon={<Place sx={{ fontSize: 30 }} />}
                color="#ef4444"
                loading={statsLoading}
              />
              <StatCard
                title="Available States"
                value={stats.recentlyAdded}
                icon={<Map sx={{ fontSize: 30 }} />}
                color="#f59e0b"
                loading={statsLoading}
              />
            </Box>
          </Box>
        )}

        {/* Country Selection Card */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box display="flex" gap={2}>
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{
                      backgroundColor: showFilters ? '#667eea15' : '#f5f5f5',
                      color: showFilters ? '#667eea' : '#666',
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
                    <FilterAlt />
                  </IconButton>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#374151' }}>
                    State Management
                  </Typography>
                </Box>
                
                <Box display="flex" gap={2}>
                  <Tooltip title="Refresh States">
                    <Button 
                      variant="outlined" 
                      onClick={fetchStates}
                      disabled={loading || !selectedCountry}
                      sx={{
                        borderColor: '#e0e0e0',
                        color: '#666',
                        borderRadius: 2,
                        minWidth: 120,
                        '&:hover': {
                           borderColor: '#bdbdbd',
                      backgroundColor: '#f5f5f5',
                          color: '#667eea',
                        },
                        '&:disabled': {
                          opacity: 0.6,
                        },
                      }}
                      startIcon={<Refresh />}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      if (!selectedCountry) {
                        showNotification('Please select a country first', 'error');
                        return;
                      }
                      resetForm();
                      setAddStateDialogOpen(true);
                    }}
                    disabled={!selectedCountry}
                    sx={{ 
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      minWidth: 150,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Add New State
                  </Button>
                </Box>
              </Box>
            }
          />
          
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <FormControl fullWidth>
                  <InputLabel>Select Country</InputLabel>
                  <Select
                    value={selectedCountry}
                    label="Select Country"
                    onChange={handleCountryChange}
                    disabled={countriesLoading}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Choose a country</em>
                    </MenuItem>
                    {countries && countries.length > 0 && countries.map((country) => (
                      <MenuItem key={country.id} value={country.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Public sx={{ fontSize: 18, color: '#667eea' }} />
                          {country.name} ({country.code})
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {selectedCountry && (
                <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                  <TextField
                    fullWidth
                    placeholder="Search states..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Filters Section */}
            <Collapse in={!!(showFilters && selectedCountry)}>
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Filter by Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                    <FormControl fullWidth>
                      <InputLabel>Sort by</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort by"
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="name">State Name</MenuItem>
                        <MenuItem value="code">State Code</MenuItem>
                        <MenuItem value="status">Status</MenuItem>
                        <MenuItem value="serial">Serial Number</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                        setSortBy('name');
                      }}
                      sx={{ 
                        borderRadius: 2, 
                        height: 56,
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a6fd8',
                          backgroundColor: '#667eea15',
                        },
                      }}
                      fullWidth
                    >
                      Reset Filters
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* States Table */}
        <Card>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: "550px", overflow: 'hidden' }}>
            <TableContainer sx={{ 
              maxHeight: '460px', 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#c1c1c1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#a8a8a8',
              },
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper',
                      textAlign: 'center',
                      width: '60px'
                    }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper'
                    }}>
                      State Name
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper',
                      textAlign: 'center'
                    }}>
                      Code
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper'
                    }}>
                      Country
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper',
                      textAlign: 'center'
                    }}>
                      Status
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!selectedCountry ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Please select a country to view states
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : loading ? (
                    renderSkeletonRows()
                  ) : filteredAndSortedStates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          {states.length === 0 ? 'No states found for the selected country' : 'No states match your search criteria'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedStates.map((state, index) => (
                      <TableRow 
                        key={state._id}
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                          '&:hover': { 
                            backgroundColor: '#f0f0f0'
                          }
                        }}
                      >
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight="medium" color="text.secondary">
                            {(page - 1) * 10 + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {state.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          <Chip
                            label={state.code}
                            size="small"
                            sx={{
                              backgroundColor: '#667eea15',
                              color: '#667eea',
                              fontWeight: 600,
                              fontFamily: 'monospace'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationCity sx={{ fontSize: 16, color: '#667eea' }} />
                            {state.countryName}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            icon={state.isActive ? <CheckCircle sx={{ fontSize: 16, color: '#ffffff' }} /> : <Close sx={{ fontSize: 16, color: '#ffffff' }} />}
                            label={state.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              backgroundColor: state.isActive ? '#22c55e' : '#ef4444',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              '& .MuiChip-label': {
                                px: 2,
                                py: 0.75
                              },
                              '& .MuiChip-icon': {
                                color: '#ffffff',
                                marginLeft: 0.5,
                                  fontSize: 16,
                              },
                              border: state.isActive ? '1px solid #16a34a' : '1px solid #dc2626'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Edit State">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEditDialog(state)}
                                sx={{
                                  backgroundColor: '#667eea15',
                                  '&:hover': {
                                    backgroundColor: '#667eea25',
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              >
                                <Edit sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete State">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(state)}
                                sx={{
                                  backgroundColor: '#ef444415',
                                  '&:hover': {
                                    backgroundColor: '#ef444425',
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              >
                                <Delete sx={{ fontSize: 18 }} />
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

            {/* Pagination */}
            {selectedCountry && states.length > 0 && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Add State Dialog */}
        <Dialog
          open={addStateDialogOpen}
          onClose={() => setAddStateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: 'primary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Add sx={{ color: 'primary.main' }} />
              Add New State
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <TextField
                  fullWidth
                  label="State Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  sx={{
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  required
                />
              </Box>
              
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <TextField
                  fullWidth
                  label="State Code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                  required
                />
              </Box>
              
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={formData.countryId}
                    label="Country"
                    onChange={(e) => handleInputChange('countryId', e.target.value)}
                    sx={{ borderRadius: 2 }}
                    required
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.id} value={country.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Public sx={{ fontSize: 18, color: '#667eea' }} />
                          {country.name} ({country.code})
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Active Status"
                />
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setAddStateDialogOpen(false)}
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
              onClick={handleAddState}
              variant="contained"
              size="medium"
              disabled={submitting}
              startIcon={submitting ? <Save /> : <Add />}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {submitting ? 'Adding...' : 'Add State'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit State Dialog */}
        <Dialog
          open={editStateDialogOpen}
          onClose={() => setEditStateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: 'primary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Edit sx={{ color: 'primary.main' }} />
              Edit State
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <TextField
                  fullWidth
                  label="State Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  sx={{
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  required
                />
              </Box>
              
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <TextField
                  fullWidth
                  label="State Code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                  required
                />
              </Box>
              
              <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Active Status"
                />
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setEditStateDialogOpen(false)}
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
              onClick={handleEditState}
              variant="contained"
              size="medium"
              disabled={submitting}
              startIcon={submitting ? <Save /> : <Edit />}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {submitting ? 'Updating...' : 'Update State'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
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
              Delete State
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this state?
            </Typography>
           
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
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
              onClick={handleDeleteState}
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
};export default StatePage;
