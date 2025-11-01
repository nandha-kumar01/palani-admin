'use client';

import { useState, useEffect } from 'react';
import Player from 'react-lottie-player';
import Loading from '../../../../Loading.json';
import { notifications } from '@mantine/notifications';
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
  Avatar,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Search,
  BugReport,
  Feedback,
  HelpOutline,
  Person,
  Email,
  Phone,
  CalendarToday,
  Refresh,
  FilterList,
  RestartAlt,
  CheckCircle,
  Cancel,
  Schedule,
  PriorityHigh,
  Flag,
  AdminPanelSettings,
  Group,
  ReportProblem,
  QuestionAnswer,
  Star,
  StarBorder,
  MoreVert,
  Reply,
  Done,
  DoneAll,
  Close,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { Filter } from 'iconoir-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface UserSupport {
  _id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature_request' | 'general_inquiry' | 'technical_support' | 'account_issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  adminNotes: string;
  replies: Array<{
    message: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    createdAt: string;
  }>;
  userRating?: number;
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  userSatisfactionRating: number;
}

const StatCard = ({ title, value, icon, color, subtitle, loading = false }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
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
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {loading ? <Skeleton width={100} height={16} /> : subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: color, opacity: 0.8 }}>
          {loading ? <Skeleton variant="circular" width={40} height={40} /> : icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function UserSupportPage() {
  const [supportTickets, setSupportTickets] = useState<UserSupport[]>([]);
  const [stats, setStats] = useState<SupportStats>({ 
    totalTickets: 0, 
    openTickets: 0, 
    inProgressTickets: 0, 
    resolvedTickets: 0,
    averageResolutionTime: 0,
    userSatisfactionRating: 0
  });
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  
  // Individual filter states
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Search filter toggle state
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  
  // Dialog states
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<UserSupport | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Dialog states for actions
  const [replyDialog, setReplyDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  // Action handlers
  const handleReplyTicket = async () => {
    if (!selectedTicketId || !replyText.trim()) {
      showNotification('Please select a ticket and enter a reply message.', 'error');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('Authentication token not found. Please login again.');
        setActionLoading(false);
        return;
      }

      const requestBody = {
        ticketId: selectedTicketId,
        adminNotes: replyText.trim(),
        status: 'in_progress'
      };


      const response = await fetch(`/api/admin/user-support`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      
      const responseData = await response.json();

      if (response.ok) {
        showNotification('Reply added successfully!');
        setReplyDialog(false);
        setReplyText('');
        setSelectedTicketId(null); // Reset only on success
        fetchSupportTickets();
      } else {
        showNotification(`Failed to add reply: ${responseData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showNotification('Error adding reply: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTicketId) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication token not found. Please login again.');
        setActionLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/user-support`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          status: 'resolved',
          resolvedAt: new Date().toISOString()
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        showNotification('Ticket marked as resolved!');
        setSelectedTicketId(null);
        fetchSupportTickets();
      } else {
        showNotification(`Failed to mark ticket as resolved: ${responseData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
      showNotification('Error resolving ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication token not found. Please login again.');
        setActionLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/user-support`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          status: 'closed',
          closedAt: new Date().toISOString()
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        showNotification('Ticket closed successfully!');
        setSelectedTicketId(null);
        fetchSupportTickets();
      } else {
        showNotification(`Failed to close ticket: ${responseData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      showNotification('Error closing ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicketId) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication token not found. Please login again.');
        setActionLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/user-support?ticketId=${selectedTicketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.json();

      if (response.ok) {
        showNotification('Ticket deleted successfully!');
        setDeleteDialog(false);
        setSelectedTicketId(null);
        fetchSupportTickets();
      } else {
        showNotification(`Failed to delete ticket: ${responseData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showNotification('Error deleting ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter functions
  const handleApplyFilters = () => {
    fetchSupportTickets();
    showNotification('Filters applied successfully!');
  };

  const handleResetFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setSearchTerm('');
    setShowSearchFilter(false);
    showNotification('Filters reset successfully!', 'info');
  };

  // Debug token function
  const debugToken = () => {
    const token = localStorage.getItem('token');
    
    if (!token || token.trim().length === 0) {
      showNotification('Invalid or missing admin token. Please login again.');
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchSupportTickets();
  }, [typeFilter, statusFilter, priorityFilter, searchTerm]);

  // Timer for loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const fetchSupportTickets = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      
      
      if (!token) {
        showNotification('Admin token not found. Please login again.');
        setLoading(false);
        setStatsLoading(false);
        return;
      }
      
      // Build query parameters for individual filters
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const queryString = params.toString();
      const url = `/api/admin/user-support${queryString ? `?${queryString}` : ''}`;
      
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (response.ok) {
        const data = await response.json();
        
        setSupportTickets(data.tickets || []);
        setStats(data.stats || {});
        setPagination(data.pagination || {});
        
      } else {
        const errorData = await response.json();
        showNotification(`Failed to fetch tickets: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showNotification('Error fetching support tickets');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // Helper function for Type chip
  const getTypeChip = (ticket: UserSupport) => {
    const typeColors = {
      bug: '#f44336',
      feature_request: '#2196f3',
      general_inquiry: '#9c27b0',
      technical_support: '#ff9800',
      account_issue: '#4caf50'
    };

    const typeLabels = {
      bug: 'Bug Report',
      feature_request: 'Feature Request',
      general_inquiry: 'General Inquiry',
      technical_support: 'Technical Support',
      account_issue: 'Account Issue'
    };

    const typeIcons = {
      bug: <BugReport />,
      feature_request: <Star />,
      general_inquiry: <HelpOutline />,
      technical_support: <QuestionAnswer />,
      account_issue: <Person />
    };

    return (
      <Chip
        icon={typeIcons[ticket.type]}
        label={typeLabels[ticket.type]}
        sx={{
          backgroundColor: typeColors[ticket.type],
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
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
    );
  };

  // Helper function for Priority chip
  const getPriorityChip = (ticket: UserSupport) => {
    const priorityColors = {
      low: '#9e9e9e',
      medium: '#2196f3',
      high: '#ff9800',
      urgent: '#f44336'
    };

    const priorityIcons = {
      low: <Flag />,
      medium: <PriorityHigh />,
      high: <ReportProblem />,
      urgent: <ReportProblem />
    };

    return (
      <Chip
        icon={priorityIcons[ticket.priority]}
        label={ticket.priority.toUpperCase()}
        sx={{
          backgroundColor: priorityColors[ticket.priority],
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
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
    );
  };

  // Helper function for Status chip
  const getStatusChip = (ticket: UserSupport) => {
    const statusColors = {
      open: '#ff9800',
      in_progress: '#2196f3',
      resolved: '#4caf50',
      closed: '#9e9e9e'
    };

    const statusIcons = {
      open: <Schedule />,
      in_progress: <AdminPanelSettings />,
      resolved: <CheckCircle />,
      closed: <Cancel />
    };

    const statusLabels = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };

    return (
      <Chip
        icon={statusIcons[ticket.status]}
        label={statusLabels[ticket.status]}
        sx={{
          backgroundColor: statusColors[ticket.status],
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
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
    );
  };

  const handleViewTicket = (ticket: UserSupport) => {
    setSelectedTicket(ticket);
    setViewDialog(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ticketId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTicketId(ticketId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTicketId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        
        {/* Statistics Cards */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(6, 1fr)' }, 
            gap: 2,
            mb: 3 
          }}>
            <StatCard
              title="Total Tickets"
              value={stats.totalTickets.toLocaleString()}
              icon={<HelpOutline sx={{ fontSize: 30 }} />}
              color="#667eea"
              loading={statsLoading}
            />
            <StatCard
              title="Open Tickets"
              value={stats.openTickets}
              icon={<Schedule sx={{ fontSize: 30 }} />}
              color="#ff9800"
              loading={statsLoading}
            />
            <StatCard
              title="In Progress"
              value={stats.inProgressTickets}
              icon={<AdminPanelSettings sx={{ fontSize: 30 }} />}
              color="#2196f3"
              loading={statsLoading}
            />
            <StatCard
              title="Resolved"
              value={stats.resolvedTickets}
              icon={<CheckCircle sx={{ fontSize: 30 }} />}
              color="#4caf50"
              loading={statsLoading}
            />
            <StatCard
              title="Avg Resolution"
              value={`${stats.averageResolutionTime}h`}
              icon={<Schedule sx={{ fontSize: 30 }} />}
              color="#9c27b0"
              loading={statsLoading}
            />
            <StatCard
              title="Satisfaction"
              value={`${stats.userSatisfactionRating}/5`}
              icon={<Star sx={{ fontSize: 30 }} />}
              color="#ff5722"
              loading={statsLoading}
            />
          </Box>
        </Box>

        {/* Support Tickets Table */}
        <Card>
          <CardContent>
            {/* Table Card Header with Actions */}
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
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                  User Support Tickets
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchSupportTickets}
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
                backgroundColor: '#f8f9ff', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e0e7ff' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 600 }}>
                  Filter Support Tickets
                </Typography>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, 
                  gap: 2,
                  mb: 2 
                }}>
                  <TextField
                    fullWidth
                    label="Search"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="action" />
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
                    select
                    label="Type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
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
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="bug">Bug Report</MenuItem>
                    <MenuItem value="feature_request">Feature Request</MenuItem>
                    <MenuItem value="general_inquiry">General Inquiry</MenuItem>
                    <MenuItem value="technical_support">Technical Support</MenuItem>
                    <MenuItem value="account_issue">Account Issue</MenuItem>
                  </TextField>

                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </TextField>
                </Box>

                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' }, 
                  gap: 2,
                  mb: 2 
                }}>
                  <TextField
                    fullWidth
                    select
                    label="Priority"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
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
                  >
                    <MenuItem value="">All Priority</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </TextField>
                  <Box></Box>
                  <Box></Box>
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

            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #f0f0f0' } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      Ticket Information
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>
                      User Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Priority
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Created Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`} sx={{ '& .MuiTableCell-root': { py: 2.5 } }}>
                        <TableCell align="center">
                          <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box>
                              <Skeleton variant="text" width={150} height={20} sx={{ mb: 0.5 }} />
                              <Skeleton variant="text" width={200} height={16} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Skeleton variant="text" width="85%" height={20} sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width="70%" height={20} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={110} height={34} sx={{ mx: 'auto', borderRadius: 2.5 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="text" width={80} height={20} />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 2 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : supportTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                          <HelpOutline sx={{ fontSize: 64, color: '#d1d5db' }} />
                          <Typography variant="h6" color="textSecondary">
                            No support tickets found
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {searchTerm ? 'Try adjusting your search criteria' : 'No support tickets have been submitted yet'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Actual Data Rows
                    supportTickets.map((ticket, index) => (
                      <TableRow 
                        key={ticket._id} 
                        hover 
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#f9fafb',
                            transition: 'all 0.2s ease',
                          },
                          '& .MuiTableCell-root': { py: 2.5 }
                        }}
                      >
                        <TableCell align="center">
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
                        
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar 
                              sx={{ 
                                bgcolor: '#667eea',
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                                fontWeight: 600
                              }}
                            >
                              {ticket.title.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: '#111827',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.2,
                                  mb: 0.5,
                                }}
                              >
                                {ticket.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#6b7280',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {ticket.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ minWidth: 200 }}>
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
                              <Person sx={{ fontSize: 14, color: '#6b7280' }} />
                              {ticket.userId?.name || 'Anonymous User'}
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
                              <Email sx={{ fontSize: 14, color: '#6b7280' }} />
                              {ticket.userId?.email || 'No email provided'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getTypeChip(ticket)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getPriorityChip(ticket)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            {getStatusChip(ticket)}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#374151',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}
                          >
                            {formatDate(ticket.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 2, width: 150 }}>
                          <Box 
                            display="flex" 
                            justifyContent="center" 
                            alignItems="center"
                            gap={1}
                            sx={{
                              minHeight: 48,
                              width: '100%',
                            }}
                          >
                            <Tooltip title="View Ticket" arrow>
                              <IconButton
                                onClick={() => handleViewTicket(ticket)}
                                sx={{
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease',
                                  border: '1px solid #4caf50',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  '&:hover': {
                                    backgroundColor: '#45a049',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  }
                                }}
                              >
                                <Visibility sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="More Actions" arrow>
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, ticket._id)}
                                sx={{
                                  backgroundColor: '#667eea',
                                  color: 'white',
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease',
                                  border: '1px solid #667eea',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  '&:hover': {
                                    backgroundColor: '#5a67d8',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  }
                                }}
                              >
                                <MoreVert sx={{ fontSize: 18 }} />
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

        {/* Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 2,
              minWidth: 180,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }
          }}
        >
          <MenuItem onClick={() => {
            setReplyDialog(true);
            setMenuAnchor(null); // Only close the menu, don't reset selectedTicketId yet
          }}>
            <Reply sx={{ mr: 1, fontSize: 18 }} />
            Reply
          </MenuItem>
          <MenuItem onClick={() => {
            handleMarkResolved();
            setMenuAnchor(null);
          }}>
            <Done sx={{ mr: 1, fontSize: 18 }} />
            Mark as Resolved
          </MenuItem>
          <MenuItem onClick={() => {
            handleCloseTicket();
            setMenuAnchor(null);
          }}>
            <Close sx={{ mr: 1, fontSize: 18 }} />
            Close Ticket
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => {
            setDeleteDialog(true);
            setMenuAnchor(null); // Only close the menu, don't reset selectedTicketId yet
          }} sx={{ color: '#f44336' }}>
            <Delete sx={{ mr: 1, fontSize: 18 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* View Ticket Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: '#667eea' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <HelpOutline sx={{ color: '#667eea' }} />
              Support Ticket Details
            </Box>
          </DialogTitle>
          
          {selectedTicket && (
            <DialogContent sx={{ py: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {selectedTicket.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                  {selectedTicket.description}
                </Typography>
                
                <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                  {getTypeChip(selectedTicket)}
                  {getPriorityChip(selectedTicket)}
                  {getStatusChip(selectedTicket)}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  User Information:
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedTicket.userId?.name || 'Anonymous User'}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedTicket.userId?.email || 'No email provided'}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {selectedTicket.userId?.phone || 'No phone provided'}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Admin Replies Section */}
                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                      Admin Replies ({selectedTicket.replies.length}):
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                      {selectedTicket.replies.map((reply, index) => (
                        <Box
                          key={index}
                          sx={{
                            backgroundColor: '#f8f9ff',
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            border: '1px solid #e0e7ff'
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                              {reply.adminName} ({reply.adminEmail})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(reply.createdAt)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#374151' }}>
                            {reply.message}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                <Typography variant="body2" color="text.secondary">
                  <strong>Created:</strong> {formatDate(selectedTicket.createdAt)}
                </Typography>
                {selectedTicket.resolvedAt && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Resolved:</strong> {formatDate(selectedTicket.resolvedAt)}
                  </Typography>
                )}
              </Box>
            </DialogContent>
          )}
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setViewDialog(false)} 
              variant="outlined"
              size="medium"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#bdbdbd',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog
          open={replyDialog}
          onClose={() => {
            setReplyDialog(false);
            setSelectedTicketId(null); // Reset selectedTicketId when dialog is closed
          }}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              minHeight: '300px'
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: '#667eea' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Reply sx={{ color: '#667eea' }} />
              Reply to Ticket
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setReplyDialog(false);
                setReplyText('');
                setSelectedTicketId(null); // Reset when canceling
              }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#ccc',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                handleReplyTicket();
              }}
              disabled={!replyText.trim() || actionLoading}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Reply'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={() => {
            setDeleteDialog(false);
            setSelectedTicketId(null);
          }}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', py: 2, fontWeight: 600, color: '#f44336' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Delete sx={{ color: '#f44336' }} />
              Delete Ticket
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setDeleteDialog(false);
                setSelectedTicketId(null);
              }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#ccc',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDeleteTicket}
              disabled={actionLoading}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#f44336',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                },
              }}
            >
              {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

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
                Loading Support Tickets...
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}