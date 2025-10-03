'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardMedia,
  CardContent,
  Box,
  IconButton,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Photo,
  Collections,
  TrendingUp,
  AccessTime,
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';
interface GalleryImage {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
}

interface GalleryResponse {
  success: boolean;
  data: GalleryImage[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalImages: number;
  };
}

interface GalleryStats {
  total: number;
  recentUploads: number;
  thisMonth: number;
  categories: number;
}

function GalleryContent() {
  // State for images
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [alert, setAlert] = useState<{ show: boolean; message: string; severity: 'success' | 'error' }>({
    show: false,
    message: '',
    severity: 'success'
  });
  
  // State for statistics
  const [stats, setStats] = useState<GalleryStats>({
    total: 0,
    recentUploads: 0,
    thisMonth: 0,
    categories: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

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
    fetchImages();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 8000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      const response = await fetch('/api/gallery');
      const data: GalleryResponse = await response.json();

      if (data.success) {
        setImages(data.data);

        // Calculate statistics
        const allImages = data.data;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const recentUploads = allImages.filter(img => 
          new Date(img.createdAt) >= thirtyDaysAgo
        ).length;
        
        const thisMonthUploads = allImages.filter(img => 
          new Date(img.createdAt) >= startOfMonth
        ).length;
        
        // Count unique categories (if category field exists)
        const categories = new Set(allImages.map(img => img.category || 'General')).size;

        setStats({
          total: allImages.length,
          recentUploads,
          thisMonth: thisMonthUploads,
          categories
        });
      } else {
        throw new Error('Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showAlert('Failed to fetch images', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || (!formData.file && !editingImage)) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      if (formData.file) {
        submitFormData.append('file', formData.file);
      }

      const url = editingImage ? `/api/gallery/${editingImage._id}` : '/api/gallery';
      const method = editingImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitFormData,
      });

      const data = await response.json();

      if (data.success) {
        showAlert(data.message || 'Operation successful', 'success');
        setOpenDialog(false);
        resetForm();
        fetchImages();
      } else {
        throw new Error(data.error || 'Operation failed');
      }
    } catch (error: any) {
      console.error('Error:', error);
      showAlert(error.message || 'Operation failed', 'error');
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description,
      file: null
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    setImageToDelete(id);
    setDeleteDialog(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      const response = await fetch(`/api/gallery/${imageToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showAlert('Image deleted successfully', 'success');
        fetchImages();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      showAlert(error.message || 'Delete failed', 'error');
    } finally {
      setDeleteDialog(false);
      setImageToDelete(null);
    }
  };

  const cancelDeleteImage = () => {
    setDeleteDialog(false);
    setImageToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file: null
    });
    setEditingImage(null);
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
              speed={1.5}
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
            Loading Gallery...
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
            title="Total Images"
            value={stats.total}
            icon={<Photo sx={{ fontSize: 30 }} />}
            color="#667eea"
            loading={statsLoading}
          />
          <StatCard
            title="Recent Uploads"
            value={stats.recentUploads}
            icon={<TrendingUp sx={{ fontSize: 30 }} />}
            color="#764ba2"
            loading={statsLoading}
          />
          <StatCard
            title="This Month"
            value={stats.thisMonth}
            icon={<AccessTime sx={{ fontSize: 30 }} />}
            color="#8B5CF6"
            loading={statsLoading}
          />
          <StatCard
            title="Categories"
            value={stats.categories}
            icon={<Collections sx={{ fontSize: 30 }} />}
            color="#667eea"
            loading={statsLoading}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: 'text.primary' }}>
          Gallery Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ 
            borderRadius: '25px',
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #68306d 100%)',
            }
          }}
        >
          Add Image
        </Button>
      </Box>

      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

     

      {/* Images Grid - Food Menu Style */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
          {Array.from(new Array(8)).map((_, index) => (
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }} key={index}>
              <Skeleton variant="rectangular" height={200} />
              <CardContent>
                <Skeleton variant="text" sx={{ fontSize: '1.2rem' }} />
                <Skeleton variant="text" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
          {images.map((image) => (
              <Card key={image._id} 
                sx={{ 
                  borderRadius: 3, 
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}
              >
                {/* Image */}
                <CardMedia
                  component="img"
                  height="200"
                  image={image.imageUrl}
                  alt={image.title}
                  sx={{ objectFit: 'cover' }}
                />
                
                {/* Action Buttons Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '.MuiCard-root:hover &': {
                      opacity: 1
                    }
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.9)',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'white' }
                    }}
                    onClick={() => handleEdit(image)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.9)',
                      color: 'error.main',
                      '&:hover': { bgcolor: 'white' }
                    }}
                    onClick={() => handleDelete(image._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 2 }}>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {image.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                      minHeight: '2.8em'
                    }}
                  >
                    {image.description}
                  </Typography>
                </CardContent>
              </Card>
          ))}
        </Box>
      )}

      {images.length === 0 && !loading && (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No images found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first gallery image
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              borderRadius: '25px',
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Add First Image
          </Button>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 'bold', fontSize: '1.5rem' }}>
          {editingImage ? 'Edit Image' : 'Add New Image'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 3 }}
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              required
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                borderStyle: 'dashed',
                borderWidth: 2
              }}
            >
              {formData.file ? formData.file.name : 'Choose Image File'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>

            {!editingImage && !formData.file && (
              <Typography variant="caption" color="error">
                Image file is required
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {editingImage ? 'Update' : 'Add'} Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={cancelDeleteImage}
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
            Delete Image
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body1">
            Are you sure you want to delete this image?
          </Typography>

        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={cancelDeleteImage}
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
            onClick={confirmDeleteImage}
            variant="contained"
            color="error"
            size="medium"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100
              }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function GalleryPage() {
  return (
    <AdminLayout>
      <GalleryContent />
    </AdminLayout>
  );
}


