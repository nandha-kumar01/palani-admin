'use client';

import { useState } from 'react';
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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
          toast.success('Login successful! Welcome to Admin Panel', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 1500);
        } else {
          toast.error('Admin access required', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setError('Admin access required');
        }
      } else {
        toast.error(data.error || 'Login failed', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
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
          toast.success('OTP sent to your email!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setForgotSuccess('OTP sent to your email!');
          setForgotStep(2);
        } else {
          toast.error(data.error || 'Failed to send OTP', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setForgotError(data.error || 'Failed to send OTP');
        }
      } catch (error) {
        toast.error('Network error. Please try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
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
          toast.success('OTP verified! Set your new password.', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setForgotSuccess('OTP verified! Set your new password.');
          setForgotStep(3);
        } else {
          toast.error(data.error || 'Invalid OTP', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setForgotError(data.error || 'Invalid OTP');
        }
      } catch (error) {
        toast.error('Network error. Please try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        setForgotError('Network error. Please try again.');
      } finally {
        setForgotLoading(false);
      }
    } else if (forgotStep === 3) {
      // Reset Password
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
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
          toast.success('Password reset successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setForgotSuccess('Password reset successfully!');
          setTimeout(() => {
            handleForgotPasswordClose();
          }, 2000);
        } else {
          toast.error(data.error || 'Failed to reset password', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
          setForgotError(data.error || 'Failed to reset password');
        }
      } catch (error) {
        toast.error('Network error. Please try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
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

  return (
    <ThemeRegistry>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            width: '95%',
            height: '700px',
            background: '#FFFFFF',
            borderRadius: '25px',
            border: '4px solid #667eea',
            boxShadow: '0 20px 40px #5a548f',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {/* Left side - Deity Image */}
          <Box 
            sx={{
              width: '50%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: 3,
            }}
          >
            <Box
              sx={{
                width: '450px',
                height: '600px',
                borderRadius: '20px',
                backgroundImage: 'url(https://res.cloudinary.com/dy5vca5ux/image/upload/v1756896573/LoginImg_xgfaka.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: '4px solid rgba(255,255,255,0.4)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
              }}
            >
           
            </Box>
          </Box>

          {/* Right side - Login Form */}
          <Box 
            sx={{
              width: '55%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f2f2',
              padding: 5,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                width: '450px',
                textAlign: 'center',
                mb: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                py: 3.5,
                px: 4,
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              }}
            >
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: '2.5rem',
                  letterSpacing: '2px'
                }}
              >
                ADMIN LOGIN
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.95,
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}
              >
                Welcome to Control Center
              </Typography>
            </Box>

            <form onSubmit={handleSubmit} style={{ width: '450px' }}>
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
                      height: '70px',
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
                      fontSize: '1.1rem',
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
                      height: '70px',
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
                      fontSize: '1.1rem',
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
                width: 500,
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
                <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: '1px' }}>
                  {forgotStep === 1 && 'Reset Password'}
                  {forgotStep === 2 && 'Verify OTP'}
                  {forgotStep === 3 && 'New Password'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
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
                        height: '60px',
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
                    inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' } }}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F8F9FA',
                        border: '2px solid #667eea',
                        height: '60px',
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
                        height: '60px',
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
                        height: '60px',
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
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
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
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{
            fontSize: '16px',
            fontWeight: '500',
          }}
          toastStyle={{
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
          }}
        />
      </Box>
    </ThemeRegistry>
  );
}
