'use client';

import { useState,useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  Modal,
  Backdrop,
  Fade,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, VpnKey, Send } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import ThemeRegistry from '@/components/ThemeRegistry';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password Modal States
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.isAdmin) {
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          showNotification('Login successful! Welcome to Admin Panel', 'success');
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 1500);
        } else {
          showNotification('Admin access required', 'error');
          setError('Admin access required');
        }
      } else {
        showNotification(data.error || 'Login failed', 'error');
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error');
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Functions
  const handleForgotPasswordSubmit = async () => {
    if (forgotStep === 1) {
      // Send OTP
      setForgotLoading(true);
      setForgotError('');
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await response.json();
        if (response.ok) {
          showNotification('OTP sent to your email!', 'success');
          setForgotSuccess('OTP sent to your email!');
          setForgotStep(2);
        } else {
          showNotification(data.error || 'Failed to send OTP', 'error');
          setForgotError(data.error || 'Failed to send OTP');
        }
      } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        setForgotError('Network error. Please try again.');
      } finally {
        setForgotLoading(false);
      }
    } else if (forgotStep === 2) {
      // Verify OTP
      setForgotLoading(true);
      setForgotError('');
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp }),
        });
        const data = await response.json();
        if (response.ok) {
          showNotification('OTP verified! Set your new password.', 'success');
          setForgotSuccess('OTP verified! Set your new password.');
          setForgotStep(3);
        } else {
          showNotification(data.error || 'Invalid OTP', 'error');
          setForgotError(data.error || 'Invalid OTP');
        }
      } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        setForgotError('Network error. Please try again.');
      } finally {
        setForgotLoading(false);
      }
    } else if (forgotStep === 3) {
      // Reset Password
      if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        setForgotError('Passwords do not match');
        return;
      }
      setForgotLoading(true);
      setForgotError('');
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
        });
        const data = await response.json();
        if (response.ok) {
          showNotification('Password reset successfully!', 'success');
          setForgotSuccess('Password reset successfully!');
          setTimeout(() => {
            handleForgotPasswordClose();
          }, 2000);
        } else {
          showNotification(data.error || 'Failed to reset password', 'error');
          setForgotError(data.error || 'Failed to reset password');
        }
      } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        setForgotError('Network error. Please try again.');
      } finally {
        setForgotLoading(false);
      }
    }
  };

  const handleForgotPasswordClose = () => {
    setForgotPasswordOpen(false);
    setForgotStep(1);
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(false);
  };

  const storyImages = [
      'https://res.cloudinary.com/dy5vca5ux/image/upload/v1768378211/309b3f4a4bcafa0af04c1a94c386d54d_uiemos.png',
  'https://res.cloudinary.com/dy5vca5ux/image/upload/v1756896573/LoginImg_xgfaka.png',
  "https://res.cloudinary.com/dy5vca5ux/image/upload/v1767862719/palani-gallery/mkmqptjlm9oce1gxzlqn.jpg",
  "https://res.cloudinary.com/dy5vca5ux/image/upload/v1762442122/palani-temples/inmz8pbvukjqulplkuhz.jpg",
  'https://res.cloudinary.com/dy5vca5ux/image/upload/v1768378211/9e28733244bc223f51f72098f7c809cf_pcai2y.png',
  
];

const STORY_DURATION = 6000; 

const [storyIndex, setStoryIndex] = useState(0);
const [progress, setProgress] = useState(0);

useEffect(() => {
  setProgress(0);

  const startTime = Date.now();

  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const percentage = Math.min(
      (elapsed / STORY_DURATION) * 100,
      100
    );

    setProgress(percentage);

    if (percentage >= 100) {
      clearInterval(interval);
      setStoryIndex((prev) => (prev + 1) % storyImages.length);
    }
  }, 30);

  return () => clearInterval(interval);
}, [storyIndex]);


  return (
    <ThemeRegistry>
     <Box
  sx={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: { xs: 1.5, sm: 2, md: 3 },
  }}
>

       <Box
  sx={{
    maxWidth: 1200,
    width: '100%',
    height: { xs: 'auto', md: '700px' },
    background: '#FFFFFF',
    borderRadius: { xs: '16px', md: '25px' },
    border: '4px solid #667eea',
    boxShadow: '0 20px 40px #5a548f',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
  }}
>

{/* Left side - Web Story Image */}
<Box
  sx={{
    width: '50%',
    display: { xs: 'none', md: 'flex' },
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    p: 3,
    position: 'relative',
  }}
>
  <Box
    sx={{
      width: '100%',
      maxWidth: 450,
      height: 600,
      borderRadius: '20px',
      backgroundImage: `url(${storyImages[storyIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: '4px solid rgba(255,255,255,0.4)',
      boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
      transition: 'background-image 0.8s ease-in-out',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Bottom Gradient Overlay */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0.05))',
      }}
    />

  {/* Story Progress Bars – Bottom Moving */}
<Box
  sx={{
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    px: 2,
    pb: 1.2,
    display: 'flex',
    gap: 1,
    zIndex: 3,
    background:
      'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))',
  }}
>
  {storyImages.map((_, index) => (
    <Box
      key={index}
      sx={{
        flex: 1,
        height: 6,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.35)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: '100%',
          width:
            index < storyIndex
              ? '100%'
              : index === storyIndex
              ? `${progress}%`
              : '0%',
          backgroundColor: '#fff',
          transition:
            index === storyIndex
              ? 'width 0.03s linear'
              : 'none',
        }}
      />
    </Box>
  ))}
</Box>
  </Box>
</Box>



          {/* Right side - Login Form */}
          <Box
  sx={{
    width: { xs: '100%', md: '55%' },
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f2f2',
    p: { xs: 3, sm: 4, md: 5 },
  }}
>

            {/* Header */}
            <Box
              sx={{
                  width: '100%',
    maxWidth: 450,
    textAlign: 'center',
    mb: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px',
    py: { xs: 2.5, md: 3.5 },
    px: 3,
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              }}
            >
              <Typography
    sx={{
fontWeight: 'bold',
                  mb: 1,
      fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
      letterSpacing: '1.5px',
      color: 'black',
    }}
  >
    PALANI PADAYATHIRAI
  </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.95,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                color:"black",
    //              textShadow: `
    //  -0.5px -0.5px 0 #dcdcdc,
    //    0.5px -0.5px 0 #dcdcdc,
    //   -0.5px  0.5px 0 #dcdcdc,
    //    0.5px  0.5px 0 #dcdcdc
    // `,
                }}
              >
                Welcome to Admin Panel
              </Typography>
            </Box>

            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 450 }}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="enter the email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  variant="outlined"
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                      backgroundColor: '#F8F9FA',
                      border: '3px solid #667eea',
                      height: { xs: '58px', md: '70px' },
                      '&:hover': {
                        border: '3px solid #764ba2',
                        backgroundColor: '#FFFFFF',
                      },
                      '&.Mui-focused': {
                        border: '3px solid #5a67d8',
                        backgroundColor: '#FFFFFF',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '20px 16px',
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    },
                    '& fieldset': {
                      border: 'none',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#667eea', fontSize: '1.5rem', mr: 1 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  placeholder="••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                      backgroundColor: '#F8F9FA',
                      border: '3px solid #667eea',
                      height: { xs: '58px', md: '70px' },
                      '&:hover': {
                        border: '3px solid #764ba2',
                        backgroundColor: '#FFFFFF',
                      },
                      '&.Mui-focused': {
                        border: '3px solid #5a67d8',
                        backgroundColor: '#FFFFFF',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '20px 16px',
                     fontSize: { xs: '1rem', md: '1.1rem' },
                    },
                    '& fieldset': {
                      border: 'none',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#667eea', fontSize: '1.5rem', mr: 1 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#667eea', mr: 1 }}
                        >
                          {showPassword ? <VisibilityOff sx={{ fontSize: '1.5rem' }} /> : <Visibility sx={{ fontSize: '1.5rem' }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '15px',
                    border: '2px solid #667eea',
                    fontSize: '1rem',
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  height: '65px',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  letterSpacing: '2px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s ease',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.8)',
                    transform: 'translateY(-4px) scale(1.02)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    transform: 'translateY(-2px) scale(1.01)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.7)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.8,
                    transform: 'none',
                  },
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  }
                }}>
                LOGIN
                  {loading && (
                    <CircularProgress 
                      size={24} 
                      color="inherit"
                      sx={{
                        animation: 'pulse 1.5s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                          '50%': {
                            opacity: 0.7,
                            transform: 'scale(1.1)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </Button>

              {/* Forgot Password Link */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Link
                  component="button"
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  sx={{
                    color: '#667eea',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#764ba2',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      textDecoration: 'none',
                    },
                  }}
                >
                  Forgot Password?
                </Link>
              </Box>
            </form>
          </Box>
        </Box>

        {/* Forgot Password Modal */}
        <Modal
          open={forgotPasswordOpen}
          onClose={handleForgotPasswordClose}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
            sx: { backgroundColor: 'rgba(102, 126, 234, 0.4)' }
          }}
        >
          <Fade in={forgotPasswordOpen}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 420, md: 500 },
        maxHeight: '90vh',
        overflowY: 'auto',
                bgcolor: 'background.paper',
                borderRadius: '20px',
                border: '3px solid #667eea',
                boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                p: 4,
              }}
            >
              {/* Modal Header */}
              <Box
                sx={{
                  textAlign: 'center',
                  mb: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '15px',
                  py: 2.5,
                  px: 3,
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: '1px',  fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  {forgotStep === 1 && 'Reset Password'}
                  {forgotStep === 2 && 'Verify OTP'}
                  {forgotStep === 3 && 'New Password'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                  {forgotStep === 1 && 'Enter your email to receive OTP'}
                  {forgotStep === 2 && 'Enter the 6-digit OTP sent to your email'}
                  {forgotStep === 3 && 'Create your new password'}
                </Typography>
              </Box>

              {/* Step 1: Email Input */}
              {forgotStep === 1 && (
                <Box>
                  <TextField
                    fullWidth
                    placeholder="Enter your email address"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F8F9FA',
                        border: '2px solid #667eea',
                        height: { xs: '52px', sm: '60px' },
fontSize: { xs: '0.95rem', sm: '1rem' },

                        '&:hover': {
                          border: '2px solid #764ba2',
                          backgroundColor: '#FFFFFF',
                        },
                        '&.Mui-focused': {
                          border: '2px solid #5a67d8',
                          backgroundColor: '#FFFFFF',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '16px',
                        fontSize: '1rem',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#667eea', fontSize: '1.3rem', mr: 1 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* Step 2: OTP Input */}
              {forgotStep === 2 && (
                <Box>
                  <TextField
                    fullWidth
                    placeholder="Enter 6-digit OTP"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    variant="outlined"
inputProps={{
  maxLength: 6,
  style: {
    textAlign: 'center',
    fontSize: '1.3rem',
    letterSpacing: '4px',
  }
}}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F8F9FA',
                        border: '2px solid #667eea',
                       height: { xs: '52px', sm: '60px' },
fontSize: { xs: '0.95rem', sm: '1rem' },

                        '&:hover': {
                          border: '2px solid #764ba2',
                          backgroundColor: '#FFFFFF',
                        },
                        '&.Mui-focused': {
                          border: '2px solid #5a67d8',
                          backgroundColor: '#FFFFFF',
                        },
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey sx={{ color: '#667eea', fontSize: '1.3rem', mr: 1 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* Step 3: New Password */}
              {forgotStep === 3 && (
                <Box>
                  <TextField
                    fullWidth
                    placeholder="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F8F9FA',
                        border: '2px solid #667eea',
                        height: { xs: '52px', sm: '60px' },
fontSize: { xs: '0.95rem', sm: '1rem' },

                        '&:hover': {
                          border: '2px solid #764ba2',
                          backgroundColor: '#FFFFFF',
                        },
                        '&.Mui-focused': {
                          border: '2px solid #5a67d8',
                          backgroundColor: '#FFFFFF',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '16px',
                        fontSize: '1rem',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#667eea', fontSize: '1.3rem', mr: 1 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            sx={{ color: '#667eea' }}
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    placeholder="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F8F9FA',
                        border: '2px solid #667eea',
                        height: { xs: '52px', sm: '60px' },
fontSize: { xs: '0.95rem', sm: '1rem' },

                        '&:hover': {
                          border: '2px solid #764ba2',
                          backgroundColor: '#FFFFFF',
                        },
                        '&.Mui-focused': {
                          border: '2px solid #5a67d8',
                          backgroundColor: '#FFFFFF',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '16px',
                        fontSize: '1rem',
                        
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#667eea', fontSize: '1.3rem', mr: 1 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: '#667eea' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* Error/Success Messages */}
              {forgotError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
                  {forgotError}
                </Alert>
              )}
              {forgotSuccess && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>
                  {forgotSuccess}
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2,     flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between' }}>
                <Button
                  onClick={handleForgotPasswordClose}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    height: '50px',
                    borderRadius: '12px',
                    border: '2px solid #667eea',
                    color: '#667eea',
                    fontWeight: 'bold',
                    '&:hover': {
                      border: '2px solid #764ba2',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleForgotPasswordSubmit}
                  variant="contained"
                  disabled={forgotLoading || 
                    (forgotStep === 1 && !forgotEmail) ||
                    (forgotStep === 2 && otp.length !== 6) ||
                    (forgotStep === 3 && (!newPassword || !confirmPassword))
                  }
                  sx={{
                    flex: 1,
                    height: '50px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                    },
                  }}
                >
                  {forgotLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      {forgotStep === 1 && 'Send OTP'}
                      {forgotStep === 2 && 'Verify OTP'}
                      {forgotStep === 3 && 'Reset Password'}
                    </>
                  )}
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>

        {/* Toast Container */}
      </Box>
    </ThemeRegistry>
  );
}
