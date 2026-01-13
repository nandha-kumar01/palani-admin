'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Filter } from 'iconoir-react';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
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
  Alert,
  CircularProgress,
  Avatar,
  PaginationItem,
  
  TextField,
  InputAdornment,
  Tooltip,
  Badge,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Skeleton,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Block,
  CheckCircle,
  Visibility,
  DirectionsWalk,
  Person,
  TrendingUp,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Phone,
  Email,
  CalendarToday,
  Place,
  Groups,
  Security,
  ManageAccounts,
  RemoveRedEye,
  EditOutlined,
  DeleteOutline,
  Refresh,
  Delete as DeleteIcon,
  FilterList,
  Warning,
  TrendingUp as RouteIcon,
  HomeWork,
  RestartAlt,
  WhatsApp,
  MoreVert,
  Menu as MenuIcon,
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';


interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  isActive: boolean;
  isAdmin: boolean;
  isTracking: boolean;
  pathayathiraiStatus: 'not_started' | 'in_progress' | 'completed';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  startDate?: Date;
  endDate?: Date;
  totalDistance: number;
  visitedTemples: any[];
  groupId?: string;
  groupName?: string;
  joinedGroupAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  password?: string;
  isActive: boolean;
  isAdmin: boolean;
  pathayathiraiStatus: 'not_started' | 'in_progress' | 'completed';
  groupId?: string;
}

interface UserStats {
  total: number;
  active: number;
  tracking: number;
  onPathayathirai: number;
  deleted?: number;
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

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, tracking: 0, onPathayathirai: 0 });
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  
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
  
  // Individual filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [whatsappFilter, setWhatsappFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    isActive: true,
    isAdmin: false,
    pathayathiraiStatus: 'not_started',
    groupId: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  
  // Menu states for delete options
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedUserForMenu, setSelectedUserForMenu] = useState<string | null>(null);

  // Search filter toggle state
  const [showSearchFilter, setShowSearchFilter] = useState(false);

  // Retry mechanism state
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Enhanced auto-retry mechanism for critical errors (especially 500 errors)
  useEffect(() => {
    if (error && !loading && !isRetrying && isMountedRef.current && !openDialog) {
      // More aggressive retry for server errors (500, 502, 503)
      const isServerError = error.toLowerCase().includes('server') || 
                           error.toLowerCase().includes('500') || 
                           error.toLowerCase().includes('502') || 
                           error.toLowerCase().includes('503') ||
                           error.toLowerCase().includes('internal error') ||
                           error.toLowerCase().includes('gateway');
      
      const maxRetries = isServerError ? 5 : 3; // More retries for server errors
      
      if (retryCount < maxRetries) {
        // Exponential backoff with jitter for server errors
        const baseDelay = isServerError ? 1500 : 2000; // Faster retry for server errors
        const exponentialDelay = Math.pow(2, retryCount) * baseDelay;
        const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
        const retryDelay = Math.min(exponentialDelay + jitter, 15000); // Max 15s delay
        
        const retryTimer = setTimeout(() => {
          if (isMountedRef.current && !openDialog) {
            setRetryCount(prev => prev + 1);
            fetchUsersSafe(true);
          }
        }, retryDelay);

        return () => clearTimeout(retryTimer);
      } else {
        // Reset retry count after max attempts
        const resetTimer = setTimeout(() => {
          if (isMountedRef.current) {
            setRetryCount(0);
          }
        }, 30000); // Reset after 30 seconds
        
        return () => clearTimeout(resetTimer);
      }
    }
  }, [error, loading, isRetrying, retryCount, openDialog]);

  // Periodic refresh every 5 minutes when page is active and no dialogs open
  useEffect(() => {
    if (!error && users.length > 0 && isMountedRef.current && !openDialog) {
      const refreshInterval = setInterval(() => {
        if (document.visibilityState === 'visible' && !loading && !isRetrying && !openDialog && isMountedRef.current) {
          fetchUsersSafe(true);
        }
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [error, users.length, loading, isRetrying, openDialog]);

  // Handle page visibility and network changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && error && !loading && !isRetrying && isMountedRef.current) {
        // Retry when page becomes visible and there was an error
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchUsersSafe(true);
          }
        }, 1000);
      }
    };

    const handleOnline = () => {
      if (isMountedRef.current) {
        setConnectionStatus('online');
        if (error && !loading && !isRetrying) {
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchUsersSafe(true);
            }
          }, 500);
        }
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setConnectionStatus('offline');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, loading, isRetrying]);

  // Connection status and health monitoring
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking' | 'degraded'>('online');
  const [serverHealth, setServerHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');



  // Loading animation control
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 8 seconds

    return () => clearTimeout(timer);
  }, []);

  // Cleanup AbortController on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Use a try-catch to prevent any potential errors during cleanup
      try {
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          abortControllerRef.current.abort('Component unmounted');
        }
      } catch (cleanupError) {
        // Silently handle any cleanup errors - do not log
      }
    };
  }, []);

  // Optimized form handlers for better typing performance
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: numericValue }));
  }, []);

  const handleWhatsappChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, whatsappNumber: numericValue }));
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, password: value }));
  }, []);

  const handleStatusChange = useCallback((e: any) => {
    setFormData(prev => ({ ...prev, pathayathiraiStatus: e.target.value }));
  }, []);

  const handleGroupChange = useCallback((e: any) => {
    setFormData(prev => ({ ...prev, groupId: e.target.value || undefined }));
  }, []);

  const handleActiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isActive: e.target.checked }));
  }, []);

  const handleAdminChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isAdmin: e.target.checked }));
  }, []);

  // Filter handlers for better performance
  const handleNameFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNameFilter(e.target.value);
  }, []);

  const handleEmailFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailFilter(e.target.value);
  }, []);

  const handlePhoneFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneFilter(e.target.value);
  }, []);

  const handleWhatsappFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappFilter(e.target.value);
  }, []);

  const handleGroupFilterChange = useCallback((e: any) => {
    setGroupFilter(e.target.value);
  }, []);

  // Update form data when selectedUser changes (for edit mode)
  useEffect(() => {
    if (dialogMode === 'edit' && selectedUser && openDialog) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        whatsappNumber: selectedUser.whatsappNumber || '',
        password: '', // Always empty for security
        isActive: selectedUser.isActive,
        isAdmin: selectedUser.isAdmin,
        pathayathiraiStatus: selectedUser.pathayathiraiStatus,
        groupId: selectedUser.groupId || '',
      });
    }
  }, [selectedUser, dialogMode, openDialog]);

  // Initial load - more robust
  useEffect(() => {
    const initializeData = async () => {
      if (!isMountedRef.current) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      
      // Load data with error boundaries
      try {
        if (isMountedRef.current) {
          // Load groups first, then users - avoid race conditions
          await fetchGroups();
          if (isMountedRef.current) {
            await fetchUsersSafe();
          }
        }
      } catch (error) {
        // Continue anyway - individual functions handle their errors
        // Continue anyway - individual functions handle their errors
      }
    };
    
    initializeData();
  }, []);

  // Debounced fetch for filters - only when filters change and not during dialog operations
  useEffect(() => {
    // Prevent API calls when dialog is open or during form operations
    if (openDialog || formLoading || deleteLoading) {
      return;
    }
    
    if (nameFilter || emailFilter || phoneFilter || whatsappFilter || groupFilter || searchTerm) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && !openDialog && !formLoading && !deleteLoading) {
          fetchUsersSafe();
        }
      }, 500); // Increased debounce for production

      return () => clearTimeout(timeoutId);
    }
  }, [nameFilter, emailFilter, phoneFilter, whatsappFilter, groupFilter, searchTerm, openDialog, formLoading, deleteLoading]);

  // Server health check function to proactively detect issues
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setServerHealth('healthy');
        return true;
      } else {
        setServerHealth(response.status >= 500 ? 'down' : 'degraded');
        return false;
      }
    } catch (error) {
      // Check if it's an abort error
      const errorStr = String(error);
      if (errorStr.toLowerCase().includes('abort')) {
        return false; // Silent fail for aborted health checks
      }
      

      setServerHealth('down');
      return false;
    }
  };

  // Safe wrapper for fetchUsers to prevent ANY errors from escaping
  const fetchUsersSafe = async (isRetryAttempt = false) => {
    try {
      // Optional: Check server health before major operations (in production)
      if (!isRetryAttempt && process.env.NODE_ENV === 'production') {
        const isHealthy = await checkServerHealth();
      }
      
      await fetchUsers(isRetryAttempt);
    } catch (wrapperError) {
      // Final safety net - catch any errors that somehow escaped
      if (!isMountedRef.current) {
        return; // Component unmounted, ignore completely
      }
      
      // Only log if it's not an abort-related error
      const errorStr = String(wrapperError);
      if (!errorStr.toLowerCase().includes('abort') && 
          !errorStr.toLowerCase().includes('unmount')) {
        console.error('Wrapper caught unexpected error:', wrapperError);
      }
    }
  };

  const fetchUsers = async (isRetryAttempt = false) => {
    // PRODUCTION-READY FIX: Handle all possible server errors including 500 errors
    // - Multiple retry mechanisms with exponential backoff
    // - Comprehensive error detection and fallback strategies
    // - Enhanced network resilience for production environment
    
    // Double-check component mount status at the very beginning
    if (!isMountedRef.current) {
      return; // Exit immediately if component is unmounted
    }
    
    // Prevent API calls during dialog operations
    if (openDialog && !isRetryAttempt) {
      return; // Don't fetch when dialog is open unless it's a retry
    }
    
    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      if (!isRetryAttempt) {
        setShowLoadingAnimation(true);
        setLoading(true);
        setError('');
        setRetryCount(0);
      } else {
        setIsRetrying(true);
      }
      
      // Enhanced token validation with automatic refresh attempt
      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = 'Authentication required. Please login again.';
        if (isMountedRef.current) {
          setError(errorMsg);
          setShowLoadingAnimation(false);
          setLoading(false);
          setIsRetrying(false);
          router.push('/admin/login');
        }
        return;
      }
      
      // Build query parameters with validation
      const params = new URLSearchParams();
      try {
        if (nameFilter?.trim()) params.append('name', encodeURIComponent(nameFilter.trim()));
        if (emailFilter?.trim()) params.append('email', encodeURIComponent(emailFilter.trim()));
        if (phoneFilter?.trim()) params.append('phone', encodeURIComponent(phoneFilter.trim()));
        if (whatsappFilter?.trim()) params.append('whatsapp', encodeURIComponent(whatsappFilter.trim()));
        if (groupFilter?.trim()) params.append('group', encodeURIComponent(groupFilter.trim()));
        if (searchTerm?.trim()) params.append('search', encodeURIComponent(searchTerm.trim()));
      } catch (paramError) {
        // Continue with empty params if encoding fails
      }
      
      const queryString = params.toString();
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : '';
      const url = `${baseUrl}/api/admin/users${queryString ? `?${queryString}` : ''}`;
      
      // Only cleanup previous request if it's not the current one we're about to make
      try {
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          // Give a small delay to prevent race conditions
          setTimeout(() => {
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
              abortControllerRef.current.abort('New request started');
            }
          }, 50);
        }
      } catch (abortError) {
        // Silently handle any abort errors during cleanup
      }
      
      // Exit if component is unmounted before creating new controller
      if (!isMountedRef.current) {
        return;
      }
      
      // Create new controller for this request - but don't overwrite immediately
      controller = new AbortController();
      
      // Only set the ref after a small delay to prevent race conditions
      setTimeout(() => {
        if (isMountedRef.current && controller && !controller.signal.aborted) {
          abortControllerRef.current = controller;
        }
      }, 100);
      
      // Increased timeout for production (30 seconds)
      const timeout = process.env.NODE_ENV === 'production' ? 30000 : 15000;
      timeoutId = setTimeout(() => {
        if (controller && !controller.signal.aborted && isMountedRef.current) {
          try {
            controller.abort('Request timeout');
          } catch (timeoutAbortError) {
            // Silently handle any timeout abort errors
          }
        }
      }, timeout);
      
      // Enhanced fetch with multiple fallback strategies
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Add production-specific headers
          ...(process.env.NODE_ENV === 'production' && {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json, text/plain, */*',
          }),
        },
        signal: controller.signal,
        // Add credentials for production CORS issues
        ...(process.env.NODE_ENV === 'production' && {
          credentials: 'same-origin',
        }),
      };
      
      let response: Response;
      
      try {
        response = await fetch(url, fetchOptions);
      } catch (networkError) {
        // Handle network-level errors before they reach the main catch block
        if (controller && controller.signal.aborted) {
          return; // Silent exit for aborted requests
        }
        
        // For production, try alternative approaches for 500 errors
        if (process.env.NODE_ENV === 'production' && !isRetryAttempt) {

          
          // Clear the timeout before retry
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          // Try with simplified headers
          try {
            const fallbackOptions: RequestInit = {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
              signal: controller.signal,
            };
            
            response = await fetch(url, fallbackOptions);
          } catch (fallbackError) {
            throw networkError; // Use original error if fallback also fails
          }
        } else {
          throw networkError;
        }
      }

      // Clear timeout on response (success or error)
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (response.ok) {
        let data;
        try {
          const responseText = await response.text();
          if (!responseText.trim()) {
            throw new Error('Empty response from server');
          }
          data = JSON.parse(responseText);
        } catch (jsonError) {

          throw new Error('Invalid JSON response from server');
        }
        
        // Enhanced validation with fallback defaults
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from server');
        }
        
        // Ensure data structure integrity
        const usersArray = Array.isArray(data.users) ? data.users : [];
        const statsData = data.stats || { total: 0, active: 0, tracking: 0, onPathayathirai: 0 };
        
        // Validate each user object to prevent rendering errors
        const validUsers = usersArray.filter((user: any) => {
          return user && typeof user === 'object' && user._id && user.name;
        });

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setUsers(validUsers);
          setStats(statsData);
          setShowLoadingAnimation(false);
          setLoading(false);
          setIsRetrying(false);
          setRetryCount(0);
          setError('');
          setConnectionStatus('online');
          
          if (isRetryAttempt) {
            showNotification('Users loaded successfully!', 'success');
          }
        }
      } else {
        // Enhanced error handling for production with specific 500 error handling
        let errorMessage = 'Unable to load users data';
        let errorDetails = '';
        
        try {
          const responseText = await response.text();
          if (responseText.trim()) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
              errorDetails = errorData.details || '';
            } catch (jsonParseError) {
              // If JSON parsing fails, use the raw text as error message
              errorDetails = responseText.substring(0, 200);
            }
          }
        } catch (textError) {

        }
        
        // Specific handling for different status codes
        switch (response.status) {
          case 401:
            errorMessage = 'Your session has expired. Please login again.';
            localStorage.removeItem('token');
            if (isMountedRef.current) {
              router.push('/admin/login');
            }
            return;
          case 403:
            errorMessage = 'You do not have permission to access this data.';
            break;
          case 404:
            errorMessage = 'Users service not available. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server encountered an internal error. Retrying automatically...';

            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again.';
            break;
          default:
            errorMessage = `Service error (${response.status}). Please refresh the page.`;
        }
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(errorMessage);
          setShowLoadingAnimation(false);
          setLoading(false);
          setIsRetrying(false);
          setConnectionStatus('offline');
          
          if (!isRetryAttempt) {
            showNotification(errorMessage, 'error');
          }
        }
      }
    } catch (error) {
      // PRODUCTION-GRADE ERROR HANDLING with enhanced 500 error recovery
      
      // Clean up timeout if error occurs
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // First check: Component unmounted - immediate silent exit
      if (!isMountedRef.current) {
        return;
      }
      
      // Second check: Detect ALL possible abort scenarios
      const errorStr = String(error);
      const errorMsg = error instanceof Error ? error.message : '';
      const errorName = error instanceof Error ? error.name : '';
      
      // COMPREHENSIVE ABORT DETECTION - catches ALL variations
      const isAbortError = (
        // Standard AbortError detection
        errorName === 'AbortError' ||
        
        // DOMException AbortError
        (error instanceof DOMException && errorName === 'AbortError') ||
        
        // Message-based detection (case insensitive)
        errorMsg.toLowerCase().includes('abort') ||
        errorMsg.toLowerCase().includes('unmount') ||
        errorMsg === 'Component unmounted' ||
        errorMsg === 'This operation was aborted' ||
        errorMsg === 'New request started' ||
        
        // String representation detection
        errorStr.toLowerCase().includes('abort') ||
        errorStr.toLowerCase().includes('unmount') ||
        
        // Additional browser-specific patterns
        errorMsg.includes('The operation was aborted') ||
        errorMsg.includes('Request was aborted') ||
        errorMsg.includes('signal aborted') ||
        
        // Fetch API specific abort patterns  
        errorStr.includes('AbortError') ||
        errorStr.includes('The user aborted a request') ||
        
        // Additional comprehensive checks
        errorName.toLowerCase().includes('abort') ||
        (error && typeof error === 'object' && 'constructor' in error && 
         typeof (error as any).constructor.name === 'string' && 
         (error as any).constructor.name.toLowerCase().includes('abort'))
      );
      
      // If ANY abort pattern is detected, exit silently
      if (isAbortError) {
        return; // COMPLETE SILENT EXIT - absolutely no logging or state updates
      }
      
      // Special handling for timeout (only legitimate timeouts should show)
      if (errorMsg === 'Request timeout') {
        const timeoutMessage = 'Request timed out. Please try again.';

        
        if (isMountedRef.current) {
          setError(timeoutMessage);
          setShowLoadingAnimation(false);
          setLoading(false);
          setIsRetrying(false);
          setConnectionStatus('offline');
          
          if (!isRetryAttempt) {
            showNotification(timeoutMessage, 'warning');
          }
        }
        return;
      }
      
      // Enhanced error categorization for production issues
      let errorMessage = 'Connection failed. Please check your network and try again.';
      let shouldAutoRetry = false;
      
      if (error instanceof Error) {
        const msg = errorMsg.toLowerCase();
        
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('fetch error')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
          shouldAutoRetry = !isRetryAttempt && retryCount < 2;
        } else if (msg.includes('invalid response') || msg.includes('invalid json') || msg.includes('empty response')) {
          errorMessage = 'Received invalid data from server. This may be a temporary server issue.';
          shouldAutoRetry = !isRetryAttempt && retryCount < 1;
        } else if (msg.includes('typeerror') || msg.includes('syntax error')) {
          errorMessage = 'Request processing error. Please refresh the page.';
        } else if (msg.includes('cors') || msg.includes('cross-origin')) {
          errorMessage = 'Cross-origin request blocked. Please refresh and try again.';
        } else if (msg.includes('500') || msg.includes('internal server error')) {
          errorMessage = 'Server internal error detected. Attempting automatic recovery...';
          shouldAutoRetry = !isRetryAttempt && retryCount < 3; // More retries for 500 errors
        } else if (msg.includes('502') || msg.includes('bad gateway')) {
          errorMessage = 'Server gateway error. Retrying automatically...';
          shouldAutoRetry = !isRetryAttempt && retryCount < 2;
        } else if (msg.includes('503') || msg.includes('service unavailable')) {
          errorMessage = 'Service temporarily unavailable. Will retry automatically...';
          shouldAutoRetry = !isRetryAttempt && retryCount < 2;
        } else if (msg.includes('504') || msg.includes('gateway timeout')) {
          errorMessage = 'Gateway timeout. Retrying with extended timeout...';
          shouldAutoRetry = !isRetryAttempt && retryCount < 1;
        }
      }
      

      
      // Update UI state if component is still mounted
      if (isMountedRef.current) {
        setError(errorMessage);
        setShowLoadingAnimation(false);
        setLoading(false);
        setIsRetrying(false);
        setConnectionStatus('offline');
        
        if (!isRetryAttempt) {
          showNotification(errorMessage, shouldAutoRetry ? 'warning' : 'error');
        }
        
        // Auto-retry for certain error types (especially 500 errors)
        if (shouldAutoRetry) {
          const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000); // Max 10s delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setRetryCount(prev => prev + 1);
              fetchUsersSafe(true);
            }
          }, retryDelay);
        }
      }
    } finally {
      // Cleanup resources
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Controller cleanup is handled by the component unmount effect
    }
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    setWhatsappFilter('');
    setGroupFilter('');
    setSearchTerm('');
  };

  const handleApplyFilters = useCallback(() => {
    if (loading || isRetrying) return; // Prevent multiple calls
    
    fetchUsersSafe();
  }, []);

  const handleResetFilters = useCallback(() => {
    clearAllFilters();
  }, []);

  const fetchGroups = async () => {
    let timeoutId: NodeJS.Timeout | undefined;
    let controller: AbortController | undefined;
    
    try {
      if (!isMountedRef.current) return;
      
      setGroupsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMountedRef.current) {
          setGroups([]);
          setGroupsLoading(false);
        }
        return;
      }
      
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller && !controller.signal.aborted) {
          controller.abort('Groups request timeout');
        }
      }, 15000); // Increased timeout for groups
      
      const response = await fetch('/api/groups', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (response.ok) {
        let data;
        try {
          const responseText = await response.text();
          data = responseText ? JSON.parse(responseText) : { groups: [] };
        } catch (parseError) {

          data = { groups: [] };
        }
        
        if (isMountedRef.current) {
          const groupsArray = Array.isArray(data.groups) ? data.groups : [];
          setGroups(groupsArray);
        }
      } else {

        if (isMountedRef.current) {
          setGroups([]);
        }
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          if (isMountedRef.current) {
            router.push('/admin/login');
          }
        }
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Handle AbortError silently for groups
      if (error instanceof Error) {
        const errorStr = error.message?.toLowerCase() || '';
        if (error.name === 'AbortError' || errorStr.includes('abort') || errorStr.includes('timeout')) {
          return; // Silent abort
        }
      }
      
      // Only log non-abort errors
      if (isMountedRef.current) {
        setGroups([]);
      }
    } finally {
      if (isMountedRef.current) {
        setGroupsLoading(false);
      }
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', user?: User) => {
    // Cancel any ongoing API requests before opening dialog
    try {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort('Dialog opened - cancelling background requests');
      }
    } catch (abortError) {
      // Silently handle abort errors
    }
    
    setDialogMode(mode);
    setSelectedUser(user || null);
    
    if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        password: '',
        isActive: true,
        isAdmin: false,
        pathayathiraiStatus: 'not_started',
        groupId: '',
      });
    } else if (user) {
      // Ensure we properly handle the whatsappNumber field
      const whatsappValue = (user.whatsappNumber && user.whatsappNumber !== 'null' && user.whatsappNumber !== null) ? String(user.whatsappNumber) : '';
      
      const formDataToSet = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        whatsappNumber: whatsappValue,
        password: '', // Always empty for security
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        pathayathiraiStatus: user.pathayathiraiStatus,
        groupId: user.groupId || '',
      };
      
      setFormData(formDataToSet);
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setError('');
    setSuccess('');
    
    // After dialog closes, allow API calls to resume with a small delay
    setTimeout(() => {
      if (isMountedRef.current && !loading && !isRetrying) {
        // Only refresh if there are active filters or if data is stale
        const hasFilters = nameFilter || emailFilter || phoneFilter || whatsappFilter || groupFilter || searchTerm;
        if (hasFilters || users.length === 0) {
          fetchUsersSafe();
        }
      }
    }, 300);
  };

  const handleFormSubmit = async () => {
    // Prevent multiple submissions
    if (formLoading) {
      return;
    }
    
    // Validate required fields
    if (!formData.name.trim()) {
      showNotification('Name is required!', 'error');
      return;
    }
    
    if (!formData.email.trim()) {
      showNotification('Email is required!', 'error');
      return;
    }
    
    // Enhanced email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(formData.email.trim())) {
      showNotification('Please enter a valid email address!', 'error');
      return;
    }
    
    if (!formData.phone.trim()) {
      showNotification('Phone number is required!', 'error');
      return;
    }
    
    // Enhanced phone number validation
    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length !== 10) {
      showNotification('Phone number must be exactly 10 digits!', 'error');
      return;
    }
    
    // WhatsApp number validation - if provided, must be exactly 10 digits
    if (formData.whatsappNumber && formData.whatsappNumber.trim()) {
      const whatsappClean = formData.whatsappNumber.replace(/\D/g, '');
      if (whatsappClean.length !== 10) {
        showNotification('WhatsApp number must be exactly 10 digits!', 'error');
        return;
      }
    }
    
    // Enhanced password validation
    if (dialogMode === 'add' && (!formData.password || formData.password.trim().length < 6)) {
      showNotification('Password is required and must be at least 6 characters!', 'error');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      showNotification('Password must be at least 6 characters if provided!', 'error');
      return;
    }

    // Name validation
    if (formData.name.trim().length < 2) {
      showNotification('Name must be at least 2 characters long!', 'error');
      return;
    }

    if (!isMountedRef.current) return;
    
    setFormLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication required. Please login again.', 'error');
        router.push('/admin/login');
        return;
      }
      
      const url = dialogMode === 'add' ? '/api/admin/users' : `/api/admin/users/${selectedUser?._id}`;
      const method = dialogMode === 'add' ? 'POST' : 'PUT';
      
      // Prepare form data for submission with validation
      const submitData: any = { 
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''), // Clean phone number
        whatsappNumber: formData.whatsappNumber ? formData.whatsappNumber.replace(/\D/g, '') : '', // Clean WhatsApp
        isActive: formData.isActive,
        isAdmin: formData.isAdmin,
        pathayathiraiStatus: formData.pathayathiraiStatus,
        groupId: formData.groupId || undefined,
      };
      
      // Only include password if provided and not empty
      if (formData.password?.trim()) {
        submitData.password = formData.password.trim();
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort('Form submission timeout');
      }, 30000); // 30 second timeout for form submission
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(submitData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        let responseData;
        try {
          const responseText = await response.text();
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {

          responseData = { message: 'Operation completed successfully' };
        }
        
        const message = dialogMode === 'add' ? 'User created successfully!' : 'User updated successfully!';
        showNotification(message, 'success');
        
        // Close dialog first
        setOpenDialog(false);
        setSelectedUser(null);
        setError('');
        setSuccess('');
        
        // Clear form data
        setFormData({
          name: '',
          email: '',
          phone: '',
          whatsappNumber: '',
          password: '',
          isActive: true,
          isAdmin: false,
          pathayathiraiStatus: 'not_started',
          groupId: '',
        });
        
        // Refresh users data after a short delay
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchUsersSafe();
          }
        }, 500);
      } else {
        // Enhanced error handling for form submission
        let errorMessage = 'Operation failed!';
        
        try {
          const responseText = await response.text();
          if (responseText.trim()) {
            try {
              const data = JSON.parse(responseText);
              errorMessage = data.error || data.message || errorMessage;
            } catch (jsonError) {
              errorMessage = responseText.substring(0, 100) || errorMessage;
            }
          }
        } catch (textError) {

        }
        
        // Handle specific HTTP status codes
        switch (response.status) {
          case 400:
            errorMessage = errorMessage.includes('validation') ? errorMessage : 'Invalid data provided. Please check your input.';
            break;
          case 401:
            errorMessage = 'Your session has expired. Please login again.';
            localStorage.removeItem('token');
            router.push('/admin/login');
            return;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 409:
            errorMessage = errorMessage.includes('exists') ? errorMessage : 'User with this email or phone already exists.';
            break;
          case 500:
            errorMessage = 'Server error occurred. Please try again.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again.';
            break;
          default:
            if (!errorMessage.includes('failed') && response.status >= 400) {
              errorMessage = `Operation failed with error ${response.status}. Please try again.`;
            }
        }
        
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      // Enhanced network error handling
      let networkErrorMessage = 'Network error! Please check your connection.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror')) {
          networkErrorMessage = 'Connection failed. Please check your internet connection and try again.';
        } else if (errorMsg.includes('timeout')) {
          networkErrorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (errorMsg.includes('cors')) {
          networkErrorMessage = 'Cross-origin request blocked. Please refresh the page and try again.';
        } else if (errorMsg.includes('500')) {
          networkErrorMessage = 'Server error detected. Please try again in a moment.';
        }
      }
      
      console.error('Form submission network error:', error);
      showNotification(networkErrorMessage, 'error');
    } finally {
      if (isMountedRef.current) {
        setFormLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userId: string, event?: React.MouseEvent) => {
    // Prevent any event bubbling to avoid accidental status updates
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setUserToDelete(userId);
    setIsPermanentDelete(false); // Soft delete
    setDeleteDialog(true);
  };

  const handlePermanentDeleteUser = async (userId: string, event?: React.MouseEvent) => {
    // Prevent any event bubbling to avoid accidental status updates
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setUserToDelete(userId);
    setIsPermanentDelete(true); // Hard delete
    setDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !isMountedRef.current) return;
    
    setDeleteLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const url = isPermanentDelete 
        ? `/api/admin/users/${userToDelete}?permanent=true`
        : `/api/admin/users/${userToDelete}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          data = { message: 'User deleted successfully!' };
        }
        showNotification(data.message || 'User deleted successfully!', 'success');
        fetchUsersSafe();
      } else {
        let errorMessage = 'Delete failed!';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          switch (response.status) {
            case 401:
              errorMessage = 'Authentication required. Please login again.';
              localStorage.removeItem('token');
              router.push('/admin/login');
              return;
            case 403:
              errorMessage = 'You do not have permission to delete this user.';
              break;
            case 404:
              errorMessage = 'User not found or already deleted.';
              break;
            case 500:
              errorMessage = 'Server error occurred during deletion. Please try again.';
              break;
            default:
              errorMessage = `Delete failed with error ${response.status}.`;
          }
        }
        
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      let networkErrorMessage = 'Network error! Please check your connection.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror')) {
          networkErrorMessage = 'Connection failed during deletion. Please try again.';
        } else if (errorMsg.includes('500')) {
          networkErrorMessage = 'Server error detected during deletion. Please try again.';
        }
      }
      
      console.error('Delete user error:', error);
      showNotification(networkErrorMessage, 'error');
    } finally {
      if (isMountedRef.current) {
        setDeleteLoading(false);
        setDeleteDialog(false);
        setUserToDelete(null);
        setIsPermanentDelete(false);
      }
    }
  };

  const cancelDeleteUser = () => {
    setDeleteDialog(false);
    setUserToDelete(null);
    setIsPermanentDelete(false);
    setDeleteMenuAnchor(null);
    setSelectedUserForMenu(null);
  };

  const handleDeleteMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteMenuAnchor(event.currentTarget);
    setSelectedUserForMenu(userId);
  };

  const handleDeleteMenuClose = () => {
    setDeleteMenuAnchor(null);
    setSelectedUserForMenu(null);
  };

  const handleSoftDelete = () => {
    if (selectedUserForMenu) {
      handleDeleteUser(selectedUserForMenu);
    }
    handleDeleteMenuClose();
  };

  const handleHardDelete = () => {
    if (selectedUserForMenu) {
      handlePermanentDeleteUser(selectedUserForMenu);
    }
    handleDeleteMenuClose();
  };

  const handleToggleStatus = async (userId: string, isActive: boolean, event?: React.MouseEvent) => {
    // Prevent any event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!isMountedRef.current) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        const message = !isActive ? 'User activated successfully!' : 'User deactivated successfully!';
        showNotification(message, 'success');
        fetchUsersSafe();
      } else {
        let errorMessage = 'Status update failed!';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          switch (response.status) {
            case 401:
              errorMessage = 'Authentication required. Please login again.';
              localStorage.removeItem('token');
              router.push('/admin/login');
              return;
            case 403:
              errorMessage = 'You do not have permission to modify this user.';
              break;
            case 404:
              errorMessage = 'User not found.';
              break;
            case 500:
              errorMessage = 'Server error occurred during status update. Please try again.';
              break;
            default:
              errorMessage = `Status update failed with error ${response.status}.`;
          }
        }
        
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      let networkErrorMessage = 'Network error! Please check your connection.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror')) {
          networkErrorMessage = 'Connection failed during status update. Please try again.';
        } else if (errorMsg.includes('500')) {
          networkErrorMessage = 'Server error detected during status update. Please try again.';
        }
      }
      
      console.error('Status toggle error:', error);
      showNotification(networkErrorMessage, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'success';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'On Journey';
      case 'completed':
        return 'Completed';
      default:
        return 'Not Started';
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance.toFixed(0)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Format the date in a single line
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return formattedDate;
  };
  const [searchFilter, setSearchFilter] = useState('');

const filteredUsers = users.filter(user =>
  searchFilter === '' ||
  user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
  user.email.toLowerCase().includes(searchFilter.toLowerCase())
);

  const [page, setPage] = useState(1);
const rowsPerPage = 10;

const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

const paginatedUsers = filteredUsers.slice(
  (page - 1) * rowsPerPage,
  page * rowsPerPage
);

const handlePageChange = (_: any, value: number) => {
  setPage(value);
};

const [showPassword, setShowPassword] = useState(false);

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
              Loading Users...
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
     
       

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3, 
          mb: 3 
        }}>
          <StatCard
            title="Total Users"
            value={stats.total.toLocaleString()}
            icon={<Person sx={{ fontSize: 38 }}/>}
            color="#667eea"
          />
          <StatCard
            title="Active Users"
            value={stats.active}
            icon={<CheckCircle sx={{ fontSize: 38 }}/>}
            color="#764ba2"
          />
          <StatCard
            title="Currently Tracking"
            value={stats.tracking}
            icon={<LocationOn sx={{ fontSize: 38 }} />}
            color="#8B5CF6"
          />
          <StatCard
            title="On Pathayathirai"
            value={stats.onPathayathirai}
            icon={<DirectionsWalk sx={{ fontSize: 38 }}/>}
            color="#667eea"
          />
        </Box>


        {/* Enhanced Error Display with Specific Guidance */}
        {error && !loading && !showLoadingAnimation && (
          <Card sx={{ 
            mb: 3, 
            border: '1px solid #ef4444', 
            backgroundColor: '#fef2f2',
            position: 'relative',
            overflow: 'visible'
          }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" gap={2}>
                {error.toLowerCase().includes('500') || error.toLowerCase().includes('server') ? (
                  <Warning sx={{ color: '#f59e0b', mt: 0.5 }} />
                ) : (
                  <Cancel sx={{ color: '#ef4444', mt: 0.5 }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    color={error.toLowerCase().includes('500') || error.toLowerCase().includes('server') ? '#f59e0b' : 'error'} 
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    {error.toLowerCase().includes('500') || error.toLowerCase().includes('server') 
                      ? 'Server Issue Detected' 
                      : 'Connection Error'
                    }
                  </Typography>
                  <Typography 
                    color={error.toLowerCase().includes('500') || error.toLowerCase().includes('server') ? '#f59e0b' : 'error'} 
                    variant="body2" 
                    sx={{ mb: 1 }}
                  >
                    {error}
                  </Typography>
                  
                  {/* Specific guidance based on error type */}
                  {error.toLowerCase().includes('500') || error.toLowerCase().includes('server') ? (
                    <Alert severity="info" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                        This appears to be a server-side issue. Here's what's happening:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
                        <li>The server encountered an internal error (HTTP 500)</li>
                        <li>This is usually temporary and will resolve automatically</li>
                        <li>The system is already retrying in the background</li>
                        <li>If this persists, please contact technical support</li>
                      </ul>
                    </Alert>
                  ) : error.toLowerCase().includes('network') || error.toLowerCase().includes('connection') ? (
                    <Alert severity="warning" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      <Typography variant="body2">
                        Check your internet connection and try refreshing the page.
                      </Typography>
                    </Alert>
                  ) : null}
                  
                  {retryCount > 0 && (
                    <Box sx={{ mt: 1, p: 1, backgroundColor: '#fff7ed', borderRadius: 1, border: '1px solid #fed7aa' }}>
                      <Typography variant="body2" sx={{ color: '#ea580c', fontSize: '0.75rem', fontWeight: 600 }}>
                        Auto-retry attempt {retryCount}/{error.toLowerCase().includes('500') || error.toLowerCase().includes('server') ? '5' : '3'} in progress...
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <CircularProgress size={12} sx={{ color: '#ea580c' }} />
                        <Typography variant="caption" sx={{ color: '#ea580c' }}>
                          Next retry in a few seconds
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    setRetryCount(0);
                    setError('');
                    fetchUsersSafe(true);
                  }}
                  disabled={isRetrying}
                  startIcon={isRetrying ? <CircularProgress size={16} /> : <Refresh />}
                  sx={{
                    borderColor: error.toLowerCase().includes('500') ? '#f59e0b' : '#ef4444',
                    color: error.toLowerCase().includes('500') ? '#f59e0b' : '#ef4444',
                    '&:hover': {
                      borderColor: error.toLowerCase().includes('500') ? '#d97706' : '#dc2626',
                      backgroundColor: error.toLowerCase().includes('500') ? '#fffbeb' : '#fef2f2',
                    },
                    minWidth: 'auto',
                    px: 2,
                  }}
                >
                  {isRetrying ? 'Retrying...' : 'Retry Now'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Retrying Display */}
        {isRetrying && (
          <Card sx={{ mb: 3, border: '1px solid #2196f3', backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} sx={{ color: '#2196f3' }} />
                <Typography sx={{ color: '#1976d2', fontWeight: 600 }}>
                  Retrying to load users...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardContent>
            {/* Header with Actions */}
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
                      backgroundColor: '#e6efff',
                      color: '#667eea',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Filter width={20} height={20} />
                </IconButton>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#7353ae' }}>
                    Users
                </Typography>
                
                {/* Connection Status Indicator */}
                <Chip
                  size="small"
                  icon={
                    connectionStatus === 'online' && serverHealth === 'healthy' ? <CheckCircle /> :
                    connectionStatus === 'online' && serverHealth === 'degraded' ? <Warning /> :
                    connectionStatus === 'degraded' ? <Warning /> :
                    connectionStatus === 'offline' || serverHealth === 'down' ? <Cancel /> : 
                    <CircularProgress size={16} />
                  }
                  label={
                    connectionStatus === 'online' && serverHealth === 'healthy' ? 'Connected' :
                    connectionStatus === 'online' && serverHealth === 'degraded' ? 'Slow Connection' :
                    connectionStatus === 'degraded' ? 'Poor Connection' :
                    connectionStatus === 'offline' || serverHealth === 'down' ? 'Offline' : 
                    'Checking...'
                  }
                  color={
                    connectionStatus === 'online' && serverHealth === 'healthy' ? 'success' :
                    connectionStatus === 'online' && serverHealth === 'degraded' ? 'warning' :
                    connectionStatus === 'degraded' ? 'warning' :
                    connectionStatus === 'offline' || serverHealth === 'down' ? 'error' : 
                    'default'
                  }
                  sx={{ 
                    fontSize: '0.75rem',
                    height: 24,
                    '& .MuiChip-icon': { 
                      fontSize: 16 
                    },
                    // Add pulsing animation for checking/degraded states
                    ...(connectionStatus === 'checking' || connectionStatus === 'degraded' || serverHealth === 'degraded' ? {
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                        '100%': { opacity: 1 },
                      }
                    } : {})
                  }}
                />
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={() => fetchUsersSafe(false)}
                  disabled={loading || isRetrying}
                  startIcon={loading || isRetrying ? <CircularProgress size={16} /> : <Refresh />}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  {loading || isRetrying ? 'Loading...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/admin/users/deleted')}
                  startIcon={<DeleteOutline />}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                    },
                  }}
                >
                  Deleted Users ({stats.deleted || 0})
                </Button>
                

                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('add')}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Add User
                </Button>
              </Box>
            </Box>

            {/* Individual Filter Fields */}
            {showSearchFilter && (
              <Box mb={3} sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 3,
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
                  Filter Users
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                      fullWidth
                      label="User Name"
                      placeholder="Enter user name..."
                      value={nameFilter}
                      onChange={handleNameFilterChange}
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
                          transition: 'all 0.2s ease',
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
                      label="Email"
                      placeholder="Enter email address..."
                      value={emailFilter}
                      onChange={handleEmailFilterChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
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
                      label="Phone"
                      placeholder="Enter phone number..."
                      value={phoneFilter}
                      onChange={handlePhoneFilterChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
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
                      label="WhatsApp"
                      placeholder="Enter WhatsApp number..."
                      value={whatsappFilter}
                      onChange={handleWhatsappFilterChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsApp color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
                          '&:hover fieldset': {
                            borderColor: '#25d366',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#25d366',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                    
                    <FormControl
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
                      <InputLabel>Group</InputLabel>
                      <Select
                        value={groupFilter}
                        label="Group"
                        onChange={handleGroupFilterChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <Groups color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">
                          <em>All Groups</em>
                        </MenuItem>
                        <MenuItem value="solo">Solo Travelers</MenuItem>
                        {groups.map((group) => (
                          <MenuItem key={group._id} value={group._id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Action Buttons Below */}
                  <Box display="flex" justifyContent="flex-end" gap={2}>
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
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #f0f0f0' } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2,
                      textAlign: 'center',
                      width: '5%'
                    }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3,
                      width: '18%'
                    }}>
                      User Information
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3, 
                      textAlign: 'left',
                      width: '12%'
                    }}>
                      Joined Date
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 4,
                      width: '15%'
                    }}>
                      Contact Details
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '10%'
                    }}>
                      Group
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '8%'
                    }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '10%'
                    }}>
                      Journey Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '8%'
                    }}>
                      Tracking
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 2, 
                      textAlign: 'center',
                      width: '8%'
                    }}>
                      Progress
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3, 
                      textAlign: 'center',
                      width: '10%'
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      py: 2.5, 
                      px: 3, 
                      textAlign: 'center',
                      width: '18%'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`} sx={{ '& .MuiTableCell-root': { py: 2.5 } }}>
                        {/* S.No */}
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Skeleton 
                            variant="text" 
                            width={30} 
                            height={20}
                            sx={{ mx: 'auto' }}
                          />
                        </TableCell>

                        {/* User Information */}
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Skeleton 
                              variant="circular" 
                              width={40} 
                              height={40}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton 
                                variant="text" 
                                width="80%" 
                                height={24}
                                sx={{ mb: 0.5 }}
                              />
                              <Skeleton 
                                variant="text" 
                                width="60%" 
                                height={16}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell sx={{ textAlign: 'left', px: 3 }}>
                          <Skeleton 
                            variant="text" 
                            width={80} 
                            height={20}
                          />
                        </TableCell>

                        {/* Contact Details */}
                        <TableCell sx={{ minWidth: 200, px: 4 }}>
                          <Box>
                            <Skeleton 
                              variant="text" 
                              width="85%" 
                              height={20}
                              sx={{ mb: 0.5 }}
                            />
                            <Skeleton 
                              variant="text" 
                              width="70%" 
                              height={20}
                            />
                          </Box>
                        </TableCell>

                        {/* Group */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={60} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Role */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={60} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Journey Status */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={80} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Tracking */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <Skeleton 
                              variant="circular" 
                              width={18} 
                              height={18}
                            />
                            <Skeleton 
                              variant="text" 
                              width={40} 
                              height={16}
                            />
                          </Box>
                        </TableCell>

                        {/* Progress */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Skeleton 
                              variant="text" 
                              width={40} 
                              height={20}
                            />
                            <Skeleton 
                              variant="text" 
                              width={60} 
                              height={14}
                            />
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box display="flex" justifyContent="center">
                            <Skeleton 
                              variant="rounded" 
                              width={70} 
                              height={24}
                              sx={{ borderRadius: 1.5 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center" sx={{ py: 2, width: 200 }}>
                          <Box 
                            display="flex" 
                            justifyContent="center" 
                            alignItems="center"
                            gap={1}
                            sx={{ minHeight: 48, width: '100%' }}
                          >
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                            <Skeleton 
                              variant="rectangular" 
                              width={36} 
                              height={36}
                              sx={{ borderRadius: 2 }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    // No Data State
                    <TableRow>
                      <TableCell colSpan={11} sx={{ textAlign: 'center', py: 8 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                          <Person sx={{ fontSize: 64, color: '#e0e0e0' }} />
                          <Typography variant="h6" color="textSecondary">
                            {error ? 'Unable to load users' : 'No users found'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {error 
                              ? 'There was an issue loading the user data. Please try refreshing.' 
                              : 'Try adjusting your filters or add a new user to get started.'
                            }
                          </Typography>
                          {error && (
                            <Button 
                              variant="contained" 
                              onClick={() => fetchUsersSafe(true)}
                              disabled={isRetrying}
                              startIcon={isRetrying ? <CircularProgress size={16} /> : <Refresh />}
                              sx={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                },
                              }}
                            >
                              {isRetrying ? 'Retrying...' : 'Try Again'}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Actual Data Rows
                    paginatedUsers.map((user, index) => (
                    <TableRow 
                      key={user._id} 
                      hover 
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s ease',
                        },
                        '& .MuiTableCell-root': { py: 2.5 }
                      }}
                    >
                       <TableCell align="center" sx={{ py: 2.5, px: 2 }}>
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
                      <TableCell sx={{ minWidth: 250, px: 3 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main',
                              width: 40,
                              height: 40,
                              fontSize: '1rem',
                              fontWeight: 600
                            }}
                          >
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: '0.9rem',
                                lineHeight: 1.2,
                                mb: 0.5
                              }}
                            >
                              {user.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'left', px: 3, minWidth: 120, maxWidth: 140 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {formatJoinDate(user.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 200, px: 4 }}>
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
                            <Email sx={{ fontSize: 14, color: '#6b7280' }} />
                            {user.email}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#6b7280',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: user.whatsappNumber ? 0.5 : 0
                            }}
                          >
                            <Phone sx={{ fontSize: 14, color: '#6b7280' }} />
                            {user.phone}
                          </Typography>
                          {user.whatsappNumber && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#16a34a',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <WhatsApp sx={{ fontSize: 14, color: '#25d366' }} />
                              {user.whatsappNumber}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" justifyContent="center">
                          {user.groupName ? (
                            <Chip
                              label={user.groupName}
                              color="info"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 34,
                                borderRadius: 2.5,
                                minWidth: 110,
                                px: 1.5,
                                '& .MuiChip-label': { 
                                  px: 2,
                                  py: 0.75
                                }
                              }}
                            />
                          ) : (
                            <Chip
                              label="Solo"
                              color="default"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 34,
                                borderRadius: 2.5,
                                minWidth: 110,
                                px: 1.5,
                                '& .MuiChip-label': { 
                                  px: 2,
                                  py: 0.75
                                }
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            label={user.isAdmin ? 'Admin' : 'User'}
                            color={user.isAdmin ? 'primary' : 'default'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              px: 1.5,
                              '& .MuiChip-label': { 
                                px: 2,
                                py: 0.75
                              }
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            label={getStatusLabel(user.pathayathiraiStatus)}
                            color={getStatusColor(user.pathayathiraiStatus)}
                            size="small"
                            icon={user.pathayathiraiStatus === 'in_progress' ? <DirectionsWalk sx={{ fontSize: 16 }} /> : undefined}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              px: 1.5,
                              '& .MuiChip-label': { 
                                px: 2,
                                py: 0.75
                              },
                              '& .MuiChip-icon': { 
                                fontSize: 16,
                                ml: 0.5
                              }
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          {user.isTracking ? (
                            <Badge color="success" variant="dot">
                              <LocationOn 
                                sx={{ 
                                  color: '#10b981', 
                                  fontSize: 18,
                                  animation: 'pulse 2s infinite'
                                }} 
                              />
                            </Badge>
                          ) : (
                            <LocationOn 
                              sx={{ 
                                color: '#d1d5db', 
                                fontSize: 18
                              }} 
                            />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: user.isTracking ? '#10b981' : '#6b7280',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            {user.isTracking ? 'Live' : 'Offline'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 2 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 700,
                              color: '#374151',
                              fontSize: '0.8rem'
                            }}
                          >
                            {formatDistance(user.totalDistance)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Box 
                              sx={{ 
                                width: 4, 
                                height: 4, 
                                borderRadius: '50%', 
                                backgroundColor: '#f59e0b' 
                              }} 
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#6b7280',
                                fontSize: '0.65rem',
                                fontWeight: 500
                              }}
                            >
                              {user.visitedTemples?.length || 0} temples
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', px: 3 }}>
                        <Box display="flex" justifyContent="center">
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                            variant={user.isActive ? 'filled' : 'outlined'}
                            icon={user.isActive ? <CheckCircle sx={{ fontSize: 16 }} /> : <Block sx={{ fontSize: 16 }} />}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 34,
                              borderRadius: 2.5,
                              minWidth: 110,
                              px: 1.5,
                              '& .MuiChip-label': { 
                                px: 2,
                                py: 0.75
                              },
                              '& .MuiChip-icon': { 
                                fontSize: 16,
                                ml: 0.5
                              },
                              ...(user.isActive ? {
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                border: '1px solid #16a34a',
                                '&:hover': {
                                  backgroundColor: '#16a34a',
                                }
                              } : {
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: '1px solid #dc2626',
                                '&:hover': {
                                  backgroundColor: '#dc2626',
                                }
                              })
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2.5, px: 3, width: 200 }}>
                        <Box 
                          display="flex" 
                          justifyContent="center" 
                          alignItems="center"
                          gap={1}
                          sx={{
                            minHeight: 50,
                            width: '100%',
                            '& .action-button': {
                              width: 38,
                              height: 38,
                              borderRadius: 2.5,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: '1px solid',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                              flexShrink: 0,
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                              }
                            },
                            '& .delete-button': {
                              position: 'relative',
                              
                            }
                          }}
                        >
                          <Tooltip title="View Details" placement="top" arrow>
                            <IconButton 
                              className="action-button"
                              size="small" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDialog('view', user);
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
                              <RemoveRedEye fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit User" placement="top" arrow>
                            <IconButton 
                              className="action-button"
                              size="small" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDialog('edit', user);
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
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Always render delete button container for consistent spacing - MOVED BEFORE STATUS TOGGLE */}
                          {!user.isAdmin ? (
                            <Tooltip title="Delete Options - Choose Delete Type" placement="top" arrow>
                              <IconButton
                                className="action-button delete-button"
                                size="small"
                                onClick={(e) => handleDeleteMenuClick(e, user._id)}
                                sx={{
                                  color: '#ef4444',
                                  borderColor: '#ef4444',
                                  backgroundColor: '#fef2f2',
                                  fontWeight: 'bold',
                                  '&:hover': { 
                                    backgroundColor: '#fee2e2',
                                    borderColor: '#dc2626',
                                    color: '#dc2626',
                                    transform: 'translateY(-2px) scale(1.05)',
                                  },
                                  '&:active': {
                                    transform: 'translateY(0) scale(0.95)',
                                  }
                                }}
                              >
                                <MoreVert fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box sx={{ width: 36, height: 36, marginRight: '8px' }} /> // Empty space for admin users with same spacing
                          )}

                          <Tooltip title={user.isActive ? 'Deactivate User - Temporarily Disable Access' : 'Activate User - Enable Access'} placement="top" arrow>
                            <IconButton
                              className="action-button status-toggle-button"
                              size="small"
                              onClick={(e) => handleToggleStatus(user._id, user.isActive, e)}
                              sx={{
                                color: user.isActive ? '#ff9800' : '#10b981',
                                borderColor: user.isActive ? '#ff9800' : '#10b981',
                                backgroundColor: user.isActive ? '#fff3e0' : '#f0fdf4',
                                marginLeft: '-1px', 
                                '&:hover': { 
                                  backgroundColor: user.isActive ? '#ffe0b2' : '#dcfce7',
                                  borderColor: user.isActive ? '#f57c00' : '#059669',
                                  color: user.isActive ? '#f57c00' : '#059669',
                                },
                                '&:active': {
                                  transform: 'scale(0.95)',
                                }
                              }}
                            >
                              {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          {/* Always render location button container for consistent spacing */}
                          {user.isTracking ? (
                            <Tooltip title="View Live Location" placement="top" arrow>
                              <IconButton 
                                className="action-button"
                                size="small"
                                sx={{
                                  color: '#10b981',
                                  borderColor: '#10b981',
                                  backgroundColor: '#f0fdf4',
                                  '&:hover': { 
                                    backgroundColor: '#dcfce7',
                                    borderColor: '#059669',
                                    color: '#059669',
                                  },
                                  animation: 'pulse 2s infinite',
                                }}
                              >
                                <LocationOn fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box sx={{ width: 36, height: 36 }} /> // Empty space for non-tracking users
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (

<Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    p: 2,
  }}
>
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

        {/* Add/Edit/View User Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
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
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.4)',
              },
              '70%': {
                boxShadow: '0 0 0 8px rgba(46, 125, 50, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)',
              },
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              textAlign: 'center', 
              py: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderBottom: '3px solid rgba(255,255,255,0.2)'
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  letterSpacing: '0.5px'
                }}
              >
                {dialogMode === 'add' && 'Add New User'}
                {dialogMode === 'edit' && 'Edit User'}
                {dialogMode === 'view' && 'User Details'}
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
            
            {dialogMode === 'view' && selectedUser ? (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #e3f2fd'
                        }}
                      >
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h5" 
                            gutterBottom 
                            color="primary" 
                            sx={{ 
                              fontWeight: 700,
                              mb: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <Person sx={{ fontSize: 28, color: '#3b82f6' }} />
                            Personal Information
                          </Typography>
                          <Stack spacing={3}>
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Person sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Full Name
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.name}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Email sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Email Address
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.email}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Phone sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Phone Number
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.phone}
                                </Typography>
                              </Box>
                            </Box>

                            {selectedUser.whatsappNumber && (
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                gap={2}
                                sx={{
                                  p: 2,
                                  backgroundColor: '#f0fdf4',
                                  borderRadius: 2,
                                  border: '1px solid #bbf7d0'
                                }}
                              >
                                <WhatsApp sx={{ color: '#25d366', fontSize: 20 }} />
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                    WhatsApp Number
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#16a34a' }}>
                                    {selectedUser.whatsappNumber}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <CalendarToday sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Member Since
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Groups sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Group Status
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.groupName ? selectedUser.groupName : 'Solo Traveler'}
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #e3f2fd'
                        }}
                      >
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h5" 
                            gutterBottom 
                            color="primary" 
                            sx={{ 
                              fontWeight: 700,
                              mb: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <DirectionsWalk sx={{ fontSize: 28, color: '#3b82f6' }} />
                            Journey Information
                          </Typography>
                          <Stack spacing={3}>
                            <Box 
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                                Journey Status
                              </Typography>
                              <Chip
                                label={getStatusLabel(selectedUser.pathayathiraiStatus)}
                                color={getStatusColor(selectedUser.pathayathiraiStatus)}
                                size="medium"
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  height: 32
                                }}
                              />
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <RouteIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Total Distance Covered
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {formatDistance(selectedUser.totalDistance)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <HomeWork sx={{ color: '#3b82f6', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Temples Visited
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {selectedUser.visitedTemples?.length || 0} temples
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={2}
                              sx={{
                                p: 2,
                                backgroundColor: selectedUser.isTracking ? '#f0fdf4' : '#fef2f2',
                                borderRadius: 2,
                                border: selectedUser.isTracking ? '1px solid #bbf7d0' : '1px solid #fecaca'
                              }}
                            >
                              <LocationOn sx={{ 
                                color: selectedUser.isTracking ? '#16a34a' : '#dc2626', 
                                fontSize: 20 
                              }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Live Tracking
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.95rem',
                                    color: selectedUser.isTracking ? '#16a34a' : '#dc2626'
                                  }}
                                >
                                  {selectedUser.isTracking ? 'Active' : 'Inactive'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {selectedUser.currentLocation && (
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                gap={2}
                                sx={{
                                  p: 2,
                                  backgroundColor: '#f0f9ff',
                                  borderRadius: 2,
                                  border: '1px solid #bae6fd'
                                }}
                              >
                                <Place sx={{ color: '#0ea5e9', fontSize: 20 }} />
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                    Current Location
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                    {selectedUser.currentLocation.latitude.toFixed(4)}, {selectedUser.currentLocation.longitude.toFixed(4)}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                  
                  <Card 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #e3f2fd'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        color="primary" 
                        sx={{ 
                          fontWeight: 700,
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <ManageAccounts sx={{ fontSize: 28, color: '#3b82f6' }} />
                        Account Status
                      </Typography>
                      <Stack direction="row" spacing={3} sx={{ justifyContent: 'center' }}>
                        <Box 
                          sx={{
                            p: 3,
                            backgroundColor: selectedUser.isActive ? '#f0fdf4' : '#fef2f2',
                            borderRadius: 3,
                            border: selectedUser.isActive ? '2px solid #bbf7d0' : '2px solid #fecaca',
                            textAlign: 'center',
                            minWidth: 150,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            }
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                            Account Status
                          </Typography>
                          <Chip
                            label={selectedUser.isActive ? 'Active' : 'Inactive'}
                            color={selectedUser.isActive ? 'success' : 'error'}
                            size="medium"
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              height: 36,
                              px: 2
                            }}
                          />
                        </Box>
                        
                        <Box 
                          sx={{
                            p: 3,
                            backgroundColor: selectedUser.isAdmin ? '#eff6ff' : '#f8fafc',
                            borderRadius: 3,
                            border: selectedUser.isAdmin ? '2px solid #bfdbfe' : '2px solid #e2e8f0',
                            textAlign: 'center',
                            minWidth: 150,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            }
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                            User Role
                          </Typography>
                          <Chip
                            label={selectedUser.isAdmin ? 'Administrator' : 'Standard User'}
                            color={selectedUser.isAdmin ? 'primary' : 'default'}
                            size="medium"
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              height: 36,
                              px: 2
                            }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            ) : (
              <Box component="form" sx={{ mt: 2 }}>
                <Stack spacing={4}>
                  {/* Personal Information Section */}
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
                      <Person sx={{ color: '#1565c0', fontSize: 28 }} />
                      Personal Information
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
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={handleNameChange}
                            required
                            disabled={dialogMode === 'view'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'name',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
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
                        
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            placeholder="Enter 10-digit phone number"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            required
                            disabled={dialogMode === 'view'}
                            inputProps={{
                              inputMode: 'numeric',
                              pattern: '[0-9]*',
                              maxLength: 10
                            }}
                            helperText={dialogMode === 'view' ? '' : ''}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Phone color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'tel',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
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
                      
                      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleEmailChange}
                            required
                            disabled={dialogMode === 'view'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'email',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
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
                        
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            label="WhatsApp Number"
                            placeholder="Enter 10-digit WhatsApp number (optional)"
                            value={formData.whatsappNumber || ''}
                            onChange={handleWhatsappChange}
                            disabled={dialogMode === 'view'}
                            inputProps={{
                              inputMode: 'numeric',
                              pattern: '[0-9]*',
                              maxLength: 10
                            }}
                            helperText={dialogMode === 'view' ? '' : ''}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WhatsApp color="action" />
                                </InputAdornment>
                              ),
                              autoComplete: 'tel',
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                  borderColor: '#25d366',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#25d366',
                                  borderWidth: 2,
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                      
                     <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
  <Box sx={{ flex: 1 }}>
    <TextField
      fullWidth
      label="Password"
      type={showPassword ? 'text' : 'password'}
      placeholder="Enter password (min 8 characters)"
      value={formData.password}
      onChange={handlePasswordChange}
      required={dialogMode === 'add'}
      disabled={dialogMode === 'view'}
      helperText={dialogMode === 'edit' ? 'Leave empty to keep current password' : ''}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Security color="action" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
              disabled={dialogMode === 'view'}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
        autoComplete: 'new-password',
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
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

  <Box sx={{ flex: 1 }} />
</Box>

                    </Box>
                  </Box>

                  {/* Journey & Group Configuration */}
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
                      <DirectionsWalk sx={{ color: '#2e7d32', fontSize: 28 }} />
                      Journey & Group Configuration
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
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                          <FormControl 
                            fullWidth 
                            disabled={dialogMode === 'view'}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                minHeight: 56,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                              '& .MuiSelect-select': {
                                padding: '16px 14px',
                                display: 'flex',
                                alignItems: 'center',
                              },
                            }}
                          >
                            <InputLabel>Journey Status</InputLabel>
                            <Select
                              value={formData.pathayathiraiStatus}
                              label="Journey Status"
                              onChange={handleStatusChange}
                              renderValue={(selected) => {
                                const statusMap = {
                                  'not_started': { label: 'Not Started', color: '#9e9e9e' },
                                  'in_progress': { label: 'In Progress', color: '#4caf50' },
                                  'completed': { label: 'Completed', color: '#2196f3' }
                                };
                                const status = statusMap[selected as keyof typeof statusMap];
                                return status ? (
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box 
                                      sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        borderRadius: '50%', 
                                        backgroundColor: status.color 
                                      }} 
                                    />
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {status.label}
                                    </Typography>
                                  </Box>
                                ) : selected;
                              }}
                            >
                              <MenuItem value="not_started" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#9e9e9e' 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      Not Started
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Ready to begin spiritual journey
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                              <MenuItem value="in_progress" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#4caf50' 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      In Progress
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Currently on pathayathirai
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                              <MenuItem value="completed" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#2196f3' 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      Completed
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Journey completed successfully
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <FormControl 
                            fullWidth 
                            disabled={dialogMode === 'view' || groupsLoading}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                minHeight: 56,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3b82f6',
                                  borderWidth: 2,
                                },
                              },
                              '& .MuiSelect-select': {
                                padding: '16px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: '24px',
                              },
                              '& .MuiInputLabel-root': {
                                backgroundColor: 'white',
                                padding: '0 8px',
                                fontSize: '0.875rem',
                                '&.Mui-focused': {
                                  color: '#2e7d32',
                                },
                              },
                              '& .MuiInputLabel-shrink': {
                                transform: 'translate(14px, -9px) scale(0.75)',
                              },
                            }}
                          >
                            <InputLabel>Choose Group or Travel Type</InputLabel>
                            <Select
                              value={formData.groupId || ''}
                              label="Choose Group or Travel Type"
                              onChange={handleGroupChange}
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return '';
                                }
                                const selectedGroup = groups.find(g => g._id === selected);
                                return selectedGroup ? (
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Groups sx={{ color: '#1976d2', fontSize: 20 }} />
                                    <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                                      {selectedGroup.name}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Person sx={{ color: '#757575', fontSize: 20 }} />
                                    <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                                      Single Traveler
                                    </Typography>
                                  </Box>
                                );
                              }}
                            >
                              <MenuItem value="" sx={{ py: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Person 
                                    sx={{ 
                                      color: '#757575', 
                                      fontSize: 20 
                                    }} 
                                  />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      Single Traveler
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Travel individually without a group
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                              {groups.map((group) => (
                                <MenuItem key={group._id} value={group._id} sx={{ py: 2 }}>
                                  <Box display="flex" alignItems="center" gap={2} width="100%">
                                    <Groups 
                                      sx={{ 
                                        color: '#1976d2', 
                                        fontSize: 20 
                                      }} 
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {group.name}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {group.memberCount} of {group.maxMembers} members
                                      </Typography>
                                    </Box>
                                    <Chip 
                                      label={`${group.memberCount}/${group.maxMembers}`} 
                                      size="small" 
                                      color={group.memberCount < group.maxMembers ? "success" : "warning"}
                                      variant="outlined"
                                      sx={{ ml: 1 }}
                                    />
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {groupsLoading && (
                            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="textSecondary">
                                Loading groups...
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Account Settings */}
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        mb: 1, 
                        color: '#c62828',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <ManageAccounts sx={{ color: '#c62828', fontSize: 28 }} />
                      Account Settings
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
                    
                    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                      <Box sx={{ flex: 1 }}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #e9ecef',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f1f3f4',
                              borderColor: '#3b82f6',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isActive}
                                onChange={handleActiveChange}
                                disabled={dialogMode === 'view'}
                                color="success"
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#4caf50',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#4caf50',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Active User
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  User can access the application
                                </Typography>
                              </Box>
                            }
                          />
                        </Card>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #e9ecef',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f1f3f4',
                              borderColor: '#3b82f6',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isAdmin}
                                onChange={handleAdminChange}
                                disabled={dialogMode === 'view'}
                                color="primary"
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#c62828',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#c62828',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Admin User
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Has administrative privileges
                                </Typography>
                              </Box>
                            }
                          />
                        </Card>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            gap: 2,
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              startIcon={<Cancel />}
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
              {dialogMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {dialogMode !== 'view' && (
              <Button 
                onClick={handleFormSubmit}
                variant="contained"
                startIcon={<Save />}
                disabled={formLoading}
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
              >
                {formLoading ? <CircularProgress size={20} /> : (dialogMode === 'add' ? 'Create User' : 'Update User')}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={cancelDeleteUser}
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
                {isPermanentDelete ? 'Permanently Delete User' : 'Move User to Deleted'}
            </Box> 
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {isPermanentDelete 
                ? 'Are you sure you want to permanently remove this user from the database?'
                : 'Are you sure you want to move this user to the deleted users list?'
              }
            </Typography>
          
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={cancelDeleteUser}
              variant="outlined"
              size="large"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                minWidth: 100,
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteUser}
              variant="contained"
              color="error"
              size="large"
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
                    {isPermanentDelete ? 'Deleting...' : 'Deleting...'}
                  </Typography>
                </Box>
              ) : (
                isPermanentDelete ? 'Delete' : 'Delete'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Options Menu */}
        <Menu
          anchorEl={deleteMenuAnchor}
          open={Boolean(deleteMenuAnchor)}
          onClose={handleDeleteMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #e5e7eb',
              minWidth: 220,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={handleSoftDelete}
            sx={{ 
              py: 1.5, 
              px: 2,
              '&:hover': { 
                backgroundColor: '#fff7ed',
                color: '#ea580c'
              }
            }}
          >
            <ListItemIcon>
              <DeleteOutline sx={{ color: '#ea580c' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Move to Deleted"
              secondary="User can be restored later"
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </MenuItem>
          
          <MenuItem 
            onClick={handleHardDelete}
            sx={{ 
              py: 1.5, 
              px: 2,
              '&:hover': { 
                backgroundColor: '#fef2f2',
                color: '#dc2626'
              }
            }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Permanently"
              secondary="Cannot be undone"
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </MenuItem>
        </Menu>

      </Box>
    </AdminLayout>
  );
}
