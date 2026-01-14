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
  CircularProgress,
  TextField,
  InputAdornment,
  Avatar,
  Stack,
  Skeleton,
  Tooltip,
  Pagination,
  PaginationItem,
} from '@mui/material';
import {
  Search,
  Public,
  Language,
  Phone,
  Refresh,
  TrendingUp,
  AccessTime,
  CheckCircle,
  Cancel,
  FilterList,
  RestartAlt,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../../Loading.json';
import { notifications } from '@mantine/notifications';

interface Country {
  id: string;
  serialNo: number;
  name: string;
  code: string;
  dialingCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CountryStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}

export default function CountryPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Statistics state
  const [stats, setStats] = useState<CountryStats>({
    total: 0,
    active: 0,
    inactive: 0,
    recentlyAdded: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const icons = {
      success: '',
      error: '',
      warning: '',
      info: ''
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
  
  // Individual filter states
  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [dialingCodeFilter, setDialingCodeFilter] = useState('');
  // Applied filters - only used when user clicks Filter
  const [appliedFilters, setAppliedFilters] = useState<{ name: string; code: string; dialingCode: string; search: string }>({
    name: '',
    code: '',
    dialingCode: '',
    search: '',
  });
  
  // Search filter toggle state
  const [showSearchFilter, setShowSearchFilter] = useState(false);

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

  // Fetch countries from API
  const fetchCountries = async (currentPage: number = 1) => {
    try {
      setLoading(true);
      setStatsLoading(true);
      
      // Build query parameters for individual filters (use applied filters)
      const params = new URLSearchParams();
      if (appliedFilters.name) params.append('name', appliedFilters.name);
      if (appliedFilters.code) params.append('code', appliedFilters.code);
      if (appliedFilters.dialingCode) params.append('dialingCode', appliedFilters.dialingCode);
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      
      // Pagination parameters
      params.append('limit', '10');
      params.append('offset', ((currentPage - 1) * 10).toString());
      
      const response = await fetch(`/api/countries?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCountries(data.data.countries);
        setTotal(data.data.total);
        setTotalPages(Math.ceil(data.data.total / 10));

        // Get all countries for statistics (without pagination)
        const allCountriesResponse = await fetch('/api/countries?limit=1000');
        const allCountriesData = await allCountriesResponse.json();
        
        if (allCountriesData.success) {
          const allCountries = allCountriesData.data.countries;
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

          const activeCount = allCountries.filter((country: Country) => country.isActive).length;
          const inactiveCount = allCountries.filter((country: Country) => !country.isActive).length;
          const recentlyAddedCount = allCountries.filter((country: Country) => 
            new Date(country.createdAt) >= thirtyDaysAgo
          ).length;

          setStats({
            total: allCountries.length,
            active: activeCount,
            inactive: inactiveCount,
            recentlyAdded: recentlyAddedCount
          });
        }
      } else {
        console.error('Error fetching countries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries(page);
  }, [appliedFilters, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setCodeFilter('');
    setDialingCodeFilter('');
    setSearchTerm('');
    setPage(1);
  };

  const handleApplyFilters = () => {
    // Apply current UI filter values
    setAppliedFilters({ name: nameFilter, code: codeFilter, dialingCode: dialingCodeFilter, search: searchTerm });
    setPage(1);
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setCodeFilter('');
    setDialingCodeFilter('');
    setSearchTerm('');
    setPage(1);
    // keep the filter panel open; clear applied filters so data resets
    setAppliedFilters({ name: '', code: '', dialingCode: '', search: '' });
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
              Loading Countries...
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
        <Box >
        
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
            gap: 2,
            mb: 3 
          }}>
            <StatCard
              title="Total Countries"
              value={stats.total}
              icon={<Public sx={{ fontSize: 38 }} />}
              color="#667eea"
              loading={statsLoading}
            />
            <StatCard
              title="Active Countries"
              value={stats.active}
              icon={<CheckCircle sx={{ fontSize: 38 }} />}
              color="#764ba2"
              loading={statsLoading}
            />
            <StatCard
              title="Inactive Countries"
              value={stats.inactive}
              icon={<Language sx={{ fontSize: 38 }} />}
              color="#8B5CF6"
              loading={statsLoading}
            />
            <StatCard
              title="Recently Added"
              value={stats.recentlyAdded}
              icon={<AccessTime sx={{ fontSize: 38 }} />}
              color="#667eea"
              loading={statsLoading}
            />
          </Box>
        </Box>

        {/* Countries Table */}
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
                  Country
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={() => fetchCountries(page)}
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
                <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
                  Filter Country
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Country Name"
                    placeholder="Enter country name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Public color="action" />
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
                    label="Country Code"
                    placeholder="Enter country code..."
                    value={codeFilter}
                    onChange={(e) => setCodeFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Language color="action" />
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
                    label="Dialing Code"
                    placeholder="Enter dialing code..."
                    value={dialingCodeFilter}
                    onChange={(e) => setDialingCodeFilter(e.target.value)}
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
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Country Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Country Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Dialing Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 10 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`} sx={{ '& .MuiTableCell-root': { py: 2.5 } }}>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Skeleton 
                            variant="text" 
                            width={30} 
                            height={20}
                            sx={{ mx: 'auto' }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 250, textAlign: 'center' }}>
                          <Skeleton 
                            variant="text" 
                            width="80%" 
                            height={24}
                            sx={{ py: 1, mx: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Skeleton 
                            variant="rounded" 
                            width={60} 
                            height={24}
                            sx={{ borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Skeleton 
                            variant="rounded" 
                            width={60} 
                            height={24}
                            sx={{ borderRadius: 1.5 }}
                          />
                        </TableCell>
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
                      </TableRow>
                    ))
                  ) : (
                    countries.map((country, index) => (
                      <TableRow 
                        key={country.id} 
                        hover
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#f9fafb',
                            transition: 'background-color 0.2s ease',
                          },
                          '& .MuiTableCell-root': { py: 2.5 }
                        }}
                      >
                        <TableCell align="center" sx={{ py: 2, textAlign: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#374151',
                              fontSize: '0.875rem',
                              textAlign: 'center'
                            }}
                          >
                            {(page - 1) * 10 + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 250, textAlign: 'center' }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#111827',
                              fontSize: '0.9rem',
                              py: 1,
                            }}
                          >
                            {country.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<Language />}
                            label={country.code} 
                            size="small" 
                            color="primary" 
                            variant="filled"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
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
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<Phone />}
                            label={country.dialingCode} 
                            size="small" 
                            color="secondary" 
                            variant="filled"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
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
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Chip
                              icon={country.isActive ? <CheckCircle /> : <Cancel />}
                              label={country.isActive ? 'Active' : 'Inactive'}
                              color={country.isActive ? 'success' : 'error'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 34,
                                minWidth: 110,
                                borderRadius: 2.5,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                ...(country.isActive && {
                                  backgroundColor: '#22c55e',
                                  color: '#ffffff',
                                  border: '1px solid #16a34a',
                                  '&:hover': {
                                    backgroundColor: '#16a34a',
                                  }
                                }),
                                ...(!country.isActive && {
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
          {/* Pagination */}
{!loading && totalPages > 1 && (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      mt: 3,
    }}
  >
    <Pagination
      count={totalPages}
      page={page}
      onChange={handlePageChange}
      shape="rounded"
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

      </Box>
    </AdminLayout>
  );
}
