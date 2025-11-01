'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Skeleton,
  Collapse,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  Pause,
  Delete,
  LibraryMusic,
   Delete as DeleteIcon,
  MusicNote,
  Person,
  TrendingUp,
  AccessTime,
  Refresh,
  Add,
  Filter,
  FilterAlt,
  FilterList,
  Search,
  Clear,
  RestartAlt,
  Image,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import AudioPlayer from '@/components/AudioPlayer';
import { notifications } from '@mantine/notifications';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface Song {
  _id: string;
  title: string;
  artist: string;
  audioUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

interface SongStats {
  total: number;
  totalArtists: number;
  totalDuration: number;
  recentUploads: number;
}

interface FormData {
  title: string;
  artist: string;
  file: FileList;
  thumbnail: FileList;
}

// Skeleton loader component for table rows
const TableRowSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton variant="text" width="30px" /></TableCell>
    <TableCell><Skeleton variant="rectangular" width={50} height={50} /></TableCell>
    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
    <TableCell align="center">
      <Skeleton variant="circular" width={40} height={40} />
    </TableCell>
  </TableRow>
);

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
          {loading ? <Skeleton variant="circular" width={40} height={40} /> : icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArtist, setFilterArtist] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Statistics state
  const [stats, setStats] = useState<SongStats>({
    total: 0,
    totalArtists: 0,
    totalDuration: 0,
    recentUploads: 0
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

  const {
    audioRef,
    currentPlaying,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    playSong,
    stopSong,
    seekTo,
    formatTime,
  } = useAudioPlayer();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      artist: '',
      file: undefined,
      thumbnail: undefined
    }
  });
  
  const watchedFile = watch('file');
  const watchedThumbnail = watch('thumbnail');

  // Filter songs based on multiple criteria
  const filteredSongs = songs.filter(song => {
    const matchesSearch = searchTerm === '' || 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArtist = filterArtist === '' || song.artist === filterArtist;
    
    const matchesDuration = filterDuration === '' || (() => {
      const duration = song.duration || 0;
      const minutes = Math.floor(duration / 60);
      switch (filterDuration) {
        case 'short': return minutes < 3;
        case 'medium': return minutes >= 3 && minutes <= 5;
        case 'long': return minutes > 5;
        default: return true;
      }
    })();
    
    const matchesDateRange = filterDateRange === '' || (() => {
      const songDate = new Date(song.createdAt);
      const now = new Date();
      switch (filterDateRange) {
        case 'today':
          return songDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return songDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return songDate >= monthAgo;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesArtist && matchesDuration && matchesDateRange;
  });

  // Sort filtered songs
  const sortedAndFilteredSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'duration':
        return (b.duration || 0) - (a.duration || 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Get unique artists for filter dropdown
  const uniqueArtists = [...new Set(songs.map(song => song.artist))].sort();

  // Fetch songs
  const fetchSongs = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      
      if (data.success) {
        const songsData = data.data;
        setSongs(songsData);
        
        // Calculate accurate stats
        const total = songsData.length;
        const uniqueArtists = [...new Set(songsData.map((song: Song) => song.artist))];
        const totalArtists = uniqueArtists.length;
        const totalDuration = songsData.reduce((sum: number, song: Song) => {
          return sum + (song.duration || 0);
        }, 0);
        
        // Calculate recent uploads (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUploads = songsData.filter((song: Song) => 
          new Date(song.createdAt) >= sevenDaysAgo
        ).length;
        
        
        setStats({ 
          total, 
          totalArtists, 
          totalDuration: Math.round(totalDuration / 60), // Store in minutes
          recentUploads 
        });
      } else {
        showNotification('Failed to fetch songs', 'error');
      }
    } catch (error) {
      showNotification('Error fetching songs', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // Upload song
  const onSubmit = async (data: FormData) => {
    if (!data.file || data.file.length === 0) {
      showNotification('Please select an audio file', 'error');
      return;
    }

    const file = data.file[0];
    if (!file.type.startsWith('audio/')) {
      showNotification('Please select a valid audio file', 'error');
      return;
    }

    // Validate thumbnail if provided
    if (data.thumbnail && data.thumbnail.length > 0 && data.thumbnail[0].size > 0) {
      const thumbnail = data.thumbnail[0];
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validImageTypes.includes(thumbnail.type)) {
        showNotification('Thumbnail must be in JPG, JPEG, or PNG format', 'error');
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('artist', data.artist);
    formData.append('file', file);
    
    // Add thumbnail if provided
    if (data.thumbnail && data.thumbnail.length > 0 && data.thumbnail[0].size > 0) {
      formData.append('thumbnail', data.thumbnail[0]);
    }

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Song uploaded successfully!', 'success');
        reset();
        setAddSongDialogOpen(false);
        fetchSongs();
      } else {
        showNotification(result.error || 'Failed to upload song', 'error');
      }
    } catch (error) {
      showNotification('Error uploading song', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete song
  const deleteSong = async (song: Song) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/songs?id=${song._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Song deleted successfully!', 'success');
        if (currentPlaying === song._id) {
          stopSong();
        }
        fetchSongs();
      } else {
        showNotification(result.error || 'Failed to delete song', 'error');
      }
    } catch (error) {
      showNotification('Error deleting song', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSongToDelete(null);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

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
              Loading Songs..
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
        <Box sx={{ mb: 4 }}>
        
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
            gap: 2,
            mb: 3 
          }}>
            <StatCard
              title="Total Songs"
              value={stats.total}
              icon={<MusicNote sx={{ fontSize: 30 }} />}
              color="#667eea"
              loading={statsLoading}
            />
            <StatCard
              title="Total Artists"
              value={stats.totalArtists}
              icon={<Person sx={{ fontSize: 30 }} />}
              color="#764ba2"
              loading={statsLoading}
            />
            <StatCard
              title="Total Duration"
              value={`${stats.totalDuration}m`}
              icon={<AccessTime sx={{ fontSize: 30 }} />}
              color="#8B5CF6"
              loading={statsLoading}
            />
            <StatCard
              title="Recent Uploads"
              value={stats.recentUploads}
              icon={<TrendingUp sx={{ fontSize: 30 }} />}
              color="#667eea"
              loading={statsLoading}
            />
          </Box>
        </Box>

        {/* Songs Table - Full Width */}
        <Card>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box display="flex" alignItems="center" gap={2}>
                              <IconButton
onClick={() => setShowSearchFilter(!showSearchFilter)}                                sx={{
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
                                <FilterAlt width={20} height={20} />
                              </IconButton>
                              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#374151' }}>
                                Songs Management
                              </Typography>
                            </Box>
                
                 <Box display="flex" alignItems="center" gap={2}>
                                <Tooltip title="Refresh Songs List">
                                  <Button 
                                    variant="outlined" 
                                    onClick={fetchSongs}
                                    disabled={loading}
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
                                    startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
                                  >
                                    Refresh
                                  </Button>
                                </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setAddSongDialogOpen(true)}
                     sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minWidth: 150,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  >
                    Add New Song
                  </Button>
                </Box>
              </Box>
            }
          />
          
          {/* Search and Filter Section */}
          <Collapse in={showSearchFilter}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>
              
              {/* Search Field */}
              <TextField
                fullWidth
                label="Search songs or artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  mb: 2,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Filter Fields */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
                gap: 2,
                mb: 2 
              }}>
                               <FormControl fullWidth>
                  <InputLabel>Artist</InputLabel>
                  <Select
                    value={filterArtist}
                    label="Filter by Artist"
                    onChange={(e) => setFilterArtist(e.target.value)}
                    sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                      }}
                  >
                    <MenuItem value="">All Artists</MenuItem>
                    {uniqueArtists.map((artist) => (
                      <MenuItem key={artist} value={artist}>
                        {artist}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                                <FormControl fullWidth>
                  <InputLabel>Duration</InputLabel>
                  <Select
                    value={filterDuration}
                    label="Filter by Duration"
                    onChange={(e) => setFilterDuration(e.target.value)}
                    sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                      }}
                  >
                    <MenuItem value="">All Durations</MenuItem>
                    <MenuItem value="short">Short (&lt; 3min)</MenuItem>
                    <MenuItem value="medium">Medium (3-5min)</MenuItem>
                    <MenuItem value="long">Long (&gt; 5min)</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel> Date</InputLabel>
                  <Select
                    value={filterDateRange}
                    label="Filter by Date"
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                      }}
                  >
                    <MenuItem value="">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                      }}
                  >
                    <MenuItem value="recent">Most Recent</MenuItem>
                    <MenuItem value="title">Song Title</MenuItem>
                    <MenuItem value="artist">Artist Name</MenuItem>
                    <MenuItem value="duration">Duration</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Clear Filters Button */}
                <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
              <Button
                                variant="contained"
                                size="small"
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
                    onClick={() => {
                      setSearchTerm('');
                      setFilterArtist('');
                      setFilterDuration('');
                      setFilterDateRange('');
                      setSortBy('recent');
                    }}
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
          </Collapse>
          
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: "500px", overflow: 'hidden' }}>
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
                    <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold', width: '60px' }}>S.No</TableCell>
                    <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold', width: '80px' }}>Thumbnail</TableCell>
                    <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Artist</TableCell>
                    <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Uploaded</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Show skeleton loaders while loading
                    Array.from({ length: 8 }).map((_, index) => (
                      <TableRowSkeleton key={index} />
                    ))
                  ) : songs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Alert severity="info" sx={{ border: 'none', backgroundColor: 'transparent' }}>
                          No songs uploaded yet. Upload your first song!
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : sortedAndFilteredSongs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Alert severity="warning" sx={{ border: 'none', backgroundColor: 'transparent' }}>
                          No songs match your search criteria. Try adjusting your filters.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredSongs.map((song, index) => (
                      <TableRow 
                        key={song._id}
                        sx={{ 
                          backgroundColor: currentPlaying === song._id ? 'action.selected' : 'inherit' 
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="text.secondary">
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {song.thumbnailUrl ? (
                            <Box
                              component="img"
                              src={song.thumbnailUrl}
                              alt={`${song.title} thumbnail`}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 1,
                                objectFit: 'cover',
                                border: '2px solid #e0e0e0',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s ease'
                                }
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 1,
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #e0e0e0'
                              }}
                            >
                              <MusicNote sx={{ color: '#ccc', fontSize: 24 }} />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {song.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{song.artist}</TableCell>
                        <TableCell>
                          {song.duration ? formatTime(song.duration) : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {new Date(song.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={currentPlaying === song._id && isPlaying ? "Pause" : "Play"}>
                            <IconButton
                              color="primary"
                              onClick={() => {
                                try {
                                  playSong(song);
                                } catch (error) {
                                  console.error('Error playing song:', error);
                                  showNotification('Error playing song', 'error');
                                }
                              }}
                            >
                              {currentPlaying === song._id && isPlaying ? <Pause /> : <PlayArrow />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => {
                                setSongToDelete(song);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Audio Player Controls */}
        {currentPlaying && (
          <Box sx={{ mt: 3 }}>
            <AudioPlayer
              currentSong={songs.find(s => s._id === currentPlaying)}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onPlayPause={() => {
                const song = songs.find(s => s._id === currentPlaying);
                if (song) playSong(song);
              }}
              onStop={stopSong}
              onVolumeChange={setVolume}
              onSeek={seekTo}
              playlist={songs}
              formatTime={formatTime}
            />
          </Box>
        )}

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          preload="metadata"
          crossOrigin="anonymous"
          style={{ display: 'none' }} 
        />

        {/* Add Song Dialog */}
        <Dialog
          open={addSongDialogOpen}
          onClose={() => setAddSongDialogOpen(false)}
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
              <CloudUpload sx={{ color: 'primary.main' }} />
              Add New Song
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Song Title"
                margin="normal"
                {...register('title', { 
                  required: 'Title is required',
                  maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
              
              <TextField
                fullWidth
                label="Artist Name"
                margin="normal"
                {...register('artist', { 
                  required: 'Artist is required',
                  maxLength: { value: 100, message: 'Artist name must be less than 100 characters' }
                })}
                error={!!errors.artist}
                helperText={errors.artist?.message}
              />
              
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2, mb: 2, py: 2 }}
                startIcon={<CloudUpload />}
              >
                Choose Audio File
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  {...register('file', { required: 'Audio file is required' })}
                />
              </Button>
              
              {watchedFile && watchedFile.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selected: {watchedFile[0].name}
                </Alert>
              )}
              
              {errors.file && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.file.message}
                </Alert>
              )}

              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 1, mb: 2, py: 2, borderStyle: 'dashed' }}
                startIcon={<Image />}
              >
                Choose Thumbnail (Optional)
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png"
                  {...register('thumbnail')}
                />
              </Button>
              
              {watchedThumbnail && watchedThumbnail.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Thumbnail: {watchedThumbnail[0].name}
                </Alert>
              )}
              
              {errors.thumbnail && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.thumbnail.message}
                </Alert>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setAddSongDialogOpen(false)}
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
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              size="medium"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
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
              {uploading ? 'Uploading...' : 'Upload Song'}
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
                 <DeleteIcon sx={{ color: '#ef4444' }} />
                 Delete Song
               </Box>
             </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              Are you sure you want to delete this song?
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
              onClick={() => songToDelete && deleteSong(songToDelete)}
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

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          style={{ display: 'none' }}
          preload="metadata"
          crossOrigin="anonymous"
        />

      </Box>
    </AdminLayout>
  );
}
