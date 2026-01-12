'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter } from 'iconoir-react';
import { Pagination, PaginationItem } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  InputAdornment,
  Skeleton,
  Avatar,
  TablePagination,
  Collapse,
  Menu
} from '@mui/material';
import {
  PhoneAndroid,
  Apple,
  Android,
  Refresh,
  Search,
  Download,
  Close,
  Visibility,
  GetApp,
  ShoppingCart,
  FilterList,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  PictureAsPdf,
  OpenInNew,
  RestartAlt,
} from '@mui/icons-material';
import { notifications } from '@mantine/notifications';

import AdminLayout from '@/components/admin/AdminLayout';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';

interface Device {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  username: string;
  mobileNumber: string;
  deviceModel: string;
  deviceId: string;
  ipAddress: string;
  installationSource: 'playstore' | 'appstore' | 'sideload' | 'unknown';
  installationSourceDisplay: string;
  platform: 'android' | 'ios';
  platformDisplay: string;
  appVersion: string;
  osVersion: string;
  deviceInfo: {
    brand?: string;
    manufacturer?: string;
    screenResolution?: string;
    batteryLevel?: number;
    isRooted?: boolean;
    isJailbroken?: boolean;
  };
  location?: {
    country?: string;
    state?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  firstInstallDate: string;
  lastActiveDate: string;
  isActive: boolean;
  uninstallDate?: string;
  totalSessions: number;
  createdAt: string;
  updatedAt: string;
}

interface DeviceAnalytics {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  androidDevices: number;
  iosDevices: number;
  playstoreInstalls: number;
  appstoreInstalls: number;
  totalSessions: number;
  averageSessions: number;
  recentInstalls: number;
}

interface DevicesResponse {
  success: boolean;
  data: {
    devices: Device[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    analytics: DeviceAnalytics;
  };
  error?: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DeviceAnalytics>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    androidDevices: 0,
    iosDevices: 0,
    playstoreInstalls: 0,
    appstoreInstalls: 0,
    totalSessions: 0,
    averageSessions: 0,
    recentInstalls: 0
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    search: '',
    platform: '',
    installationSource: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  // Local temp filters so typing doesn't trigger fetch until user clicks Filter
  const [tempFilters, setTempFilters] = useState({
    search: '',
    platform: '',
    installationSource: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDeviceForMenu, setSelectedDeviceForMenu] = useState<Device | null>(null);

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

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', (page + 1).toString());
      params.set('limit', rowsPerPage.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.platform) params.set('platform', filters.platform);
      if (filters.installationSource) params.set('installationSource', filters.installationSource);
      if (filters.isActive) params.set('isActive', filters.isActive);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

      console.debug('Fetching devices with params:', params.toString());
      const response = await fetch(`/api/admin/devices?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DevicesResponse = await response.json();

      if (data.success) {
        setDevices(data.data.devices);
        setPagination(data.data.pagination);
        setAnalytics(data.data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch devices');
      }
    } catch (error: any) {
      console.error('Fetch devices error:', error);
      showNotification(error.message || 'Failed to fetch devices', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);


  // Immediate fetch helper that accepts filters and page overrides
  const fetchDevicesWith = useCallback(async (useFilters: typeof filters, usePage: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', (usePage + 1).toString());
      params.set('limit', rowsPerPage.toString());
      if (useFilters.search) params.set('search', useFilters.search);
      if (useFilters.platform) params.set('platform', useFilters.platform);
      if (useFilters.installationSource) params.set('installationSource', useFilters.installationSource);
      if (useFilters.isActive) params.set('isActive', useFilters.isActive);
      if (useFilters.sortBy) params.set('sortBy', useFilters.sortBy);
      if (useFilters.sortOrder) params.set('sortOrder', useFilters.sortOrder);

      console.debug('Immediate fetch devices with params:', params.toString());

      const response = await fetch(`/api/admin/devices?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DevicesResponse = await response.json();

      if (data.success) {
        setDevices(data.data.devices);
        setPagination(data.data.pagination);
        setAnalytics(data.data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch devices');
      }
    } catch (error: any) {
      console.error('Fetch devices error:', error);
      showNotification(error.message || 'Failed to fetch devices', 'error');
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

   useEffect(() => {
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, 4000); // 3 seconds
  
      return () => clearTimeout(timer);
    }, []);

const handleFilterChange = (field: string, value: string) => {
  setTempFilters(prev => ({ ...prev, [field]: value }));
};


  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDevice = (device: Device) => {
    setSelectedDevice(device);
    setViewDialogOpen(true);
  };

  const getPlatformIcon = (platform: string) => {
    return platform.toLowerCase() === 'android' ? 
      <Android sx={{ color: '#4CAF50' }} /> : 
      <Apple sx={{ color: 'black' }} />;
  };

  const getPlatformChip = (platform: string) => {
    const isAndroid = platform.toLowerCase() === 'android';
    return (
      <Chip
        icon={isAndroid ? <Android sx={{ color: 'white !important' }} /> : <Apple sx={{ color: 'white !important' }} />}
        label={isAndroid ? 'Android' : 'iOS'}
        size="small"
        variant="filled"
        sx={{
          backgroundColor: isAndroid ? '#4CAF50' : '#000000',
          color: 'white',
          fontWeight: 600,
          height: '34px',
          minWidth: '100px',
          borderRadius: 2.5,
          fontSize: '0.8rem',
          '& .MuiChip-icon': {
            color: 'white !important',
          },
          '&:hover': {
            backgroundColor: isAndroid ? '#388E3C' : '#333333',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      />
    );
  };

  const getStatusChip = (isActive: boolean) => {
    return (
      <Chip
        icon={isActive ? <CheckCircle sx={{ color: 'white !important' }} /> : <Cancel sx={{ color: 'white !important' }} />}
        label={isActive ? 'Active' : 'Inactive'}
        size="small"
        variant="filled"
        sx={{
          backgroundColor: isActive ? '#22c55e' : '#ef4444',
          color: 'white',
          fontWeight: 600,
          height: '34px',
          minWidth: 110,
           borderRadius: 2.5,
          fontSize: '0.8rem',
          '& .MuiChip-icon': {
            color: 'white !important',
          },
          '&:hover': {
            backgroundColor: isActive ? '#16a34a' : '#dc2626',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      />
    );
  };

  const getInstallationSourceIcon = (source: string) => {
    switch (source) {
      case 'playstore':
        return <GetApp />;
      case 'appstore':
        return <ShoppingCart />;
      default:
        return <Download />;
    }
  };

  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getSourceChip = (device: Device) => {
    const getSourceIcon = () => {
      switch (device.installationSource) {
        case 'playstore':
          return <GetApp sx={{ color: 'white !important' }} />;
        case 'appstore':
          return <ShoppingCart sx={{ color: 'white !important' }} />;
        default:
          return <Download sx={{ color: 'white !important' }} />;
      }
    };

    const getSourceColor = () => {
      switch (device.installationSource) {
        case 'playstore':
          return '#4CAF50';
        case 'appstore':
          return '#007AFF';
        default:
          return '#FF9800';
      }
    };

    const handleDownloadClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setMenuAnchor(e.currentTarget);
      setSelectedDeviceForMenu(device);
    };

// removed local handlers to avoid shadowing component handlers


    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
       
        <Tooltip title="View/Download Device Report" arrow>
          <IconButton
            size="small"
            onClick={handleDownloadClick}
            sx={{
              backgroundColor: '#667eea',
              color: 'white',
              width: '32px',
              height: '32px',
              '&:hover': {
                backgroundColor: '#5a67d8',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <Download sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDeviceForMenu(null);
  };

  const handleViewReport = () => {
    if (selectedDeviceForMenu) {
      viewDeviceReport(selectedDeviceForMenu);
    }
    handleMenuClose();
  };

  const handleDownloadReport = () => {
    if (selectedDeviceForMenu) {
      generateDevicePDF(selectedDeviceForMenu);
    }
    handleMenuClose();
  };

  const viewDeviceReport = (device: Device) => {
    try {
      // Create the same HTML content as PDF but open in new window for viewing
      const reportContent = generateReportHTML(device);
      
      // Open in new window for viewing
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(reportContent);
        newWindow.document.close();
        
        showNotification(`Device report opened for ${device.username}`, 'success');
      } else {
        showNotification('Please allow popups to view the report', 'error');
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      showNotification('Failed to view device report', 'error');
    }
  };

  const generateReportHTML = (device: Device) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Device Report - ${device.username}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8f9fa; 
            color: #333;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 15px; 
            text-align: center; 
            margin-bottom: 30px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          }
          .header h1 { 
            margin: 0; 
            font-size: 2.5em; 
            font-weight: 700; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            font-size: 1.2em; 
            opacity: 0.9; 
          }
          .section { 
            background: white; 
            margin: 20px 0; 
            padding: 25px; 
            border-radius: 15px; 
            border-left: 5px solid #667eea;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .section h2 { 
            color: #667eea; 
            margin-top: 0; 
            font-size: 1.5em; 
            border-bottom: 2px solid #e9ecef; 
            padding-bottom: 10px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 15px; 
          }
          .info-item { 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 10px; 
            border: 1px solid #e9ecef; 
          }
          .info-item strong { 
            color: #495057; 
            display: block; 
            margin-bottom: 5px; 
            font-size: 0.9em; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .info-item span { 
            color: #212529; 
            font-size: 1.1em; 
            font-weight: 600; 
          }
          .status-active { 
            background: #d4edda; 
            color: #155724; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold; 
            display: inline-block; 
          }
          .status-inactive { 
            background: #f8d7da; 
            color: #721c24; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold; 
            display: inline-block; 
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding: 20px; 
            color: #6c757d; 
            border-top: 2px solid #e9ecef; 
          }
          .platform-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            color: white;
          }
          .android { background: #4CAF50; }
          .ios { background: #000000; }
          @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Device Report</h1>
          <p>Comprehensive Device Information for ${device.username}</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div class="section">
          <h2>📱 Device Overview</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Device Model</strong>
              <span>${device.deviceModel}</span>
            </div>
            <div class="info-item">
              <strong>Platform</strong>
              <span class="platform-badge ${device.platform}">${device.platform === 'ios' ? 'iOS' : 'Android'}</span>
            </div>
            <div class="info-item">
              <strong>Status</strong>
              <span class="${device.isActive ? 'status-active' : 'status-inactive'}">
                ${device.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div class="info-item">
              <strong>Device ID</strong>
              <span style="font-family: monospace;">${device.deviceId}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>👤 User Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Username</strong>
              <span>${device.username}</span>
            </div>
            <div class="info-item">
              <strong>Mobile Number</strong>
              <span>${device.mobileNumber}</span>
            </div>
            <div class="info-item">
              <strong>Email</strong>
              <span>${device.userId?.email || 'N/A'}</span>
            </div>
            <div class="info-item">
              <strong>User Role</strong>
              <span>${device.userId?.role || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>⚙️ Technical Specifications</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>OS Version</strong>
              <span>${device.osVersion}</span>
            </div>
            <div class="info-item">
              <strong>App Version</strong>
              <span>v${device.appVersion}</span>
            </div>
            <div class="info-item">
              <strong>IP Address</strong>
              <span style="font-family: monospace;">${device.ipAddress}</span>
            </div>
            <div class="info-item">
              <strong>Installation Source</strong>
              <span>${device.installationSourceDisplay}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📊 Usage Analytics</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Total Sessions</strong>
              <span>${device.totalSessions}</span>
            </div>
            <div class="info-item">
              <strong>First Install Date</strong>
              <span>${new Date(device.firstInstallDate).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <strong>Last Active Date</strong>
              <span>${new Date(device.lastActiveDate).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <strong>Account Created</strong>
              <span>${new Date(device.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        ${device.deviceInfo ? `
        <div class="section">
          <h2>🔧 Device Details</h2>
          <div class="info-grid">
            ${device.deviceInfo.brand ? `
            <div class="info-item">
              <strong>Brand</strong>
              <span>${device.deviceInfo.brand}</span>
            </div>` : ''}
            ${device.deviceInfo.manufacturer ? `
            <div class="info-item">
              <strong>Manufacturer</strong>
              <span>${device.deviceInfo.manufacturer}</span>
            </div>` : ''}
            ${device.deviceInfo.screenResolution ? `
            <div class="info-item">
              <strong>Screen Resolution</strong>
              <span>${device.deviceInfo.screenResolution}</span>
            </div>` : ''}
            ${device.deviceInfo.batteryLevel ? `
            <div class="info-item">
              <strong>Battery Level</strong>
              <span>${device.deviceInfo.batteryLevel}%</span>
            </div>` : ''}
          </div>
        </div>` : ''}

        ${device.location ? `
        <div class="section">
          <h2>📍 Location Information</h2>
          <div class="info-grid">
            ${device.location.country ? `
            <div class="info-item">
              <strong>Country</strong>
              <span>${device.location.country}</span>
            </div>` : ''}
            ${device.location.state ? `
            <div class="info-item">
              <strong>State</strong>
              <span>${device.location.state}</span>
            </div>` : ''}
            ${device.location.city ? `
            <div class="info-item">
              <strong>City</strong>
              <span>${device.location.city}</span>
            </div>` : ''}
            ${device.location.coordinates ? `
            <div class="info-item">
              <strong>Coordinates</strong>
              <span>${device.location.coordinates.latitude}, ${device.location.coordinates.longitude}</span>
            </div>` : ''}
          </div>
        </div>` : ''}

        <div class="footer">
          <p><strong>Device Management System</strong></p>
          <p>This report contains confidential information. Handle with care.</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateDevicePDF = (device: Device) => {
    try {
      // Create PDF content using the same HTML generator
      const pdfContent = generateReportHTML(device);

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `device-report-${device.username}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Device report downloaded for ${device.username}`, 'success');

    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Failed to generate device report', 'error');
    }
  };

    const [showSearchFilter, setShowSearchFilter] = useState(false);
  

  function handleApplyFilters(event?: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event?.preventDefault();
    // apply tempFilters to filters; effect will fetch
    console.debug('Applying filters:', tempFilters);
    setFilters({ ...tempFilters });
    // also trigger an immediate fetch to avoid timing issues
    fetchDevicesWith({ ...tempFilters }, 0).catch(() => {});
  }

  function handleResetFilters(event?: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event?.preventDefault();
    const cleared = {
      search: '',
      platform: '',
      installationSource: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setTempFilters(cleared);
    setFilters(cleared);
  }

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
                      Loading Device..
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
        {/* Analytics Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3
        }}>
          <Card sx={{
            background: `linear-gradient(135deg, #667eea15 0%, #667eea25 100%)`,
            border: `1px solid #667eea30`,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            borderRadius: '12px',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 0 20px #2196F3, 0 8px 25px #667eea25`,
              border: `1px solid #667eea50`,
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#667eea">
                    {analytics.totalDevices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Devices
                  </Typography>
                </Box>
                <Box sx={{ color: '#667eea', opacity: 0.8 }}>
                  <PhoneAndroid sx={{ fontSize: 38 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
          background: `linear-gradient(135deg, #667eea15 0%, #667eea25 100%)`,
            border: `1px solid #4CAF5030`,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            borderRadius: '12px',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 0 20px #2196F3, 0 8px 25px #4CAF5025`,
              border: `1px solid #4CAF5050`,
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#667eea">
                    {analytics.activeDevices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Devices
                  </Typography>
                </Box>
                <Box sx={{ color: '#667eea', opacity: 0.8 }}>
                  <Visibility sx={{ fontSize: 38 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            background: `linear-gradient(135deg, #2196F315 0%, #2196F325 100%)`,
            border: `1px solid #2196F330`,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            borderRadius: '12px',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 0 20px #2196F3, 0 8px 25px #2196F325`,
              border: `1px solid #2196F350`,
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#2196F3">
                    {analytics.androidDevices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Android Devices
                  </Typography>
                </Box>
                <Box sx={{ color: '#2196F3', opacity: 0.8 }}>
                  <Android sx={{ fontSize: 38 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
           background: `linear-gradient(135deg, #667eea15 0%, #667eea25 100%)`,
            border: `1px solid #FF980030`,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            borderRadius: '12px',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 0 20px #2196F3, 0 8px 25px #FF980025`,
              border: `1px solid #FF980050`,
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="#667eea">
                    {analytics.iosDevices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    iOS Devices
                  </Typography>
                </Box>
                <Box sx={{ color: '#667eea', opacity: 0.8 }}>
                  <Apple sx={{ fontSize: 38 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

      {/* Devices Table */}
      <Card>
      <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
               <IconButton
                  onClick={() => setShowFilters(!showFilters)}
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
              Device Management
              </Typography>
            </Box>
           
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
               <Button 
                               variant="outlined" 
                               onClick={fetchDevices}
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

        {/* Filters inside the table card */}
        <Collapse in={showFilters} timeout="auto" unmountOnExit>
            <Box
  mb={3}
  sx={{
    backgroundColor: '#f8fafc',
    borderRadius: 2,
    p: 3,
    border: '1px solid #e2e8f0',
  }}
>
  {/* HEADER */}
  <Typography
    variant="h6"
    sx={{ mb: 2, color: '#7353ae', fontWeight: 'bold' }}
  >
    Filter Devices
  </Typography>

  {/* ================= TOP ROW : FIELDS ================= */}
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      width: '100%',
    }}
  >
    {/* SEARCH */}
    <TextField
      fullWidth
      placeholder="Search devices..."
      value={tempFilters.search}
      onChange={(e) => handleFilterChange('search', e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
      }}
      sx={{
        flex: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: '#fff',

          '& fieldset': {
            borderColor: '#cbd5e1',
          },
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

    {/* PLATFORM */}
    <FormControl
      sx={{
        flex: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: '#fff',

          '& fieldset': {
            borderColor: '#cbd5e1',
          },
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
      <InputLabel>Platform</InputLabel>
      <Select
        value={tempFilters.platform}
        label="Platform"
        onChange={(e) => handleFilterChange('platform', e.target.value)}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="android">Android</MenuItem>
        <MenuItem value="ios">iOS</MenuItem>
      </Select>
    </FormControl>

    {/* STATUS */}
    <FormControl
      sx={{
        flex: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: '#fff',

          '& fieldset': {
            borderColor: '#cbd5e1',
          },
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
      <InputLabel>Status</InputLabel>
      <Select
        value={tempFilters.isActive}
        label="Status"
        onChange={(e) => handleFilterChange('isActive', e.target.value)}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="true">Active</MenuItem>
        <MenuItem value="false">Inactive</MenuItem>
      </Select>
    </FormControl>
  </Box>

  {/* ================= BOTTOM ROW : BUTTONS ================= */}
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 1.5,
      mt: 3,
    }}
  >
    <Button
      variant="outlined"
      onClick={handleResetFilters}
      startIcon={<RestartAlt />}
      sx={{
        height: 40,
        borderColor: '#667eea',
        color: '#667eea',
        '&:hover': {
          borderColor: '#5a6fd8',
          backgroundColor: '#667eea10',
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
        height: 40,
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

        </Collapse>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Platform</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sessions</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Active</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(5)).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from(new Array(10)).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" width={100} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                    <PhoneAndroid sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No devices found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device, index) => (
                  <TableRow key={device._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: '#667eea' }}>
                          {device.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {device.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {device.mobileNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {device.deviceModel}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        v{device.appVersion}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {getPlatformChip(device.platform)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {getSourceChip(device)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {device.ipAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {getStatusChip(device.isActive)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.totalSessions}
                        size="small"
                        sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                      />
                    </TableCell>
                    <TableCell>
                     <Typography variant="body2">
  {formatDate(device.lastActiveDate ?? device.updatedAt)}
</Typography>

                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDevice(device)}
                        sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </TableContainer>

          <Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    mt: 3,
  }}
>
  <Pagination
    page={page + 1}
    count={pagination.totalPages}
    onChange={(_, value) => setPage(value - 1)}
    shape="rounded"
    renderItem={(item) => (
      <PaginationItem
        {...item}
        slots={{
          previous: ChevronLeft,
          next: ChevronRight,
        }}
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

        </CardContent>
         </Card>

      {/* Device Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          py: 2,
          position: 'relative',
          marginBottom:"2.5%"
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Device Details
            </Typography>
          </Box>
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, backgroundColor: '#ffffff' }}>
          {selectedDevice && (
            <Box>
              {/* Device Header */}
              <Box sx={{ 
                textAlign: 'center', 
                mb: 4, 
                p: 3, 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                border: '1px solid #667eea20'
              }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  backgroundColor: '#667eea',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  {selectedDevice.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                  {selectedDevice.username}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                  {getPlatformIcon(selectedDevice.platform)}
                  <Typography variant="body2" color="text.secondary">
                    {selectedDevice.deviceModel}
                  </Typography>
                </Box>
                {getStatusChip(selectedDevice.isActive)}
              </Box>

              {/* Information Cards */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3
              }}>
                {/* User Information */}
                <Card sx={{ 
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                        <PhoneAndroid />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        User Information
                      </Typography>
                    </Box>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          Name:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {selectedDevice.username}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          Mobile:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {selectedDevice.mobileNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          Email:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {selectedDevice.userId?.email || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Device Information */}
                <Card sx={{ 
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2 }}>
                        {getPlatformIcon(selectedDevice.platform)}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        Device Information
                      </Typography>
                    </Box>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          Model:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {selectedDevice.deviceModel}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          Platform:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {selectedDevice.platform === 'ios' ? 'iOS' : 'Android'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          OS Version:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {selectedDevice.osVersion}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          App Version:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          v{selectedDevice.appVersion}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Network Information */}
                <Card sx={{ 
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ backgroundColor: '#8b5cf6', mr: 2 }}>
                        <Download />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        Network Information
                      </Typography>
                    </Box>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          IP Address:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1, fontFamily: 'monospace' }}>
                          {selectedDevice.ipAddress}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 80 }}>
                          Source:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                          {getInstallationSourceIcon(selectedDevice.installationSource)}
                          <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                            {selectedDevice.installationSourceDisplay}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card sx={{ 
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ backgroundColor: '#f59e0b', mr: 2 }}>
                        <Visibility />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                        Usage Statistics
                      </Typography>
                    </Box>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 100 }}>
                          Total Sessions:
                        </Typography>
                        <Chip
                          label={selectedDevice.totalSessions}
                          size="small"
                          sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600, ml: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 100 }}>
                          Status:
                        </Typography>
                        <Box sx={{ ml: 1 }}>
                          {getStatusChip(selectedDevice.isActive)}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 100 }}>
                          First Install:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {new Date(selectedDevice.firstInstallDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6b7280', minWidth: 100 }}>
                          Last Active:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', ml: 1 }}>
                          {new Date(selectedDevice.lastActiveDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <Button 
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: '#667eea',
              color: 'white',
              px: 4,
              py: 1,
              borderRadius: '8px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#5a67d8',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
            border: '1px solid #e5e7eb',
            mt: 1,
          }
        }}
      >
        <MenuItem
          onClick={handleViewReport}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              backgroundColor: '#f8f9fa',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <OpenInNew sx={{ fontSize: 20, color: '#667eea' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                View Report
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Open in new window
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <MenuItem
          onClick={handleDownloadReport}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              backgroundColor: '#f8f9fa',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Download sx={{ fontSize: 20, color: '#22c55e' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                Download Report
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Save as HTML file
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Menu>

        
      </Box>
    </AdminLayout>
  );
}
