'use client';

import { useState, useEffect } from 'react';
import Player from 'react-lottie-player';
import Loading from '../../../../Loading.json';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Skeleton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Search,
  Person,
  Email,
  Phone,
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Refresh,
  Group,
  Shield,
  TrendingUp,
  AccessTime,
  FilterList,
  RestartAlt,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { notifications } from '@mantine/notifications';


interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  plainPassword?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  recentRegistrations: number;
  encryptedPasswords: number;
}

const SkeletonRow = () => (
  <TableRow>
    <TableCell align="center" sx={{ py: 2 }}>
      <Skeleton variant="text" width={30} height={16} />
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Skeleton variant="text" width="80%" height={20} />
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Skeleton variant="text" width="90%" height={16} />
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Skeleton variant="text" width="70%" height={16} />
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Box display="flex" alignItems="center">
        <Skeleton variant="text" width="60%" height={16} sx={{ mr: 1 }} />
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
    </TableCell>
    <TableCell align="center" sx={{ py: 2 }}>
      <Skeleton variant="text" width={70} height={16} />
    </TableCell>
  </TableRow>
);

export default function SecurityPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');

  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});

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

  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  
  // Filter functions
  const handleApplyFilters = () => {
    // Apply filters logic here
    // You can add actual filtering logic here
    showNotification('Filters applied successfully!', 'success');
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    setShowSearchFilter(false);
    showNotification('Filters reset successfully!', 'info');
  };
  
  // Statistics state
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    activeUsers: 0,
    recentRegistrations: 0,
    encryptedPasswords: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

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
  useEffect(() => {
    fetchUsers();
  }, []);

  // Timer for loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);

      
      const response = await fetch('/api/admin/security', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();

      if (response.ok) {
        const usersData = data.users || [];
        setUsers(usersData);
        
        // Calculate statistics
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const activeUsersCount = usersData.filter((user: User) => user.isActive && !user.isDeleted).length;
        const recentRegistrationsCount = usersData.filter((user: User) => 
          new Date(user.createdAt) >= thirtyDaysAgo
        ).length;
        const encryptedPasswordsCount = usersData.filter((user: User) => !user.plainPassword).length;

        setStats({
          totalUsers: usersData.length,
          activeUsers: activeUsersCount,
          recentRegistrations: recentRegistrationsCount,
          encryptedPasswords: encryptedPasswordsCount
        });
        
        if (usersData.length === 0) {
          showNotification('No users found in the database', 'info');
        }
      } else {
        showNotification(data.error || 'Failed to fetch users', 'error');
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
  };

  const applyFilters = () => {
    fetchUsers();
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filteredUsers = users.filter(user => {
    const matchesName = nameFilter === '' || 
      user.name.toLowerCase().includes(nameFilter.toLowerCase());

    const matchesEmail = emailFilter === '' ||
      user.email.toLowerCase().includes(emailFilter.toLowerCase());

    const matchesPhone = phoneFilter === '' ||
      user.phone.includes(phoneFilter);

    return matchesName && matchesEmail && matchesPhone;
  });

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Statistics Cards */}
        <Box sx={{ mb: 4 }}>
    
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
            gap: 2,
            mb: 3 
          }}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Group sx={{ fontSize: 30 }} />}
              color="#667eea"
              loading={statsLoading}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<Person sx={{ fontSize: 30 }} />}
              color="#764ba2"
              loading={statsLoading}
            />
            <StatCard
              title="Recent Registrations"
              value={stats.recentRegistrations}
              icon={<TrendingUp sx={{ fontSize: 30 }} />}
              color="#8B5CF6"
              loading={statsLoading}
            />
            <StatCard
              title="Encrypted Passwords"
              value={stats.encryptedPasswords}
              icon={<Shield sx={{ fontSize: 30 }} />}
              color="#667eea"
              loading={statsLoading}
            />
          </Box>
        </Box>

        {/* Security Table */}
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
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Security 
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={fetchUsers}
                  sx={{
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Refresh />
                </IconButton>
              </Box>
            </Box>

            {/* Search Filter */}
            {showSearchFilter && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                  Filter User Data
                </Typography>
                
                {/* Filter Fields Row - 3 Fields */}
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Name"
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
                    placeholder="Enter email..."
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
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center', width: '60px' }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Phone Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Password
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Registered Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Show skeleton loading when initially loading the page
                    Array.from({ length: 8 }).map((_, index) => (
                      <SkeletonRow key={`skeleton-${index}`} />
                    ))
                  ) : filteredUsers.length === 0 ? (
                    // Show no data message when no users found
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No user data found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Show actual data when loaded
                    filteredUsers.map((user, index) => (
                      <TableRow key={user._id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
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
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center">
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              backgroundColor: '#f57c00',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2
                            }}>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                                {user.name.charAt(0).toUpperCase()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                              {user.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ color: '#374151' }}>
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ color: '#374151' }}>
                            {user.phone}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="flex-start" gap={1}>
                            {user.plainPassword ? (
                              <>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: visiblePasswords[user._id] ? '#2e7d32' : '#374151',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    minWidth: '120px',
                                    fontWeight: visiblePasswords[user._id] ? 600 : 400,
                                    backgroundColor: visiblePasswords[user._id] ? '#e8f5e8' : 'transparent',
                                    padding: visiblePasswords[user._id] ? '4px 8px' : '0',
                                    borderRadius: visiblePasswords[user._id] ? '4px' : '0',
                                    border: visiblePasswords[user._id] ? '1px solid #4caf50' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {visiblePasswords[user._id] ? user.plainPassword : '••••••••••'}
                                </Typography>
                                <Tooltip title={visiblePasswords[user._id] ? 'Hide password' : 'Show password'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => togglePasswordVisibility(user._id)}
                                    sx={{
                                      color: visiblePasswords[user._id] ? '#4caf50' : '#667eea',
                                      backgroundColor: visiblePasswords[user._id] ? 'rgba(76, 175, 80, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                                      height: '32px',
                                      width: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      '&:hover': {
                                        color: visiblePasswords[user._id] ? '#2e7d32' : '#764ba2',
                                        backgroundColor: visiblePasswords[user._id] ? 'rgba(76, 175, 80, 0.2)' : 'rgba(102, 126, 234, 0.2)',
                                        transform: 'scale(1.1)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    {visiblePasswords[user._id] ? (
                                      <VisibilityOff fontSize="small" />
                                    ) : (
                                      <Visibility fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              visiblePasswords[user._id] ? (
                                <>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: '#ef4444',
                                      fontFamily: 'monospace',
                                      fontSize: '0.75rem',
                                      backgroundColor: '#fef2f2',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #ef4444',
                                      fontWeight: 500,
                                    }}
                                  >
                                    🔒 Cannot display - Encrypted hash only
                                  </Typography>
                                  <Tooltip title="Hide password info">
                                    <IconButton
                                      size="small"
                                      onClick={() => togglePasswordVisibility(user._id)}
                                      sx={{
                                        color: '#ef4444',
                                        height: '32px',
                                        width: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': {
                                          color: '#dc2626',
                                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        },
                                      }}
                                    >
                                      <VisibilityOff fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: '#374151',
                                      fontFamily: 'monospace',
                                      fontSize: '0.875rem',
                                      minWidth: '120px',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    ••••••••••
                                  </Typography>
                                  <Tooltip title="Try to show password (encrypted users will show warning)">
                                    <IconButton
                                      size="small"
                                      onClick={() => togglePasswordVisibility(user._id)}
                                      sx={{
                                        color: '#667eea',
                                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                        height: '32px',
                                        width: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': {
                                          color: '#764ba2',
                                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                                          transform: 'scale(1.1)',
                                        },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            {new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Toast Container */}
        

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
                Loading Security Data..
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}
