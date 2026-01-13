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
  Skeleton,
  CircularProgress,
  Pagination,
    PaginationItem,
} from '@mui/material';
import { notifications } from '@mantine/notifications';
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
  // Notification Helper Function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const config = {
      title: type === 'success' ? 'Success' : 
             type === 'error' ? 'Error' : 
             type === 'warning' ? ' Warning' : 'Info',
      message,
      color: type === 'success' ? 'green' : 
             type === 'error' ? 'red' : 
             type === 'warning' ? 'yellow' : 'blue',
      autoClose: 5000,
      position: 'top-right' as const,
      styles: {
        root: {
          backgroundColor: '#ffffff',
          border: `2px solid ${type === 'success' ? '#10b981' : 
                                type === 'error' ? '#ef4444' : 
                                type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
          '&::before': { backgroundColor: 'transparent' },
        },
        title: { 
          color: type === 'success' ? '#059669' : 
                 type === 'error' ? '#dc2626' : 
                 type === 'warning' ? '#d97706' : '#2563eb',
          fontWeight: 600 
        },
        description: { 
          color: type === 'success' ? '#047857' : 
                 type === 'error' ? '#b91c1c' : 
                 type === 'warning' ? '#b45309' : '#1d4ed8' 
        },
        closeButton: {
          color: type === 'success' ? '#059669' : 
                 type === 'error' ? '#dc2626' : 
                 type === 'warning' ? '#d97706' : '#2563eb',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
        },
      }
    };
    notifications.show(config);
  };

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
  const [deleting, setDeleting] = useState(false);

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
    }, 4000); // 3 seconds

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
      showNotification('Failed to fetch images', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      showNotification('Please fill in title and description', 'error');
      return;
    }

    if (!editingImage && !formData.file) {
      showNotification('Please select an image file', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication required. Please login again.', 'error');
        return;
      }

      if (editingImage) {
        // For updating existing image (only title and description)
        const response = await fetch(`/api/gallery/${editingImage._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
          }),
        });

        const data = await response.json();

        if (data.success) {
          showNotification(data.message || 'Image updated successfully', 'success');
          setOpenDialog(false);
          resetForm();
          fetchImages();
        } else {
          throw new Error(data.error || 'Update failed');
        }
      } else {
        // For creating new image (with file upload)
        const submitFormData = new FormData();
        submitFormData.append('title', formData.title);
        submitFormData.append('description', formData.description);
        submitFormData.append('file', formData.file!);

        const response = await fetch('/api/gallery', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: submitFormData,
        });

        const data = await response.json();

        if (data.success) {
          showNotification(data.message || 'Image uploaded successfully', 'success');
          setOpenDialog(false);
          resetForm();
          fetchImages();
        } else {
          console.error('Upload failed:', data);
          throw new Error(data.error || 'Upload failed');
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      showNotification(error.message || 'Operation failed', 'error');
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

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication required. Please login again.', 'error');
        return;
      }

      const response = await fetch(`/api/gallery/${imageToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Image deleted successfully', 'success');
        fetchImages();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      showNotification(error.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
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



  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const [viewImage, setViewImage] = useState<GalleryImage | null>(null);


  const [page, setPage] = useState(1);
const rowsPerPage = 8; // grid-ku nallaa irukkum

const totalPages = Math.ceil(images.length / rowsPerPage);

const paginatedImages = images.slice(
  (page - 1) * rowsPerPage,
  page * rowsPerPage
);

   const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  return (
    <Box >
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
    
     
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
          gap: 2,
          mb: 3 
        }}>
          <StatCard
            title="Total Images"
            value={stats.total}
            icon={<Photo sx={{ fontSize: 38 }} />}
            color="#667eea"
            loading={statsLoading}
          />
          <StatCard
            title="Recent Uploads"
            value={stats.recentUploads}
            icon={<TrendingUp sx={{ fontSize: 38 }} />}
            color="#764ba2"
            loading={statsLoading}
          />
          <StatCard
            title="This Month"
            value={stats.thisMonth}
            icon={<AccessTime sx={{ fontSize: 38 }} />}
            color="#8B5CF6"
            loading={statsLoading}
          />
          <StatCard
            title="Categories"
            value={stats.categories}
            icon={<Collections sx={{ fontSize: 38 }} />}
            color="#667eea"
            loading={statsLoading}
          />
        </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#7353ae' }}>
          Gallery
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
        >
          Add Image
        </Button>
      </Box>



     

      {/* Images Grid - Food Menu Style */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3,alignItems: 'stretch' }}>
          {Array.from(new Array(8)).map((_, index) => (
            <Card
  sx={{
    height: '100%',          // 🔥 full height
    display: 'flex',
    flexDirection: 'column', // 🔥 image top, content bottom
    borderRadius: 3,
    overflow: 'hidden',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    },
  }} key={index}>
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
       {paginatedImages.map((image) => (

            <Card
  key={image._id}
  sx={{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    },
  }}
>

                {/* Image */}
               <CardMedia
  component="img"
  image={image.imageUrl}
    onClick={() => setViewImage(image)}
  alt={image.title}
  sx={{
    height: 200,       
    width: '100%',      
    objectFit: 'cover', 
    flexShrink: 0,
        cursor: 'pointer',                 
  }}
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
               <CardContent
  sx={{
    p: 2,
    flexGrow: 1,                 // 🔥 equal content height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }}
>

                 <Typography
  variant="h6"
  sx={{
    fontWeight: 600,
    mb: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    minHeight: '2.8em', 
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
            
            {editingImage && (
              <Typography variant="caption" color="text.secondary">
                Leave empty to keep current image
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
            onClick={confirmDeleteImage}
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
      <Dialog
  open={Boolean(viewImage)}
  onClose={() => setViewImage(null)}
  maxWidth="md"
  fullWidth
>
  {viewImage && (
    <>
      {/* Image Section */}
      <Box
        sx={{
          width: '100%',
          height: 400,
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={viewImage.imageUrl}
          alt={viewImage.title}
          sx={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain', // 🔥 full image, no crop
          }}
        />
      </Box>

      {/* Content Section */}
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          {viewImage.title}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {viewImage.description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setViewImage(null)} variant="contained">
          Close
        </Button>
      </DialogActions>
    </>
  )}
</Dialog>
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
    </Box>
    
  );
}

export default function GalleryPage() {
  return (
    <AdminLayout>
      <GalleryContent />
    </AdminLayout>
  );
}


