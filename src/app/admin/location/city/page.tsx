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
  Alert,
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
  Collapse
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
  CheckCircle,
  Close
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  _id: string;
  name: string;
  code: string;
  countryId: string;
  countryName: string;
}

interface City {
  _id: string;
  name: string;
  stateId: string;
  stateName: string;
  stateCode: string;
  countryId: string;
  countryName: string;
  countryCode: string;
  serialNo: number;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

interface CityStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}

interface CitiesResponse {
  success: boolean;
  data: City[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const CityPage = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Statistics state
  const [stats, setStats] = useState<CityStats>({
    total: 0,
    active: 0,
    inactive: 0,
    recentlyAdded: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Form states
  const [addCityDialogOpen, setAddCityDialogOpen] = useState(false);
  const [editCityDialogOpen, setEditCityDialogOpen] = useState(false);
  const [deleteCityDialogOpen, setDeleteCityDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cityToEdit, setCityToEdit] = useState<City | null>(null);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    stateId: '',
    isActive: true
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

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

  // Fetch countries for dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        setError('');
        const response = await fetch('/api/countries?limit=300');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data.countries)) {
          // Filter to include India and other countries where we have state data
          const relevantCountries = data.data.countries.filter((country: Country) => 
            ['IN', 'US', 'GB', 'CA', 'AU'].includes(country.code) // Include India and other major countries
          );
          setCountries(relevantCountries);
          
          // Auto-select India if available
          const india = relevantCountries.find((country: Country) => country.code === 'IN');
          if (india) {
            setSelectedCountry(india.id);
          }
        } else {
          console.error('Invalid countries data structure:', data);
          setError('Failed to fetch countries - invalid data structure');
          setCountries([]);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        setError('Failed to fetch countries');
        setCountries([]);
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
      setSelectedState('');
    }
  }, [selectedCountry]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (selectedState) {
      fetchCities();
    } else {
      setCities([]);
      setTotalPages(0);
      resetStats();
    }
  }, [selectedState, page, searchTerm]);

  const fetchStates = async () => {
    if (!selectedCountry) return;
    
    try {
      setStatesLoading(true);
      setError('');
      
      const response = await fetch(`/api/states?countryId=${selectedCountry}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        // Filter for Indian states (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh)
        const indianStates = data.data.filter((state: State) => 
          ['TN', 'KL', 'KA', 'AP', 'TG'].includes(state.code) || // Include Telangana as well
          ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'].includes(state.name)
        );
        setStates(indianStates);
        setSelectedState(''); // Reset state selection when country changes
      } else {
        setError('Failed to fetch states');
        setStates([]);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setError('Failed to fetch states');
      setStates([]);
    } finally {
      setStatesLoading(false);
    }
  };

  const fetchCities = async () => {
    if (!selectedState) return;
    
    try {
      setLoading(true);
      setStatsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        stateId: selectedState,
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/cities?${params}`);
      const data: CitiesResponse = await response.json();
      
      if (data.success) {
        setCities(data.data);
        setTotalPages(data.pagination.pages);
        
        // Calculate statistics
        const allCitiesResponse = await fetch(`/api/cities?stateId=${selectedState}&limit=1000`);
        const allCitiesData = await allCitiesResponse.json();
        
        if (allCitiesData.success) {
          const allCities = allCitiesData.data;
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

          const activeCount = allCities.filter((city: City) => city.isActive).length;
          const inactiveCount = allCities.filter((city: City) => !city.isActive).length;
          const recentlyAddedCount = allCities.filter((city: City) => 
            new Date(city.createdAt) >= thirtyDaysAgo
          ).length;

          setStats({
            total: allCities.length,
            active: activeCount,
            inactive: inactiveCount,
            recentlyAdded: recentlyAddedCount
          });
        }
      } else {
        setError('Failed to fetch cities');
        setCities([]);
        resetStats();
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setError('Failed to fetch cities');
      setCities([]);
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
    setSelectedState('');
    setPage(1);
    setSearchTerm('');
  };

  const handleStateChange = (event: SelectChangeEvent) => {
    setSelectedState(event.target.value);
    setPage(1);
    setSearchTerm('');
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      stateId: selectedState,
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

  // Add new city
  const handleAddCity = async () => {
    if (!formData.name.trim() || !formData.stateId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('City added successfully!');
        setAddCityDialogOpen(false);
        resetForm();
        fetchCities();
      } else {
        toast.error(result.error || 'Failed to add city');
      }
    } catch (error) {
      toast.error('Error adding city');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit city
  const handleEditCity = async () => {
    if (!formData.name.trim() || !cityToEdit) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/cities/${cityToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('City updated successfully!');
        setEditCityDialogOpen(false);
        setCityToEdit(null);
        resetForm();
        fetchCities();
      } else {
        toast.error(result.error || 'Failed to update city');
      }
    } catch (error) {
      toast.error('Error updating city');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete city
  const handleDeleteCity = async () => {
    if (!cityToDelete) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/cities/${cityToDelete._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('City deleted successfully!');
        setDeleteCityDialogOpen(false);
        setCityToDelete(null);
        fetchCities();
      } else {
        toast.error(result.error || 'Failed to delete city');
      }
    } catch (error) {
      toast.error('Error deleting city');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (city: City) => {
    setCityToEdit(city);
    setFormData({
      name: city.name,
      stateId: city.stateId,
      isActive: city.isActive
    });
    setEditCityDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (city: City) => {
    setCityToDelete(city);
    setDeleteCityDialogOpen(true);
  };

  // Filter and sort cities
  const filteredAndSortedCities = cities.filter(city => {
    const matchesSearch = searchTerm === '' || 
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.countryName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && city.isActive) ||
      (statusFilter === 'inactive' && !city.isActive);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'state':
        return a.stateName.localeCompare(b.stateName);
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
        <TableCell>
          <Skeleton variant="text" width={120} />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={100} />
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards - Show only when state is selected */}
        {selectedState && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
              gap: 3 
            }}>
              <StatCard
                title="Total Cities"
                value={stats.total}
                icon={<LocationCity sx={{ fontSize: 30 }} />}
                color="#667eea"
                loading={statsLoading}
              />
              <StatCard
                title="Active Cities"
                value={stats.active}
                icon={<LocationOn sx={{ fontSize: 30 }} />}
                color="#22c55e"
                loading={statsLoading}
              />
              <StatCard
                title="Inactive Cities"
                value={stats.inactive}
                icon={<Place sx={{ fontSize: 30 }} />}
                color="#ef4444"
                loading={statsLoading}
              />
              <StatCard
                title="Recently Added"
                value={stats.recentlyAdded}
                icon={<Map sx={{ fontSize: 30 }} />}
                color="#f59e0b"
                loading={statsLoading}
              />
            </Box>
          </Box>
        )}

        {/* Country and State Selection Card */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box display="flex" alignItems="center" gap={2}>
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
                    City Management
                  </Typography>
                </Box>
                
                <Box display="flex" gap={2}>
                  <Tooltip title="Refresh Cities">
                    <Button 
                      variant="outlined" 
                      onClick={fetchCities}
                      disabled={loading || !selectedState}
                      sx={{
                        borderColor: '#e0e0e0',
                        color: '#666',
                        borderRadius: 2,
                        minWidth: 120,
                        '&:hover': {
                          borderColor: '#667eea',
                          backgroundColor: '#667eea15',
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
                      if (!selectedState) {
                        toast.error('Please select a country and state first');
                        return;
                      }
                      resetForm();
                      setAddCityDialogOpen(true);
                    }}
                    disabled={!selectedState}
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
                    Add New City
                  </Button>
                </Box>
              </Box>
            }
          />
          
          <CardContent>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, 
              gap: 3 
            }}>
              <Box>
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
              
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Select State</InputLabel>
                  <Select
                    value={selectedState}
                    label="Select State"
                    onChange={handleStateChange}
                    disabled={statesLoading || !selectedCountry}
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
                      <em>Choose a state</em>
                    </MenuItem>
                    {states && states.length > 0 && states.map((state) => (
                      <MenuItem key={state._id} value={state._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationCity sx={{ fontSize: 18, color: '#667eea' }} />
                          {state.name} ({state.code})
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {selectedState && (
                <Box>
                  <TextField
                    fullWidth
                    placeholder="Search cities..."
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
            <Collapse in={!!(showFilters && selectedState)}>
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                  gap: 3 
                }}>
                  <Box>
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
                  
                  <Box>
                    <FormControl fullWidth>
                      <InputLabel>Sort by</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort by"
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="name">City Name</MenuItem>
                        <MenuItem value="state">State</MenuItem>
                        <MenuItem value="status">Status</MenuItem>
                        <MenuItem value="serial">Serial Number</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setSortBy('name');
                    }}
                    sx={{ 
                      borderRadius: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a6fd8',
                        backgroundColor: '#667eea15',
                      },
                    }}
                  >
                    Reset Filters
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Cities Table */}
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
                      City Name
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper'
                    }}>
                      State
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
                  {!selectedCountry || !selectedState ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Alert severity="info" sx={{ border: 'none', backgroundColor: 'transparent' }}>
                          Please select a country and state to view cities
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : loading ? (
                    renderSkeletonRows()
                  ) : filteredAndSortedCities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Alert severity="info" sx={{ border: 'none', backgroundColor: 'transparent' }}>
                          {cities.length === 0 ? 'No cities found for the selected state' : 'No cities match your search criteria'}
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCities.map((city, index) => (
                      <TableRow 
                        key={city._id}
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
                            {city.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationCity sx={{ fontSize: 16, color: '#667eea' }} />
                            <Typography variant="body2">
                              {city.stateName} ({city.stateCode})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Public sx={{ fontSize: 16, color: '#667eea' }} />
                            <Typography variant="body2">
                              {city.countryName} ({city.countryCode})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            icon={city.isActive ? <CheckCircle sx={{ fontSize: 16, color: '#ffffff' }} /> : <Close sx={{ fontSize: 16, color: '#ffffff' }} />}
                            label={city.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              backgroundColor: city.isActive ? '#22c55e' : '#ef4444',
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

                              border: city.isActive ? '1px solid #16a34a' : '1px solid #dc2626'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Edit City">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEditDialog(city)}
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
                            <Tooltip title="Delete City">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(city)}
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
            {selectedState && cities.length > 0 && totalPages > 1 && (
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

        {/* Add City Dialog */}
        <Dialog
          open={addCityDialogOpen}
          onClose={() => setAddCityDialogOpen(false)}
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
              Add New City
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="City Name"
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
              
              <Box>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select
                    value={formData.stateId}
                    label="State"
                    onChange={(e) => handleInputChange('stateId', e.target.value)}
                    sx={{ borderRadius: 2 }}
                    required
                  >
                    {states.map((state) => (
                      <MenuItem key={state._id} value={state._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationCity sx={{ fontSize: 18, color: '#667eea' }} />
                          {state.name} ({state.code})
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box>
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
              onClick={() => setAddCityDialogOpen(false)}
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
              onClick={handleAddCity}
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
              {submitting ? 'Adding...' : 'Add City'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit City Dialog */}
        <Dialog
          open={editCityDialogOpen}
          onClose={() => setEditCityDialogOpen(false)}
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
              Edit City
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="City Name"
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
              
              <Box>
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
              onClick={() => setEditCityDialogOpen(false)}
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
              onClick={handleEditCity}
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
              {submitting ? 'Updating...' : 'Update City'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteCityDialogOpen}
          onClose={() => setDeleteCityDialogOpen(false)}
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
              Delete City
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this city?
            </Typography>
            {cityToDelete && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{cityToDelete.name}</strong> ({cityToDelete.stateName})
                </Typography>
              </Alert>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setDeleteCityDialogOpen(false)}
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
              onClick={handleDeleteCity}
              variant="contained"
              color="error"
              size="medium"
              disabled={submitting}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100
              }}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Box>
    </AdminLayout>
  );
};

export default CityPage;