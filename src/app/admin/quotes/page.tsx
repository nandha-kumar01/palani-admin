'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
    Pagination,
    PaginationItem,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  DeleteOutlined as DeleteIcon,
  Visibility,
  FilterList,
  MoreVert,
  Star,
  StarBorder,
  Language,
  Category,
  Refresh,
  CloudDownload,
  CloudUpload,
  Analytics,
  Share,
  ThumbUp,
  FormatQuote,
  CheckCircle,
  Block,
  Person,
  Cancel,
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import AdminLayout from '@/components/admin/AdminLayout';
import { Grid } from '@mui/material';
import { Filter } from 'iconoir-react';

interface Quote {
  _id: string;
  text: string;
  author: string;
  category: string;
  language: string;
  tags: string[];
  source?: string;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  mobileAppStats?: {
    views: number;
    likes: number;
    shares: number;
    downloads: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  metadata: {
    difficulty: string;
    readingTime: number;
    sentiment: string;
  };
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  featured: number;
  categories: {
    [key: string]: number;
  };
  languages: {
    [key: string]: number;
  };
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

const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
  const config = {
    title,
    message,
    autoClose: type === 'error' ? 5000 : 4000,
    withCloseButton: true,
    style: { marginTop: '60px' },
  };

  switch (type) {
    case 'success':
      notifications.show({ ...config, color: 'green' });
      break;
    case 'error':
      notifications.show({ ...config, color: 'red' });
      break;
    case 'warning':
      notifications.show({ ...config, color: 'orange' });
      break;
    case 'info':
      notifications.show({ ...config, color: 'blue' });
      break;
  }
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Applied filters: used to actually request filtered data only when "Filter" is clicked
  const [appliedFilters, setAppliedFilters] = useState<{ search: string; category: string; author: string; language: string; status: string }>({
    search: '',
    category: '',
    author: '',
    language: '',
    status: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    author: '',
    category: 'devotional',
    language: 'tamil',
    tags: ['murugan', 'lord murugan', 'tamil god'],
    source: '',
    isActive: true,
    isFeatured: false,
    priority: 1,
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  
  const router = useRouter();

  const categories = [
    'motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 
    'happiness', 'peace', 'devotional', 'inspirational'
  ];
  
  const languages = ['tamil', 'english', 'hindi', 'sanskrit'];

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(appliedFilters.search && { search: appliedFilters.search }),
        ...(appliedFilters.category && { category: appliedFilters.category }),
        ...(appliedFilters.author && { author: appliedFilters.author }),
        ...(appliedFilters.language && { language: appliedFilters.language }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
      });

      // Add Murugan-specific search if no specific applied search term
      if (!appliedFilters.search) {
        params.append('search', 'murugan');
      }

      const response = await fetch(`/api/admin/quotes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      
      // Use only database data
      const quotesData = data.quotes || [];

      setQuotes(quotesData);
      setStats(data.stats || {
        total: 0,
        active: 0,
        inactive: 0,
        deleted: 0,
        featured: 0,
        categories: {},
        languages: {}
      });
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      showNotification('error', 'Error', 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async (quoteId: string, permanent: boolean = false) => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          permanent,
          deletedBy: JSON.parse(localStorage.getItem('user') || '{}')._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      showNotification('success', 'Success', permanent ? 'Quote permanently deleted' : 'Quote deleted successfully');
      fetchQuotes();
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
      showNotification('error', 'Error', 'Failed to delete quote');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteDialog = (quote: Quote) => {
    setSelectedQuote(quote);
    setDeleteDialogOpen(true);
  };

  const cancelDeleteQuote = () => {
    setDeleteDialogOpen(false);
    setSelectedQuote(null);
  };

  const confirmDeleteQuote = (permanent: boolean = false) => {
    if (selectedQuote) {
      handleDelete(selectedQuote._id, permanent);
    }
  };

  const handleToggleActive = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          isActive: !quote.isActive,
          updatedBy: JSON.parse(localStorage.getItem('user') || '{}')._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      showNotification('success', 'Success', `Quote ${!quote.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote:', error);
      showNotification('error', 'Error', 'Failed to update quote');
    }
  };

  const handleToggleFeatured = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          isFeatured: !quote.isFeatured,
          updatedBy: JSON.parse(localStorage.getItem('user') || '{}')._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      showNotification('success', 'Success', `Quote ${!quote.isFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote:', error);
      showNotification('error', 'Error', 'Failed to update quote');
    }
  };

  const handleAddQuote = async () => {
    try {
      // Save to database via API
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          createdBy: JSON.parse(localStorage.getItem('user') || '{}')._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add quote');
      }

      showNotification('success', 'Success', 'Quote added successfully');
      setAddModalOpen(false);
      fetchQuotes(); // Refresh from server
    } catch (error) {
      console.error('Error adding quote:', error);
      showNotification('error', 'Error', 'Failed to add quote');
    }
  };

  const handleEditQuote = async () => {
    if (!editingQuote) return;

    try {
      // Update via API
      const response = await fetch(`/api/admin/quotes/${editingQuote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          updatedBy: JSON.parse(localStorage.getItem('user') || '{}')._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      showNotification('success', 'Success', 'Quote updated successfully');
      setEditModalOpen(false);
      setEditingQuote(null);
      fetchQuotes(); // Refresh from server
    } catch (error) {
      console.error('Error updating quote:', error);
      showNotification('error', 'Error', 'Failed to update quote');
    }
  };

  const updateViewCount = (quoteId: string) => {
    setQuotes(prevQuotes => 
      prevQuotes.map(quote => 
        quote._id === quoteId 
          ? { ...quote, viewCount: quote.viewCount + 1 }
          : quote
      )
    );
  };

  const updateLikeCount = (quoteId: string) => {
    setQuotes(prevQuotes => 
      prevQuotes.map(quote => 
        quote._id === quoteId 
          ? { ...quote, likeCount: quote.likeCount + 1 }
          : quote
      )
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      motivational: '#4CAF50',
      spiritual: '#9C27B0',
      wisdom: '#FF9800',
      love: '#E91E63',
      success: '#2196F3',
      life: '#607D8B',
      happiness: '#FFEB3B',
      peace: '#00BCD4',
      devotional: '#795548',
      inspirational: '#FF5722',
    };
    return colors[category] || '#757575';
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      tamil: '#FF5722',
      english: '#2196F3',
      hindi: '#FF9800',
      sanskrit: '#9C27B0',
    };
    return colors[language] || '#757575';
  };

const totalPages = Math.ceil(totalItems / pageSize);
const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
  setPage(value);
};
useEffect(() => {
  setPage(1);
}, [appliedFilters]);


  return (
    <AdminLayout>
      <Box>

        {/* Stats Cards */}
        {stats && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 3, 
            mb: 3 
          }}>
            <StatCard
              title="Total Quotes"
              value={stats.total}
              icon={<FormatQuote sx={{ fontSize: 38 }} />}
              color="#667eea"
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={<CheckCircle sx={{ fontSize: 38 }}/>}
              color="#764ba2"
            />
            <StatCard
              title="Featured"
              value={stats.featured}
              icon={<Star sx={{ fontSize: 38 }} />}
               color="#8B5CF6"
            />
            <StatCard
              title="Inactive"
              value={stats.inactive}
              icon={<Block sx={{ fontSize: 38 }}/>}
              color="#667eea"
            />
          </Box>
        )}



        {/* Quotes Table - Matching Groups UI */}
        <Card>
          <CardContent>
            {/* Header with Actions - Matching Groups Style */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                  sx={{
                    backgroundColor: filterPanelOpen ? '#667eea15' : '#f5f5f5',
                    color: filterPanelOpen ? '#667eea' : '#666',
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
                  Quotes
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={fetchQuotes}
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
                  onClick={() => {
                    setFormData({
                      text: '',
                      author: '',
                      category: 'devotional',
                      language: 'tamil',
                      tags: ['murugan', 'lord murugan', 'tamil god'],
                      source: '',
                      isActive: true,
                      isFeatured: false,
                      priority: 1,
                    });
                    setAddModalOpen(true);
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Add Quote
                </Button>
              </Box>
            </Box>

            {/* Search Filter - Matching Groups Style */}
            {filterPanelOpen && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
                  Filter Quotes
                </Typography>
                
                {/* Filter Fields Row */}
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Quote Text"
                    placeholder="Search Tamil God Lord Murugan quotes..."
                    value={searchTerm}
                    onChange={handleSearch}
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
                    label="Author"
                    placeholder="Enter author name..."
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
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
                  
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea',
                          borderWidth: 2,
                        },
                      }}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="featured">Featured</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" alignItems="center"gap={2}>
                   <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('');
                        setAuthorFilter('');
                        setLanguageFilter('');
                        setStatusFilter('');
                        // clear applied filters so UI and data reset, keep panel open
                        setAppliedFilters({ search: '', category: '', author: '', language: '', status: '' });
                      }}
                      startIcon={<Refresh />}
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
                      onClick={() => {
                        // apply current UI fields into appliedFilters — fetch will run via effect
                        setAppliedFilters({ search: searchTerm, category: categoryFilter, author: authorFilter, language: languageFilter, status: statusFilter });
                      }}
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
            
            {/* Table Container - Matching Temple Table Style */}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #f0f0f0' } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Quote Text</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Author</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2 }}>Language</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Views</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Likes</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>Featured</TableCell>
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
                        <TableCell>
                          <Skeleton variant="text" width="80%" height={24} />
                          <Skeleton variant="text" width="60%" height={20} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="70%" height={20} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="rounded" width={80} height={28} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="rounded" width={70} height={28} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="text" width={40} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="text" width={40} height={20} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={60} height={28} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton variant="rounded" width={70} height={28} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center" sx={{ width: '200px' }}>
                          <Box display="flex" gap="8px" alignItems="center" justifyContent="center">
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : quotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No quotes found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotes.map((quote, index) => (
                      <TableRow key={quote._id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#374151',
                              fontSize: '0.875rem'
                            }}
                          >
                            {((page - 1) * pageSize) + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontStyle: 'italic',
                            lineHeight: 1.4,
                            fontSize: '0.875rem',
                            color: '#374151',
                            mb: 0.5,
                          }}>
                            "{quote.text}"
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                            {quote.author}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={quote.category}
                            size="small"
                            sx={{
                              bgcolor: getCategoryColor(quote.category),
                              color: 'white',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                              fontSize: '0.75rem',
                              height: '28px',
                              minWidth: '80px',
                              borderRadius: '14px',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={quote.language}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: getLanguageColor(quote.language),
                              color: getLanguageColor(quote.language),
                              textTransform: 'capitalize',
                              fontSize: '0.75rem',
                              height: '28px',
                              minWidth: '70px',
                              borderRadius: '14px',
                              borderWidth: '2px',
                              fontWeight: '600',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: 1,
                            bgcolor: '#f3f4f6',
                            borderRadius: '12px',
                            px: 1.5,
                            py: 0.5,
                            minHeight: '28px',
                            minWidth: '70px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#e5e7eb',
                              transform: 'scale(1.05)',
                            }
                          }}
                          onClick={() => updateViewCount(quote._id)}
                          >
                            <Visibility sx={{ fontSize: '16px', color: '#6b7280' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                              {(quote.viewCount + (quote.mobileAppStats?.views || 0)).toLocaleString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: 1,
                            bgcolor: '#fef3f2',
                            borderRadius: '12px',
                            px: 1.5,
                            py: 0.5,
                            minHeight: '28px',
                            minWidth: '70px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#fecaca',
                              transform: 'scale(1.05)',
                            }
                          }}
                          onClick={() => updateLikeCount(quote._id)}
                          >
                            <ThumbUp sx={{ fontSize: '16px', color: '#ef4444' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                              {(quote.likeCount + (quote.mobileAppStats?.likes || 0)).toLocaleString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={quote.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            icon={quote.isActive ? <CheckCircle sx={{ fontSize: '18px !important', color: '#ffffff !important' }} /> : <Cancel sx={{ fontSize: '18px !important', color: '#ffffff !important' }} />}
                            sx={{
                              minWidth: '110px',
                              height: '34px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 2.5,
                              backgroundColor: quote.isActive ? '#22c55e' : '#ef4444',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: quote.isActive ? '#16a34a' : '#dc2626',
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
                          {quote.isFeatured ? (
                            <Chip
                              label="Featured"
                              size="small"
                              icon={<Star sx={{ fontSize: '14px !important', color: '#ffffff !important' }} />}
                              sx={{
                                minWidth: '100px',
                                height: '34px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                borderRadius: 2.5,
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: '#d97706',
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
                          ) : (
                            <Chip
                              label="Regular"
                              size="small"
                              variant="outlined"
                              sx={{
                                minWidth: '100px',
                                height: '34px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                borderRadius: 2.5,
                                borderColor: '#d1d5db',
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease',
                              }}
                            />
                          )}
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
                            <Tooltip title="View Details" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => {
                                  setViewingQuote(quote);
                                  setViewModalOpen(true);
                                  updateViewCount(quote._id);
                                }}
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
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Edit Quote" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => {
                                  setEditingQuote(quote);
                                  setFormData({
                                    text: quote.text,
                                    author: quote.author,
                                    category: quote.category,
                                    language: quote.language,
                                    tags: quote.tags || ['murugan', 'lord murugan', 'tamil god'],
                                    source: quote.source || '',
                                    isActive: quote.isActive,
                                    isFeatured: quote.isFeatured,
                                    priority: quote.priority || 1,
                                  });
                                  setEditModalOpen(true);
                                }}
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
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete Quote Permanently" placement="top" arrow>
                              <IconButton
                                className="action-button"
                                size="small"
                                onClick={() => openDeleteDialog(quote)}
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
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )))}
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

        {/* Add Quote Modal */}
        <Dialog
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            borderBottom: '2px solid #e5e7eb',
            pb: 3,
            pt: 3,
            fontSize: '1.25rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            minHeight: '70px',
          }}>
            <FormatQuote sx={{ fontSize: '28px', color: 'white' }} />
            Add New Quote
          </DialogTitle>
          <DialogContent sx={{ 
            mt: 2,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            p: 4,
          }}>
            <Box component="form" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* Quote Basic Information */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#1565c0',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <FormatQuote sx={{ color: '#1565c0', fontSize: 24 }} />
                    Quote Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      label="Quote Text"
                      multiline
                      rows={4}
                      value={formData.text}
                      onChange={(e) => setFormData({...formData, text: e.target.value})}
                      placeholder="Enter the Tamil quote about Lord Murugan..."
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                            <FormatQuote color="action" />
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
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Author"
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                        placeholder="Enter author name..."
                        required
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
                        label="Source"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        placeholder="Enter source (optional)..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Category color="action" />
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
                  </Box>
                </Box>

                {/* Category and Settings */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#2e7d32',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Category sx={{ color: '#2e7d32', fontSize: 24 }} />
                    Category & Settings
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        label="Category"
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        }}
                      >
                        <MenuItem value="devotional">Devotional</MenuItem>
                        <MenuItem value="spiritual">Spiritual</MenuItem>
                        <MenuItem value="wisdom">Wisdom</MenuItem>
                        <MenuItem value="motivational">Motivational</MenuItem>
                        <MenuItem value="inspirational">Inspirational</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        label="Language"
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        }}
                      >
                        <MenuItem value="tamil">Tamil</MenuItem>
                        <MenuItem value="english">English</MenuItem>
                        <MenuItem value="hindi">Hindi</MenuItem>
                        <MenuItem value="sanskrit">Sanskrit</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                        label="Priority"
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        }}
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <MenuItem key={num} value={num}>
                            Priority {num} {num <= 3 ? '(High)' : num <= 6 ? '(Medium)' : '(Low)'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Tags Input */}
                  <TextField
                    fullWidth
                    label="Tags"
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                    })}
                    placeholder="Enter tags separated by commas (e.g., murugan, lord murugan, tamil god)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Category color="action" />
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

                {/* Status and Features */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#7b1fa2',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Star sx={{ color: '#7b1fa2', fontSize: 24 }} />
                    Status & Features
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: 3,
                    p: 3,
                    backgroundColor: '#f8fafc',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#22c55e',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#22c55e',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={600}>Active</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Quote is visible to users
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#f59e0b',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#f59e0b',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={600}>Featured</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Highlight this quote
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Box>

              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => setAddModalOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={handleAddQuote} 
              variant="contained" 
              startIcon={<Add />}
              disabled={!formData.text || !formData.author}
            >
              Add Quote
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Quote Modal */}
        <Dialog
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingQuote(null);
          }}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            borderBottom: '2px solid #e5e7eb',
            pb: 3,
            pt: 3,
            fontSize: '1.25rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            minHeight: '70px',
          }}>
            <Edit sx={{ fontSize: '28px', color: 'white' }} />
            Edit Quote
          </DialogTitle>
          <DialogContent sx={{ 
            mt: 2,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            p: 4,
          }}>
            <Box component="form" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* Quote Basic Information */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#1565c0',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <FormatQuote sx={{ color: '#1565c0', fontSize: 24 }} />
                    Quote Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      label="Quote Text"
                      multiline
                      rows={4}
                      value={formData.text}
                      onChange={(e) => setFormData({...formData, text: e.target.value})}
                      placeholder="Enter the Tamil quote about Lord Murugan..."
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                            <FormatQuote color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Author"
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                        placeholder="Enter author name..."
                        required
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
                              borderColor: '#3b82f6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#3b82f6',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Source"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        placeholder="Enter source (optional)..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Category color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white',
                            '&:hover fieldset': {
                              borderColor: '#3b82f6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#3b82f6',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Category and Settings */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#2e7d32',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Category sx={{ color: '#2e7d32', fontSize: 24 }} />
                    Category & Settings
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        label="Category"
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                          },
                        }}
                      >
                        <MenuItem value="devotional">Devotional</MenuItem>
                        <MenuItem value="spiritual">Spiritual</MenuItem>
                        <MenuItem value="wisdom">Wisdom</MenuItem>
                        <MenuItem value="motivational">Motivational</MenuItem>
                        <MenuItem value="inspirational">Inspirational</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        label="Language"
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                          },
                        }}
                      >
                        <MenuItem value="tamil">Tamil</MenuItem>
                        <MenuItem value="english">English</MenuItem>
                        <MenuItem value="hindi">Hindi</MenuItem>
                        <MenuItem value="sanskrit">Sanskrit</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                        label="Priority"
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                          },
                        }}
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <MenuItem key={num} value={num}>
                            Priority {num} {num <= 3 ? '(High)' : num <= 6 ? '(Medium)' : '(Low)'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Tags Input */}
                  <TextField
                    fullWidth
                    label="Tags"
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                    })}
                    placeholder="Enter tags separated by commas (e.g., murugan, lord murugan, tamil god)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Category color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3b82f6',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Status and Features */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#7b1fa2',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Star sx={{ color: '#7b1fa2', fontSize: 24 }} />
                    Status & Features
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: 3,
                    p: 3,
                    backgroundColor: '#f8fafc',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#22c55e',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#22c55e',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={600}>Active</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Quote is visible to users
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#f59e0b',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#f59e0b',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={600}>Featured</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Highlight this quote
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Box>

              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => {
              setEditModalOpen(false);
              setEditingQuote(null);
            }} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={handleEditQuote} 
              variant="contained" 
              startIcon={<Edit />}
              disabled={!formData.text || !formData.author}
            >
              Update Quote
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Quote Modal */}
        <Dialog
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingQuote(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            borderBottom: '2px solid #e5e7eb',
            pb: 3,
            pt: 3,
            fontSize: '1.25rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            minHeight: '70px',
          }}>
            <Visibility sx={{ fontSize: '28px', color: 'white' }} />
            Quote Details
          </DialogTitle>
          <DialogContent sx={{ 
            mt: 2,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            p: 4,
          }}>
            {viewingQuote && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* Quote Text Section */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#1565c0',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <FormatQuote sx={{ color: '#1565c0', fontSize: 24 }} />
                    Quote Text
                  </Typography>
                  
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #3b82f6'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                      color: '#374151',
                      mb: 2,
                    }}>
                      "{viewingQuote.text}"
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600,
                      color: '#1f2937',
                      textAlign: 'right'
                    }}>
                      - {viewingQuote.author}
                    </Typography>
                  </Box>
                </Box>

                {/* Details Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  
                  {/* Basic Info */}
                  <Card sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Basic Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Category:</Typography>
                        <Chip
                          label={viewingQuote.category}
                          size="small"
                          sx={{
                            bgcolor: getCategoryColor(viewingQuote.category),
                            color: 'white',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            mt: 0.5,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Language:</Typography>
                        <Chip
                          label={viewingQuote.language}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getLanguageColor(viewingQuote.language),
                            color: getLanguageColor(viewingQuote.language),
                            textTransform: 'capitalize',
                            mt: 0.5,
                            fontWeight: '600',
                          }}
                        />
                      </Box>
                      {viewingQuote.source && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Source:</Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>{viewingQuote.source}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>

                  {/* Status & Stats */}
                  <Card sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Status & Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={viewingQuote.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={viewingQuote.isActive ? 'success' : 'default'}
                          icon={viewingQuote.isActive ? <CheckCircle sx={{ fontSize: '16px !important' }} /> : <Cancel sx={{ fontSize: '16px !important' }} />}
                        />
                        {viewingQuote.isFeatured && (
                          <Chip
                            label="Featured"
                            size="small"
                            sx={{ bgcolor: '#f59e0b', color: 'white' }}
                            icon={<Star sx={{ fontSize: '16px !important', color: 'white !important' }} />}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                          <Typography variant="h6" color="#374151">{viewingQuote.viewCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Views</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3f2', borderRadius: 1 }}>
                          <Typography variant="h6" color="#374151">{viewingQuote.likeCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Likes</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                          <Typography variant="h6" color="#374151">{viewingQuote.shareCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Shares</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Box>

                {/* Tags */}
                {viewingQuote.tags && viewingQuote.tags.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {viewingQuote.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#d1d5db',
                            color: '#6b7280',
                            '&:hover': { borderColor: '#9ca3af' }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Dates */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Created At:</Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {new Date(viewingQuote.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Priority:</Typography>
                    <Box sx={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: viewingQuote.priority > 5 ? '#ef4444' : viewingQuote.priority > 2 ? '#f59e0b' : '#6b7280',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      mt: 0.5,
                    }}>
                      {viewingQuote.priority}
                    </Box>
                  </Box>
                </Box>

              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => {
              setViewModalOpen(false);
              setViewingQuote(null);
            }} color="secondary">
              Close
            </Button>
            <Button 
              onClick={() => {
                if (viewingQuote) {
                  setViewModalOpen(false);
                  setEditingQuote(viewingQuote);
                  setFormData({
                    text: viewingQuote.text,
                    author: viewingQuote.author,
                    category: viewingQuote.category,
                    language: viewingQuote.language,
                    tags: viewingQuote.tags || ['murugan', 'lord murugan', 'tamil god'],
                    source: viewingQuote.source || '',
                    isActive: viewingQuote.isActive,
                    isFeatured: viewingQuote.isFeatured,
                    priority: viewingQuote.priority || 1,
                  });
                  setEditModalOpen(true);
                  setViewingQuote(null);
                }
              }}
              variant="contained" 
              startIcon={<Edit />}
            >
              Edit Quote
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={cancelDeleteQuote}
          maxWidth="sm"
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
              Delete Quote
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this quote?
            </Typography>
            
         
           
          </DialogContent>
          
          <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteQuote}
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
              onClick={() => confirmDeleteQuote(false)}
              variant="outlined"
              color="warning"
              size="medium"
              disabled={deleteLoading}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 120
              }}
            >
              {deleteLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress 
                    size={16} 
                    sx={{ color: 'warning.main' }} 
                  />
                  <Typography sx={{ fontSize: '0.875rem' }}>
                    Deleting...
                  </Typography>
                </Box>
              ) : (
                'Soft Delete'
              )}
            </Button>
            
            <Button 
              onClick={() => confirmDeleteQuote(true)}
              variant="contained"
              color="error"
              size="medium"
              disabled={deleteLoading}
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 140
              }}
            >
              {deleteLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress 
                    size={16} 
                    sx={{ color: 'white' }} 
                  />
                  <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                    Deleting...
                  </Typography>
                </Box>
              ) : (
                'Permanent Delete'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}