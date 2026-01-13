'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { notifications } from '@mantine/notifications';

// Notification helper function
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
      notifications.show({
        ...config,
        color: 'green',
      });
      break;
    case 'error':
      notifications.show({
        ...config,
        color: 'red',
      });
      break;
    case 'warning':
      notifications.show({
        ...config,
        color: 'yellow',
      });
      break;
    case 'info':
      notifications.show({
        ...config,
        color: 'blue',
      });
      break;
  }
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

const AdminProfile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    address: '',
    city: '',
    state: '',
    country: '',
    bio: '',
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const localUserData = localStorage.getItem('user');
      
      // First try to load from localStorage as fallback
      if (localUserData) {
        const userData = JSON.parse(localUserData);
        setProfile(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          department: userData.department || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          country: userData.country || '',
          bio: userData.bio || '',
        });
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile API error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to load profile');
      }

      const data = await response.json();
      const userData = data.user || data;
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        department: userData.department || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        country: userData.country || '',
        bio: userData.bio || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('error', '❌ Error', error instanceof Error ? error.message : 'Failed to load profile');
      
      // Show mock data for testing if API fails and no localStorage
      if (!localStorage.getItem('user')) {
        const mockProfile = {
          id: 'mock-id',
          name: 'Admin User',
          email: 'admin@palani.com',
          avatar: '',
          role: 'Administrator',
          department: 'IT',
          phone: '+91 9876543210',
          address: '123 Admin Street',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          bio: 'System Administrator',
          status: 'active' as 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setProfile(mockProfile);
        setFormData({
          name: mockProfile.name,
          email: mockProfile.email,
          phone: mockProfile.phone,
          department: mockProfile.department,
          address: mockProfile.address,
          city: mockProfile.city,
          state: mockProfile.state,
          country: mockProfile.country,
          bio: mockProfile.bio,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditToggle = () => {
    if (isEditing && profile) {
      // Reset form data if cancelling
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        bio: profile.bio || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const responseData = await response.json();
      const updatedProfile = responseData.user || responseData;
      setProfile(updatedProfile);
      
      // Update localStorage with new profile data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...updatedProfile };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Trigger a storage event to notify AdminLayout of the change
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(updatedUser),
        oldValue: JSON.stringify(currentUser)
      }));
      
      // Update form data to reflect saved changes
      setFormData({
        name: updatedProfile.name || '',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || '',
        department: updatedProfile.department || '',
        address: updatedProfile.address || '',
        city: updatedProfile.city || '',
        state: updatedProfile.state || '',
        country: updatedProfile.country || '',
        bio: updatedProfile.bio || '',
      });
      
      setIsEditing(false);
      showNotification('success', 'Profile Updated', 'Your profile has been successfully updated');
      
      // Reload profile data to ensure consistency
      await loadProfile();
      
      // Show countdown notification and start redirect process
      setRedirecting(true);
      showNotification('info', ' Redirecting...', 'Taking you back to dashboard in 2 seconds');
      
      // Auto redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Profile update error:', error);
      showNotification('error', '❌ Update Failed', error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
      setRedirecting(false); // Stop redirect on error
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('error', '❌ Invalid File', 'Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', '❌ File Too Large', 'Please select an image smaller than 5MB');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setImageDialogOpen(true);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch('/api/admin/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      const updatedProfile = profile ? { ...profile, avatar: data.avatarUrl } : null;
      setProfile(updatedProfile);
      
      // Update localStorage with new avatar
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, avatar: data.avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Trigger a storage event to notify AdminLayout of the change
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(updatedUser),
        oldValue: JSON.stringify(currentUser)
      }));
      
      setImageDialogOpen(false);
      setSelectedFile(null);
      setTempImageUrl('');
      showNotification('success', '📷 Image Updated', 'Profile image has been successfully updated');
      
      // Don't redirect automatically after image upload - let user continue editing
      
    } catch (error) {
      console.error('Image upload error:', error);
      showNotification('error', '❌ Upload Failed', error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
      setRedirecting(false); // Stop redirect on error
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        <CircularProgress size={40} sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  if (!profile) {
    const localUserData = localStorage.getItem('user');
    if (localUserData) {
      setTimeout(() => loadProfile(), 100);
    }
    return (
      <Box p={3} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
        <Typography color="error">Loading profile data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      p: { xs: 2, md: 4 }
    }}>
      {/* Header Section */}
      <Box sx={{ 
        maxWidth: 1400, 
        mx: 'auto', 
        mb: 4,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        p: 4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              👤 Admin Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your profile information and settings
            </Typography>
          </Box>
          
          {/* Action Buttons */}
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant={isEditing ? "outlined" : "contained"}
              onClick={handleEditToggle}
              startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
              disabled={saving}
              sx={{
                borderRadius: '16px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                boxShadow: isEditing ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.3)',
                background: isEditing ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: isEditing ? '2px solid #667eea' : 'none',
                color: isEditing ? '#667eea' : 'white',
                '&:hover': {
                  background: isEditing ? 'rgba(102, 126, 234, 0.1)' : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: isEditing ? '0 4px 15px rgba(102, 126, 234, 0.2)' : '0 12px 35px rgba(102, 126, 234, 0.4)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {isEditing ? 'Cancel Changes' : 'Edit Profile'}
            </Button>
            
            {isEditing && (
              <Button
                variant="contained"
                color="success"
                onClick={handleSave}
                disabled={saving || redirecting}
                startIcon={
                  saving ? <CircularProgress size={18} color="inherit" /> : 
                  redirecting ? <CircularProgress size={18} color="inherit" /> : 
                  <SaveIcon />
                }
                sx={{
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(16, 185, 129, 0.4)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    color: 'white',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {saving ? 'Saving Changes...' : redirecting ? 'Redirecting...' : 'Save Changes'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
          
          {/* Left Side - Profile Image and Quick Info */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '0 0 380px' } }}>
            <Card sx={{ 
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'visible'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                
                {/* Profile Avatar Section */}
                <Box position="relative" display="inline-block" mb={3}>
                  <Avatar
                    src={profile?.avatar || undefined}
                    sx={{ 
                      width: 140, 
                      height: 140, 
                      mx: 'auto',
                      border: '6px solid',
                      borderColor: 'transparent',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                      fontSize: '3rem',
                      fontWeight: 700,
                      color: 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 25px 50px rgba(102, 126, 234, 0.4)',
                      }
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 70 }} />
                  </Avatar>
                  
                  {/* Camera Button */}
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      width: 48,
                      height: 48,
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                      border: '3px solid white',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        transform: 'scale(1.1)',
                        boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>

                {/* Profile Info */}
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1f2937',
                    mb: 1
                  }}
                >
                  {profile.name || 'Admin User'}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ mb: 3, fontSize: '0.95rem' }}
                >
                  {profile.email || 'admin@example.com'}
                </Typography>

                {/* Status Chips */}
                <Box display="flex" justifyContent="center" gap={1.5} mb={3} flexWrap="wrap">
                  <Chip 
                    label={profile.role || 'Administrator'} 
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      px: 1,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    }}
                  />
                  <Chip 
                    label={profile.status === 'active' ? 'Active' : 'Inactive'}
                    color={profile.status === 'active' ? 'success' : 'error'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      px: 1,
                      boxShadow: profile.status === 'active' 
                        ? '0 4px 15px rgba(16, 185, 129, 0.3)'
                        : '0 4px 15px rgba(239, 68, 68, 0.3)',
                    }}
                  />
                </Box>

                {/* Department Info */}
                {profile.department && (
                  <Box 
                    sx={{ 
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '16px',
                      p: 2,
                      mb: 3
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Department
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {profile.department}
                    </Typography>
                  </Box>
                )}

              </CardContent>
            </Card>
          </Box>

          {/* Right Side - Profile Details Form */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ 
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>

                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1f2937',
                    mb: 3,
                    fontSize: '1.25rem'
                  }}
                >
                  Profile Information
                </Typography>

                <Divider sx={{ mb: 4, borderColor: 'rgba(102, 126, 234, 0.2)' }} />

                {/* Form Sections */}
                <Box display="flex" flexDirection="column" gap={4}>
                  
                  {/* Personal Information Section */}
                  <Box>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={1} 
                      mb={3}
                      sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}
                    >
                      <PersonIcon sx={{ color: '#667eea', fontSize: 24 }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#667eea',
                          fontSize: '1.1rem'
                        }}
                      >
                        Personal Information
                      </Typography>
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={3}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? "outlined" : "filled"}
                        helperText={!isEditing && !formData.name ? "Loading..." : ""}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                              },
                            },
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                                borderWidth: '2px',
                              },
                            },
                          },
                          '& .MuiFilledInput-root': {
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.06)',
                            },
                          }
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? "outlined" : "filled"}
                        multiline
                        rows={3}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                              },
                            },
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                                borderWidth: '2px',
                              },
                            },
                          },
                          '& .MuiFilledInput-root': {
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.06)',
                            },
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Contact Information Section */}
                  <Box>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={1} 
                      mb={3}
                      sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <EmailIcon sx={{ color: '#10b981', fontSize: 24 }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#10b981',
                          fontSize: '1.1rem'
                        }}
                      >
                        Contact Information
                      </Typography>
                    </Box>
                    
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? "outlined" : "filled"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10b981',
                              },
                            },
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10b981',
                                borderWidth: '2px',
                              },
                            },
                          },
                          '& .MuiFilledInput-root': {
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.06)',
                            },
                          }
                        }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? "outlined" : "filled"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10b981',
                              },
                            },
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10b981',
                                borderWidth: '2px',
                              },
                            },
                          },
                          '& .MuiFilledInput-root': {
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.06)',
                            },
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Professional Information Section */}
                  <Box>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={1} 
                      mb={3}
                      sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}
                    >
                      <BusinessIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#f59e0b',
                          fontSize: '1.1rem'
                        }}
                      >
                        Professional Information
                      </Typography>
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#f59e0b',
                            },
                          },
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#f59e0b',
                              borderWidth: '2px',
                            },
                          },
                        },
                        '& .MuiFilledInput-root': {
                          borderRadius: '16px',
                          backgroundColor: 'rgba(0,0,0,0.04)',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.06)',
                          },
                        }
                      }}
                    />
                  </Box>

                  {/* Location Information Section */}
                  <Box>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={1} 
                      mb={3}
                      sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(101, 49, 13, 0.1) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(139, 69, 19, 0.2)'
                      }}
                    >
                      <LocationIcon sx={{ color: '#8b4513', fontSize: 24 }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#8b4513',
                          fontSize: '1.1rem'
                        }}
                      >
                        Location Information
                      </Typography>
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={3}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        variant={isEditing ? "outlined" : "filled"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#8b4513',
                              },
                            },
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#8b4513',
                                borderWidth: '2px',
                              },
                            },
                          },
                          '& .MuiFilledInput-root': {
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.06)',
                            },
                          }
                        }}
                      />

                      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                        <TextField
                          fullWidth
                          label="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!isEditing}
                          variant={isEditing ? "outlined" : "filled"}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b4513',
                                },
                              },
                              '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b4513',
                                  borderWidth: '2px',
                                },
                              },
                            },
                            '& .MuiFilledInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(0,0,0,0.04)',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.06)',
                              },
                            }
                          }}
                        />
                        
                        <TextField
                          fullWidth
                          label="State"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          disabled={!isEditing}
                          variant={isEditing ? "outlined" : "filled"}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b4513',
                                },
                              },
                              '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b4513',
                                  borderWidth: '2px',
                                },
                              },
                            },
                            '& .MuiFilledInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(0,0,0,0.04)',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.06)',
                              },
                            }
                          }}
                        />
                        
                        <TextField
                          fullWidth
                          label="Country"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          disabled={!isEditing}
                          variant={isEditing ? "outlined" : "filled"}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              background: isEditing ? 'white' : 'rgba(0,0,0,0.04)',
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b4513',
                                },
                              },
                              '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b4513',
                                  borderWidth: '2px',
                                },
                              },
                            },
                            '& .MuiFilledInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(0,0,0,0.04)',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.06)',
                              },
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                </Box>
              </CardContent>
            </Card>
          </Box>

        </Box>
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />

      {/* Image Upload Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontWeight: 700,
          fontSize: '1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          📷 Update Profile Picture
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          {tempImageUrl && (
            <Box mb={3}>
              <Avatar
                src={tempImageUrl}
                sx={{ 
                  width: 200, 
                  height: 200, 
                  mx: 'auto',
                  boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                  border: '4px solid rgba(102, 126, 234, 0.2)'
                }}
              />
            </Box>
          )}
          <Typography variant="body1" color="text.secondary">
            This will be your new profile picture. Continue to upload?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3, gap: 2 }}>
          <Button 
            onClick={() => setImageDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderRadius: '12px',
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#5a67d8',
                background: 'rgba(102, 126, 234, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImageUpload} 
            disabled={uploadingImage}
            variant="contained"
            startIcon={uploadingImage ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ 
              borderRadius: '12px',
              px: 4,
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                color: 'white',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {uploadingImage ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProfile;