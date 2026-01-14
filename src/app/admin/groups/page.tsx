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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  AvatarGroup,
  Stack,
  Divider,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  ButtonGroup,
  Pagination,
PaginationItem,
  Alert,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Group as GroupIcon,
  Person,
  LocationOn,
  Visibility,
  People,
  MoreVert,
  RemoveRedEye,
  EditOutlined,
  DeleteOutline,
  Refresh,
  Delete as DeleteIcon,
  CheckCircle,
  DirectionsWalk,
  TrendingUp,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  FilterList,
  RestartAlt,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { notifications } from '@mantine/notifications';

import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface Group {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    isTracking: boolean;
    pathayathiraiStatus: string;
  }>;
  isActive: boolean;
  maxMembers: number;
  pathayathiraiStatus: string;
  memberCount: number;
  activeMemberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GroupFormData {
  name: string;
  description: string;
  maxMembers: number;
}

interface GroupStats {
  total: number;
  active: number;
  inProgress: number;
  totalMembers: number;
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

const StatusChip = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return { color: 'default', label: 'Not Started' };
      case 'in_progress': return { color: 'primary', label: 'In Progress' };
      case 'completed': return { color: 'success', label: 'Completed' };
      default: return { color: 'default', label: status };
    }
  };

  const { color, label } = getStatusColor(status);
  return <Chip size="small" label={label} color={color as any} />;
};

const SkeletonRow = () => (
  <TableRow>
    <TableCell align="center" sx={{ py: 2 }}>
      <Skeleton variant="text" width={30} height={16} />
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Box>
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="80%" height={16} />
      </Box>
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Box display="flex" alignItems="center">
        <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
        <Box>
          <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={120} height={14} />
        </Box>
      </Box>
    </TableCell>
    <TableCell align="center" sx={{ py: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="center">
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 0.5 }} />
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 0.5 }} />
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
        <Skeleton variant="text" width={40} height={16} />
      </Box>
    </TableCell>
    <TableCell align="center" sx={{ py: 2 }}>
      <Skeleton variant="rounded" width={80} height={24} />
    </TableCell>
    <TableCell align="center" sx={{ py: 2 }}>
      <Skeleton variant="rounded" width={90} height={24} />
    </TableCell>
    <TableCell align="center" sx={{ py: 2 }}>
      <Skeleton variant="text" width={70} height={16} />
    </TableCell>
    <TableCell align="center" sx={{ py: 2 }}>
      <Box display="flex" justifyContent="center" gap={1}>
        <Skeleton variant="rounded" width={36} height={36} />
        <Skeleton variant="rounded" width={36} height={36} />
        <Skeleton variant="rounded" width={36} height={36} />
      </Box>
    </TableCell>
  </TableRow>
);

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');

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

  const [stats, setStats] = useState<GroupStats>({
    total: 0,
    active: 0,
    inProgress: 0,
    totalMembers: 0
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    maxMembers: 50,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      // Fetch all groups (including inactive) for accurate total count
      const response = await fetch('/api/groups?includeMembers=true&includeInactive=true');
      const data = await response.json();

      if (response.ok) {
        const allGroupsData = data.groups;
        // Filter out inactive groups for display (only show active groups)
        const activeGroupsData = allGroupsData.filter((group: Group) => group.isActive !== false);
        setGroups(activeGroupsData);
        
        // Calculate accurate stats with debugging - use active groups for display stats
        const total = activeGroupsData.length;
        const active = activeGroupsData.filter((group: Group) => group.isActive === true).length;
        const inProgress = activeGroupsData.filter((group: Group) => 
          group.pathayathiraiStatus === 'in_progress'
        ).length;
        const completed = activeGroupsData.filter((group: Group) => 
          group.pathayathiraiStatus === 'completed'
        ).length;
        const notStarted = activeGroupsData.filter((group: Group) => 
          group.pathayathiraiStatus === 'not_started'
        ).length;
        
        // Calculate total members accurately from active groups only
        const totalMembers = activeGroupsData.reduce((sum: number, group: Group) => {
          const memberCount = group.memberCount || 0;
          return sum + memberCount;
        }, 0);
        
        
        
        setStats({ 
          total, 
          active, 
          inProgress: inProgress > 0 ? inProgress : (completed > 0 ? completed : notStarted),
          totalMembers 
        });
      } else {
        showNotification(data.error || 'Failed to fetch groups', 'error');
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Group created successfully!', 'success');
        setOpenDialog(false);
        resetForm();
        fetchGroups();
      } else {
        showNotification(data.error || 'Failed to create group!', 'error');
      }
    } catch (error) {
      showNotification('Network error! Please check your connection.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      setFormLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/groups/${selectedGroup._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Group updated successfully!', 'success');
        setOpenDialog(false);
        resetForm();
        fetchGroups();
      } else {
        showNotification(data.error || 'Failed to update group!', 'error');
      }
    } catch (error) {
      showNotification('Network error! Please check your connection.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, event?: React.MouseEvent) => {
    // Prevent any event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setGroupToDelete(groupId);
    setDeleteDialog(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      
      // Always use permanent delete
      const response = await fetch(`/api/groups/${groupToDelete}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message || 'Group permanently deleted successfully!', 'success');
        fetchGroups();
      } else {
        showNotification(data.error || 'Failed to delete group!', 'error');
      }
    } catch (error) {
      showNotification('Network error! Please check your connection.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteDialog(false);
      setGroupToDelete(null);
    }
  };

  const cancelDeleteGroup = () => {
    if (deleteLoading) return; // Prevent cancellation while deleting
    setDeleteDialog(false);
    setGroupToDelete(null);
  };



  const openAddDialog = () => {
    setDialogMode('add');
    resetForm();
    setOpenDialog(true);
  };

  const openEditDialog = (group: Group) => {
    setDialogMode('edit');
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      maxMembers: group.maxMembers,
    });
    setOpenDialog(true);
  };

  const openViewDialog = (group: Group) => {
    setDialogMode('view');
    setSelectedGroup(group);
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxMembers: 50,
    });
    setSelectedGroup(null);
  };

  const handleApplyFilters = () => {
    // This function can be used to trigger any additional filter logic if needed
    // For now, the filtering is reactive, so this just refreshes the data
    fetchGroups();
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setCreatorFilter('');
    setDescriptionFilter('');
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setCreatorFilter('');
    setDescriptionFilter('');
  };

  const applyFilters = () => {
    // This function can be used to trigger any additional filter logic if needed
    // For now, the filtering is reactive, so this just refreshes the data
    fetchGroups();
  };

  const filteredGroups = groups.filter(group => {
    const matchesName = nameFilter === '' || 
      group.name.toLowerCase().includes(nameFilter.toLowerCase());

    const matchesCreator = creatorFilter === '' ||
      group.createdBy.name.toLowerCase().includes(creatorFilter.toLowerCase()) ||
      group.createdBy.email.toLowerCase().includes(creatorFilter.toLowerCase());

    const matchesDescription = descriptionFilter === '' ||
      group.description.toLowerCase().includes(descriptionFilter.toLowerCase());

    return matchesName && matchesCreator && matchesDescription;
  });

  const handleSubmit = () => {
    if (dialogMode === 'add') {
      handleCreateGroup();
    } else if (dialogMode === 'edit') {
      handleUpdateGroup();
    }
  };

const [page, setPage] = useState(1);
const rowsPerPage = 10; 

const totalPages = Math.ceil(filteredGroups.length / rowsPerPage);
const paginatedGroups = filteredGroups.slice(
  (page - 1) * rowsPerPage,
  page * rowsPerPage
);

const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
  setPage(value);
};

useEffect(() => {
  setPage(1);
}, [nameFilter, creatorFilter, descriptionFilter]);


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
              Loading Groups..
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
            title="Total Groups"
            value={stats.total}
            icon={<GroupIcon sx={{ fontSize: 38 }} />}
            color="#667eea"
          />
          <StatCard
            title="Active Groups"
            value={stats.active}
            icon={<CheckCircle sx={{ fontSize: 38 }} />}
            color="#764ba2"
          />
          <StatCard
            title="Journey Status"
            value={stats.inProgress}
            icon={<DirectionsWalk sx={{ fontSize: 38 }} />}
            color="#8B5CF6"
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={<TrendingUp sx={{ fontSize: 38 }} />}
            color="#667eea"
          />
        </Box>

        {/* Groups Table */}
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
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#7353ae' }}>
                  Groups 
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchGroups}
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
                  startIcon={<Add />}
                  onClick={openAddDialog}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Add Group
                </Button>
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
                <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: 'bold' }}>
                  Filter Groups
                </Typography>
                
                {/* Filter Fields Row - 3 Fields */}
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Group Name"
                    placeholder="Enter group name"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon color="action" />
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
                    label="Description"
                    placeholder="Enter description"
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Edit color="action" />
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
                    label="Creator"
                    placeholder="Enter creator name or email"
                    value={creatorFilter}
                    onChange={(e) => setCreatorFilter(e.target.value)}
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
                </Box>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
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

            {/* Table Container */}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #f0f0f0' } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center', width: '60px' }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Group Information
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Creator
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Members
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Active Tracking
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Created
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Show skeleton loading when initially loading the page
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonRow key={`skeleton-${index}`} />
                    ))
                  ) : filteredGroups.length === 0 ? (
                    // Show no data message when no groups found
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No groups found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Show actual data when loaded
paginatedGroups.map((group, index) => (
                      <TableRow key={group._id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                        <TableCell align="center" sx={{ py: 2 }}>
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
                        <TableCell sx={{ py: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium" sx={{ color: '#374151', mb: 0.5 }}>
                              {group.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {group.description.length > 50 
                                ? `${group.description.substring(0, 50)}...` 
                                : group.description
                              }
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#f57c00' }}>
                              {group.createdBy?.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                {group?.createdBy?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {group?.createdBy?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="center">
                            <AvatarGroup max={4} sx={{ mr: 1 }}>
                              {group.members.slice(0, 4).map((member) => (
                                <Avatar key={member._id} sx={{ width: 24, height: 24, bgcolor: '#10b981' }}>
                                  {member.name.charAt(0).toUpperCase()}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                              {group.memberCount}/{group.maxMembers}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <StatusChip status={group.pathayathiraiStatus} />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Chip
                            size="small"
                            label={`${group.activeMemberCount} tracking`}
                            color={group.activeMemberCount > 0 ? 'success' : 'default'}
                            icon={<LocationOn />}
                            sx={{
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: 'inherit',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            {new Date(group.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
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
                            <Tooltip title="View Details" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => openViewDialog(group)}
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
                            
                            <Tooltip title="Edit Group" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => openEditDialog(group)}
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
                            
                            <Tooltip title="Delete Group Permanently" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={(e) => handleDeleteGroup(group._id, e)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
              {/* Pagination */}
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

        {/* Add/Edit Dialog */}
        <Dialog
          open={openDialog && dialogMode !== 'view'}
          onClose={() => setOpenDialog(false)}
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
          }}
        >
          <DialogTitle 
            sx={{ 
              textAlign: 'center', 
              py: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderBottom: '3px solid rgba(255,255,255,0.2)'
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'white',
                  letterSpacing: '0.5px'
                }}
              >
                {dialogMode === 'add' ? 'Add Group' : 'Edit Group'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.9rem'
                }}
              >
              
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
            <Box component="form" sx={{ mt: 2 }}>
              <Stack spacing={4}>
                {/* Group Basic Information */}
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
                    <GroupIcon sx={{ color: '#1565c0', fontSize: 28 }} />
                    Group Information
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
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <TextField
                      fullWidth
                      label="Group Name"
                      placeholder="Enter group name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#FF6B35',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Maximum Members"
                      type="number"
                      placeholder="Set group capacity"
                      value={formData.maxMembers === null || formData.maxMembers === undefined ? '' : formData.maxMembers}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          maxMembers: value === '' ? 0 : parseInt(value, 10),
                        });
                      }}
                      inputProps={{ min: 1, max: 100 }}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <People color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#FF6B35',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Group Description */}
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
                    <Edit sx={{ color: '#2e7d32', fontSize: 28 }} />
                    Group Description
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
                  
                  
                    <TextField
                      fullWidth
                      label="Description"
              
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      multiline
                      rows={4}
                      required
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          
                          '& fieldset': {
                            borderColor: '#c1c2c2',
                          },
                          '&:hover fieldset': {
                            borderColor: '#FF6B35',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                </Box>

              </Stack>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            gap: 2,
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={() => setOpenDialog(false)} 
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
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={formLoading || !formData.name || !formData.description}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
                '&:disabled': {
                  background: '#cccccc',
                },
              }}
            >
              {formLoading ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                dialogMode === 'add' ? 'Create Group' : 'Update Group'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={openDialog && dialogMode === 'view'}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            py: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: '3px solid rgba(255,255,255,0.2)'
          }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                {selectedGroup?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Group Details & Members
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ 
            p: 4, 
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            minHeight: '500px'
          }}>
            {selectedGroup && (
              <Box>
                {/* Group Information Cards Grid */}
                <Typography variant="h6" sx={{ mb: 3, color: '#374151', fontWeight: 700 }}>
                  Group Information
                </Typography>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                  gap: 3, 
                  mb: 4 
                }}>
                  {/* Description Card */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
                    border: '1px solid #e3f2fd',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        color: 'white'
                      }}>
                        <DescriptionIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        Description
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.6 }}>
                      {selectedGroup.description || 'No description provided'}
                    </Typography>
                  </Card>

                  {/* Status Card */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%)',
                    border: '1px solid #e8f5e8',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                        color: 'white'
                      }}>
                        <TrendingUpIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#388e3c' }}>
                        Journey Status
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="center">
                      <StatusChip status={selectedGroup.pathayathiraiStatus} />
                    </Box>
                  </Card>

                  {/* Members Count Card */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
                    border: '1px solid #fff3e0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                        color: 'white'
                      }}>
                        <GroupIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57c00' }}>
                        Members
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#f57c00', mb: 1 }}>
                        {selectedGroup.memberCount}/{selectedGroup.maxMembers}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Total Capacity
                      </Typography>
                    </Box>
                  </Card>

                  {/* Active Tracking Card */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)',
                    border: '1px solid #f3e5f5',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                        color: 'white'
                      }}>
                        <LocationOnIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
                        Active Tracking
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#7b1fa2', mb: 1 }}>
                        {selectedGroup.activeMemberCount}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Members Tracking
                      </Typography>
                    </Box>
                  </Card>

                  {/* Created By Card */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)',
                    border: '1px solid #fce4ec',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                        color: 'white'
                      }}>
                        <PersonIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#c2185b' }}>
                        Created By
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        {selectedGroup.createdBy?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {selectedGroup.createdBy?.email || 'No email available'}
                      </Typography>
                    </Box>
                  </Card>

                  {/* Created Date Card */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)',
                    border: '1px solid #e0f2f1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #009688 0%, #00695c 100%)',
                        color: 'white'
                      }}>
                        <CalendarTodayIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#00695c' }}>
                        Created On
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151' }}>
                      {new Date(selectedGroup.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Card>
                </Box>

                {/* Members Section */}
                <Box sx={{ mt: 4 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}>
                      <GroupIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151' }}>
                      Group Members ({selectedGroup.members.length})
                    </Typography>
                  </Box>

                  {selectedGroup.members.length > 0 ? (
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                      gap: 3 
                    }}>
                      {selectedGroup.members.map((member) => (
                        <Card key={member._id} sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                            borderColor: '#667eea',
                          }
                        }}>
                          <Box display="flex" alignItems="center" gap={3}>
                            <Avatar sx={{ 
                              width: 56, 
                              height: 56,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontSize: '1.5rem',
                              fontWeight: 700
                            }}>
                              {member.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                                {member.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                                {member.email}
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                <StatusChip status={member.pathayathiraiStatus} />
                                <Chip
                                  size="small"
                                  label={member.isTracking ? 'Tracking' : 'Not Tracking'}
                                  color={member.isTracking ? 'success' : 'default'}
                                  icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Card sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                      border: '2px dashed #e2e8f0'
                    }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '50%', 
                        background: '#f1f5f9',
                        display: 'inline-flex',
                        mb: 2
                      }}>
                        <GroupIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                        No Members Yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        This group doesn't have any members yet.
                      </Typography>
                    </Card>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            justifyContent: 'center'
          }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={cancelDeleteGroup}
          maxWidth="xs"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: '#ef4444' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, }}>
                       <DeleteIcon sx={{ color: '#ef4444' }} />
                       Delete Group
                     </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
        
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to delete this group?
            </Typography>
        
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteGroup}
              variant="outlined"
              size="medium"
              disabled={deleteLoading}
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
              onClick={confirmDeleteGroup}
              variant="contained"
              color="error"
              size="medium"
              disabled={deleteLoading}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
              
              }}
            >
              {deleteLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress 
                    size={20} 
                    sx={{ 
                      color: 'white',
                      animation: 'spin 1s linear infinite'
                    }} 
                  />
                  <Typography sx={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                    Deleting...
                  </Typography>
                </Box>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogActions>
        </Dialog>



        {/* Toast Container */}
        
      </Box>
    </AdminLayout>
  );
}
