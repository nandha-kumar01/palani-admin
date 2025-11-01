'use client';

import { useState, useEffect } from 'react';
import Player from 'react-lottie-player';
import Loading from '../../../../Loading.json';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
  Skeleton,
  Alert,
  Stack,
  useTheme,
  Divider
} from '@mui/material';
import {
  People,
  PersonAdd,
  TrendingUp,
  LocationOn,
  Group,
  DirectionsWalk,
  CheckCircle,
  Assessment,
  Timeline,
  Dashboard,
  Refresh,
  PieChart,
  BarChart,
  TrendingDown,
  Phone,
  Computer,
  Tablet,
  Place
} from '@mui/icons-material';
import { notifications } from '@mantine/notifications';
import AdminLayout from '@/components/admin/AdminLayout';

interface UserAnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    trackingUsers: number;
    usersOnPathayathirai: number;
    completedPathayathirai: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
    usersInGroups: number;
    soloTravelers: number;
  };
  pathayathiraiStats: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  userActivityTrends: {
    totalActive: number;
    totalTracking: number;
    activePercentage: number;
    trackingPercentage: number;
  };
  dailyRegistrations: Array<{
    date: string;
    count: number;
  }>;
  topGroups: Array<{
    _id: string;
    name: string;
    memberCount: number;
    activeMemberCount: number;
  }>;
  geographicDistribution: Array<{
    state: string;
    userCount: number;
  }>;
  ageDistribution: Array<{
    ageGroup: string;
    count: number;
  }>;
  deviceStats: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  recentActivities: Array<{
    _id: string;
    name: string;
    email: string;
    lastActivity: string;
    status: string;
    pathayathiraiStatus: string;
    location: string | null;
  }>;
}

const StatCard = ({ title, value, icon, color, loading = false, trend, trendValue }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) => (
  <Card sx={{
    border: `1px solid #e0e0e0`,
    transform: 'translateY(0)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'visible',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 4px 20px rgba(0,0,0,0.1)`,
      border: `1px solid #d0d0d0`,
    }
  }}>
    <CardContent sx={{ position: 'relative' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h3" fontWeight="bold" sx={{ color: '#667eea' }}>
            {loading ? <Skeleton width={80} height={40} /> : value}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#764ba2', fontWeight: 500 }}>
            {loading ? <Skeleton width={120} height={20} /> : title}
          </Typography>
          {trend && trendValue && !loading && (
            <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
              {trend === 'up' ? (
                <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />
              ) : trend === 'down' ? (
                <TrendingDown sx={{ fontSize: 16, color: '#f44336' }} />
              ) : (
                <Timeline sx={{ fontSize: 16, color: '#ff9800' }} />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : '#ff9800',
                  fontWeight: 600 
                }}
              >
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color: '#667eea', opacity: 0.8 }}>
          {loading ? <Skeleton variant="circular" width={48} height={48} /> : icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ProgressCard = ({ title, data, total, color }: {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
  total: number;
  color: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <PieChart sx={{ color }} />
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      <Stack spacing={2}>
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <Box key={index}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.value} ({percentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#f0f0f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: item.color,
                    borderRadius: 4,
                  }
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </CardContent>
  </Card>
);

export default function UserAnalyticsPage() {
  const theme = useTheme();
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);

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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/user-analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
        showNotification('Failed to fetch analytics data', 'error');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError('Network error occurred');
      showNotification('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Timer for loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const getPathayathiraiStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getPathayathiraiStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box display="flex" justifyContent="center">
            <IconButton onClick={fetchAnalytics} color="primary">
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 'bold', 
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Assessment sx={{ fontSize: 40, color: '#667eea' }} />
              User Analytics
            </Typography>
          
          </Box>
          
          <Tooltip title="Refresh Analytics">
            <IconButton 
              onClick={fetchAnalytics}
              disabled={loading}
              sx={{
                backgroundColor: '#667eea',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#5a6fd8',
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Overview Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3, 
          mb: 4 
        }}>
          <StatCard
            title="Total Users"
            value={data?.overview.totalUsers.toLocaleString() || 0}
            icon={<People sx={{ fontSize: 48 }} />}
            color="#667eea"
            loading={loading}
            trend="up"
            trendValue={data ? `+${data.overview.newUsersLast7Days} this week` : undefined}
          />
          <StatCard
            title="Active Users"
            value={data?.overview.activeUsers.toLocaleString() || 0}
            icon={<CheckCircle sx={{ fontSize: 48 }} />}
            color="#4caf50"
            loading={loading}
            trend="up"
            trendValue={data ? `${data.userActivityTrends.activePercentage}% of total` : undefined}
          />
          <StatCard
            title="Currently Tracking"
            value={data?.overview.trackingUsers.toLocaleString() || 0}
            icon={<LocationOn sx={{ fontSize: 48 }} />}
            color="#ff9800"
            loading={loading}
            trend="neutral"
            trendValue={data ? `${data.userActivityTrends.trackingPercentage}% tracking` : undefined}
          />
          <StatCard
            title="On Pathayathirai"
            value={data?.overview.usersOnPathayathirai.toLocaleString() || 0}
            icon={<DirectionsWalk sx={{ fontSize: 48 }} />}
            color="#9c27b0"
            loading={loading}
            trend="up"
            trendValue={data ? `${data.overview.completedPathayathirai} completed` : undefined}
          />
        </Box>

        {/* Secondary Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3, 
          mb: 4 
        }}>
          <StatCard
            title="New Users (7 days)"
            value={data?.overview.newUsersLast7Days.toLocaleString() || 0}
            icon={<PersonAdd sx={{ fontSize: 48 }} />}
            color="#2196f3"
            loading={loading}
          />
          <StatCard
            title="New Users (30 days)"
            value={data?.overview.newUsersLast30Days.toLocaleString() || 0}
            icon={<TrendingUp sx={{ fontSize: 48 }} />}
            color="#00bcd4"
            loading={loading}
          />
          <StatCard
            title="Users in Groups"
            value={data?.overview.usersInGroups.toLocaleString() || 0}
            icon={<Group sx={{ fontSize: 48 }} />}
            color="#795548"
            loading={loading}
          />
          <StatCard
            title="Solo Travelers"
            value={data?.overview.soloTravelers.toLocaleString() || 0}
            icon={<People sx={{ fontSize: 48 }} />}
            color="#607d8b"
            loading={loading}
          />
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: 3 
        }}>
          {/* Pathayathirai Status Distribution */}
          <Box>
            {loading ? (
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={200} />
                </CardContent>
              </Card>
            ) : (
              <ProgressCard
                title="Pathayathirai Status Distribution"
                data={[
                  { 
                    label: 'Not Started', 
                    value: data?.pathayathiraiStats.notStarted || 0, 
                    color: '#9e9e9e' 
                  },
                  { 
                    label: 'In Progress', 
                    value: data?.pathayathiraiStats.inProgress || 0, 
                    color: '#2196f3' 
                  },
                  { 
                    label: 'Completed', 
                    value: data?.pathayathiraiStats.completed || 0, 
                    color: '#4caf50' 
                  }
                ]}
                total={data?.overview.totalUsers || 0}
                color="#667eea"
              />
            )}
          </Box>

          {/* Geographic Distribution */}
          <Box>
            {loading ? (
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={200} />
                </CardContent>
              </Card>
            ) : (
              <ProgressCard
                title="Geographic Distribution"
                data={data?.geographicDistribution.map(item => ({
                  label: item.state,
                  value: item.userCount,
                  color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'][data.geographicDistribution.indexOf(item)] || '#667eea'
                })) || []}
                total={data?.overview.totalUsers || 0}
                color="#667eea"
              />
            )}
          </Box>

          {/* Age Distribution */}
          <Box>
            {loading ? (
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={200} />
                </CardContent>
              </Card>
            ) : (
              <ProgressCard
                title="Age Distribution"
                data={data?.ageDistribution.map(item => ({
                  label: item.ageGroup,
                  value: item.count,
                  color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'][data.ageDistribution.indexOf(item)] || '#667eea'
                })) || []}
                total={data?.overview.totalUsers || 0}
                color="#667eea"
              />
            )}
          </Box>

          {/* Device Statistics */}
          <Box>
            {loading ? (
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={200} />
                </CardContent>
              </Card>
            ) : (
              <ProgressCard
                title="Device Usage"
                data={[
                  { 
                    label: 'Mobile', 
                    value: data?.deviceStats.mobile || 0, 
                    color: '#4caf50' 
                  },
                  { 
                    label: 'Desktop', 
                    value: data?.deviceStats.desktop || 0, 
                    color: '#2196f3' 
                  },
                  { 
                    label: 'Tablet', 
                    value: data?.deviceStats.tablet || 0, 
                    color: '#ff9800' 
                  }
                ]}
                total={data?.overview.totalUsers || 0}
                color="#667eea"
              />
            )}
          </Box>

          {/* Top Groups */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Group sx={{ color: '#667eea' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Top Groups by Members
                  </Typography>
                </Box>
                {loading ? (
                  <Stack spacing={2}>
                    {[...Array(5)].map((_, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={2}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box flex={1}>
                          <Skeleton variant="text" width="80%" height={20} />
                          <Skeleton variant="text" width="60%" height={16} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <List sx={{ py: 0 }}>
                    {data?.topGroups.map((group, index) => (
                      <ListItem key={group._id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'][index] || '#667eea',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {group.name}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={`${group.memberCount} members`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`${group.activeMemberCount} active`}
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                    {(!data?.topGroups || data.topGroups.length === 0) && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        No groups found
                      </Typography>
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Recent User Activities */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Timeline sx={{ color: '#667eea' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Recent User Activities
                  </Typography>
                </Box>
                {loading ? (
                  <Stack spacing={2}>
                    {[...Array(5)].map((_, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={2}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box flex={1}>
                          <Skeleton variant="text" width="80%" height={20} />
                          <Skeleton variant="text" width="60%" height={16} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <List sx={{ py: 0, maxHeight: 300, overflow: 'auto' }}>
                    {data?.recentActivities.map((activity) => (
                      <ListItem key={activity._id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            backgroundColor: activity.status === 'Active' ? '#4caf50' : '#9e9e9e',
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem'
                          }}>
                            {activity.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {activity.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(activity.lastActivity)}
                          </Typography>
                          <Box display="flex" gap={0.5} mt={0.5}>
                            <Chip
                              size="small"
                              label={activity.status}
                              color={activity.status === 'Active' ? 'success' : 'default'}
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                            <Chip
                              size="small"
                              label={getPathayathiraiStatusLabel(activity.pathayathiraiStatus)}
                              sx={{ 
                                fontSize: '0.65rem', 
                                height: 20,
                                backgroundColor: getPathayathiraiStatusColor(activity.pathayathiraiStatus),
                                color: 'white'
                              }}
                            />
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                    {(!data?.recentActivities || data.recentActivities.length === 0) && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        No recent activities found
                      </Typography>
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

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
               animationData={Loading}
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
                Loading Analytics..
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}
