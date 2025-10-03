'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
  Collapse,
  Tooltip,
  Slider,
  Popover,
  Modal,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Menu as MenuIcon,
  Dashboard,
  AccountBalance as Temple,
  Restaurant,
  Home,
  MusicNote,
  PhotoLibrary,
  Campaign,
  People,
  LocationOn,
  Logout,
  AccountCircle,
  Analytics,
  Group,
  FilterList,
  ExpandLess,
  ExpandMore,
  Settings,
  Security,
  Notifications,
  CloudUpload,
  Assessment,
  Public,
  LocationCity,
  Place,
  DeleteForever,
  Groups,
  DarkMode,
  LightMode,
  DashboardCustomize,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  TextFields,
  PhoneAndroid,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeRegistry from '@/components/ThemeRegistry';
import LocationSidebar from '@/components/LocationSidebar';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';
import ChaletIcon from '@mui/icons-material/Chalet';
import DifferenceIcon from '@mui/icons-material/Difference';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ApartmentIcon from '@mui/icons-material/Apartment';
import NavigationIcon from '@mui/icons-material/Navigation';

const drawerWidth = 320;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
  { text: 'Live Tracking', icon: <LocationOn />, path: '/admin/tracking' },
  { 
    text: 'User Management', 
    icon: <ManageAccountsIcon/>, 
    children: [
      { text: 'Users', icon: <AccountCircle/>, path: '/admin/users' },
      { text: 'Groups', icon: <Groups />, path: '/admin/groups' },
      { text: 'User Analytics', icon: <Assessment />, path: '/admin/user-analytics' },
    ]
  },
  { 
    text: 'Places Management', 
    icon: <Temple />, 
    children: [
      { text: 'Temples', icon: <TempleHinduIcon />, path: '/admin/temples' },
      { text: 'Annadhanam', icon: <Restaurant />, path: '/admin/annadhanam' },
      { text: 'Madangal (Stay)', icon: <ChaletIcon/>, path: '/admin/madangal' },
    ]
  },
  { 
    text: 'Content Management', 
    icon: <DifferenceIcon />, 
    children: [
      { text: 'Songs', icon: <MusicNote />, path: '/admin/songs' },
      { text: 'Gallery', icon: <PhotoLibrary />, path: '/admin/gallery' },
      { text: 'Announcements', icon: <Campaign />, path: '/admin/announcements' },
    ]
  },
  { 
    text: 'Location Management', 
    icon: <NavigationIcon />, 
    children: [
      { text: 'Country', icon: <Public />, path: '/admin/location/country' },
      { text: 'State', icon: <ApartmentIcon />, path: '/admin/location/state' },
      { text: 'City', icon: <LocationCityIcon />, path: '/admin/location/city' },
    ]
  },
  { 
    text: 'System Management', 
    icon: <Settings />, 
    children: [
      { text: 'Security', icon: <Security />, path: '/admin/security' },
      { text: 'Notifications', icon: <Notifications />, path: '/admin/notifications' },
      { text: 'Device Management', icon: <PhoneAndroid />, path: '/admin/devices' },
      { text: 'User Support', icon: <Campaign />, path: '/admin/user-support' },
      { text: 'Deleted Users', icon: <DeleteForever />, path: '/admin/users/deleted' },
    ]
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [locationSidebarOpen, setLocationSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    country?: string;
    state?: string;
    city?: string;
  }>({});
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<null | HTMLElement>(null);
  const [shortcutsAnchorEl, setShortcutsAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  


  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.isAdmin) {
        router.push('/admin/login');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      router.push('/admin/login');
    }
  }, [router]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

 
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    toast.success('Logged out successfully! See you soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setTimeout(() => {
      router.push('/admin/login');
    }, 1500);
  };

  const handleLocationSidebarToggle = useCallback(() => {
    setLocationSidebarOpen(prev => !prev);
  }, []);

  const handleLocationSelect = useCallback((location: { country?: string; state?: string; city?: string }) => {
    setSelectedLocation(location);
  }, []);

  const handleMenuToggle = useCallback((menuText: string) => {
    setOpenMenus(prev => {
      const isCurrentlyOpen = prev[menuText];
      
      // If clicking on an already open menu, close it
      if (isCurrentlyOpen) {
        return {
          ...prev,
          [menuText]: false
        };
      }
      
      // Close all other menus and open the clicked one
      const newOpenMenus: { [key: string]: boolean } = {};
      Object.keys(prev).forEach(key => {
        newOpenMenus[key] = false;
      });
      newOpenMenus[menuText] = true;
      
      return newOpenMenus;
    });
  }, []);

  const handleClearLocation = useCallback(() => {
    setSelectedLocation({});
  }, []);

  const handleDarkModeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev);
    // Here you can add logic to actually toggle the theme
  }, []);

  const handleZoomChange = useCallback((event: Event, newValue: number | number[]) => {
    const zoom = newValue as number;
    setZoomLevel(zoom);
    document.body.style.zoom = `${zoom}%`;
  }, []);

  const handleZoomPopoverOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setZoomAnchorEl(event.currentTarget);
  }, []);

  const handleZoomPopoverClose = useCallback(() => {
    setZoomAnchorEl(null);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleKeyboardShortcuts = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setShortcutsAnchorEl(event.currentTarget);
  }, []);

  const handleShortcutsClose = useCallback(() => {
    setShortcutsAnchorEl(null);
  }, []);

  const isMenuItemActive = useCallback((item: any) => {
    if (item.path) {
      return pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child: any) => pathname === child.path);
    }
    return false;
  }, [pathname]);

  const currentPageTitle = useMemo(() => {
    for (const item of menuItems) {
      if (item.path === pathname) {
        return item.text;
      }
      if (item.children) {
        const subItem = item.children.find((child: any) => child.path === pathname);
        if (subItem) {
          return subItem.text;
        }
      }
    }
    return 'Admin Panel';
  }, [pathname]);

  const drawer = (
    <Box sx={{ 
      width: drawerWidth, 
      height: '100%', 
      overflow: 'hidden',
      background: '#f4f5fa',
      position: 'relative',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
      borderRight: '8px solid #f4f5fa', // Yellow right border
      fontFamily: 'Inter, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      fontWeight: 400,
      fontSize: '1rem',
    }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          p: 2.5,
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(255,255,255,0.05) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Logo and Name Side by Side - Right Aligned */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 1,
            }}
          >
            {/* Logo Container */}
            <Box
              sx={{
                width: 50,
                height: 50,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s ease',
                },
                '&:hover': {
                  transform: 'scale(1.05) rotateY(5deg)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  '&::before': {
                    transform: 'translateX(100%)',
                  }
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: 'white',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))',
                  fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: '1px',
                }}
              >
                P
              </Typography>
            </Box>
            
            {/* Title and Subtitle Container */}
            <Box sx={{ textAlign: 'left' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.3px',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  lineHeight: 1.2,
                  fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                }}
              >
                Pathayathirai
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  letterSpacing: '0.2px',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  opacity: 0.9,
                  lineHeight: 1,
                }}
              >
                Management System
              </Typography>
            </Box>
          </Box>
          
        </Box>
      </Box>
      
      {/* Menu Items Container */}
      <Box sx={{ 
        height: 'calc(100vh - 100px)', 
        overflow: 'auto', 
        width: drawerWidth,
        background: '#f4f5fa',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '3px',
          '&:hover': {
            background: 'linear-gradient(180deg, #5a6fd8 0%, #6a4190 100%)',
          }
        },
      }}>
        <List sx={{ 
          px: 2, 
          py: 2, 
          width: '100%', 
          ml: -4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2, // Add gap between menu items
        }}>
          {menuItems.map((item) => (
            <Box key={item.text} sx={{ width: '100%', mb: 1 }}>
              {/* Main Menu Item */}
              <ListItem disablePadding sx={{ mb: 0.5, width: '100%' }}>
                <ListItemButton
                  {...(item.path ? { component: Link, href: item.path } : {})}
                  onClick={item.children ? () => handleMenuToggle(item.text) : undefined}
                  selected={isMenuItemActive(item)}
                  sx={{
                    borderRadius: '0 25px 25px 0', // Only right side border radius
                    width: '100%',
                    maxWidth: `${drawerWidth - 32}px`,
                    minHeight: '48px',
                    ml: 2, // Left margin to push from left side
                    mr: 1, // Right margin
                    background: isMenuItemActive(item) 
                      ? 'linear-gradient(98deg, #C6A7FE, #9155FD 94%)'
                      : 'transparent',
                    border: '1px solid transparent',
                    color: isMenuItemActive(item) ? '#ffffff' : '#333333',
                    boxShadow: isMenuItemActive(item) 
                      ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                      : 'none',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '0 25px 25px 0',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      transform: 'translateZ(-1px)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: 0,
                    },
                    '&:hover': {
                      background: isMenuItemActive(item) 
                        ? 'linear-gradient(98deg, #C6A7FE, #9155FD 94%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      transform: 'translateX(15px) translateY(-6px) rotateY(8deg) scale(1.02)',
                      boxShadow: isMenuItemActive(item)
                        ? '0 15px 35px rgba(102, 126, 234, 0.5), 0 8px 16px rgba(0, 0, 0, 0.1)'
                        : '0 12px 30px rgba(102, 126, 234, 0.25), 0 6px 12px rgba(0, 0, 0, 0.08)',
                      color: isMenuItemActive(item) ? '#ffffff' : '#667eea',
                      '&:before': {
                        opacity: 1,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                        transform: 'translateZ(-1px) scale(1.05)',
                      },
                    },
                    '&:active': {
                      transform: 'translateX(10px) translateY(-3px) rotateY(5deg) scale(1.01)',
                      transition: 'all 0.1s ease',
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                      minWidth: 45,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&:hover .MuiListItemIcon-root': {
                      transform: 'translateZ(10px) scale(1.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 45,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    '& svg': {
                      fontSize: '22px',
                      filter: isMenuItemActive(item) 
                        ? 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))'
                        : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&:hover svg': {
                      transform: 'rotateY(15deg) scale(1.1)',
                      filter: isMenuItemActive(item) 
                        ? 'drop-shadow(0 4px 8px rgba(255, 255, 255, 0.4)) drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))'
                        : 'drop-shadow(0 3px 6px rgba(102, 126, 234, 0.3)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))',
                    }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isMenuItemActive(item) ? 600 : 500,
                      letterSpacing: '0.3px',
                      sx: {
                        textShadow: isMenuItemActive(item) 
                          ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                          : 'none',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        transformStyle: 'preserve-3d',
                        '&:hover': {
                          transform: 'translateZ(5px)',
                          textShadow: isMenuItemActive(item)
                            ? '0 3px 12px rgba(0, 0, 0, 0.2), 0 1px 4px rgba(255, 255, 255, 0.1)'
                            : '0 2px 8px rgba(102, 126, 234, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
                        }
                      }
                    }}
                  />
                  {item.children && (
                    <Box sx={{ 
                      ml: 'auto', 
                      display: 'flex', 
                      alignItems: 'center',
                      background: isMenuItemActive(item) 
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '50%',
                      p: 0.5,
                      transition: 'all 0.3s ease'
                    }}>
                      {openMenus[item.text] ? 
                        <ExpandLess sx={{ fontSize: '18px' }} /> : 
                        <ExpandMore sx={{ fontSize: '18px' }} />
                      }
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>

              {/* Submenu Items */}
              {item.children && (
                <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                  <Box sx={{
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    mx: 1,
                    my: 1,
                    overflow: 'hidden',
                  
                  }}>
                    <List component="div" disablePadding sx={{ width: '100%', py: 1 }}>
                      {item.children.map((subItem: any) => (
                        <ListItem key={subItem.text} disablePadding sx={{ mb: 0.5, width: '100%' }}>
                          <ListItemButton
                            component={Link}
                            href={subItem.path}
                            selected={pathname === subItem.path}
                            sx={{
                              pl: 6, // More left padding for sub-items
                              ml: 3, // Left margin to push from left side
                              mr: 1, // Right margin
                              borderRadius: '0 20px 20px 0', // Only right side border radius
                              minHeight: 40,
                              width: 'calc(100% - 32px)',
                              background: pathname === subItem.path
                                ? 'linear-gradient(98deg, #C6A7FE, #9155FD 94%)'
                                : 'transparent',
                              border: '1px solid transparent',
                              color: pathname === subItem.path ? '#ffffff' : '#555555',
                              '&:hover': {
                                background: pathname === subItem.path
                                  ? 'linear-gradient(98deg, #C6A7FE, #9155FD 94%)'
                                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                                border: '1px solid rgba(102, 126, 234, 0.15)',
                                transform: 'translateX(4px)',
                                color: pathname === subItem.path ? '#ffffff' : '#667eea',
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '& .MuiListItemIcon-root': {
                                color: 'inherit',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ 
                              minWidth: 32,
                              '& svg': {
                                fontSize: '18px',
                                filter: pathname === subItem.path 
                                  ? 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))'
                                  : 'none'
                              }
                            }}>
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={subItem.text}
                              primaryTypographyProps={{
                                fontSize: '0.85rem',
                                fontWeight: pathname === subItem.path ? 600 : 400,
                                letterSpacing: '0.2px',
                                sx: {
                                  textShadow: pathname === subItem.path 
                                    ? '0 2px 6px rgba(0, 0, 0, 0.1)'
                                    : 'none'
                                }
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
      </Box>
    </Box>
  );

  // Shortcuts data
  const shortcuts = [
    { title: 'Users', subtitle: 'User Management', icon: <AccountCircle />, path: '/admin/users' },
    { title: 'Annadhanam', subtitle: 'Food Services', icon: <Restaurant />, path: '/admin/annadhanam' },
    { title: 'Gallery', subtitle: 'Media Management', icon: <PhotoLibrary />, path: '/admin/gallery' },
    { title: 'Tracking', subtitle: 'Location Tracking', icon: <LocationOn />, path: '/admin/tracking' },
    { title: 'Notifications', subtitle: 'System Alerts', icon: <Notifications />, path: '/admin/notifications' },
    { title: 'Devices', subtitle: 'Device Management', icon: <PhoneAndroid />, path: '/admin/devices' },
  ];

  if (!user) {
    return null; // or loading spinner
  }

  return (
    <ThemeRegistry>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            height: '80px',
            zIndex: 1201,
          }}
        >
          <Toolbar sx={{ 
            minHeight: '80px !important', 
            height: '80px',
            justifyContent: 'space-between', 
            px: { xs: 2, md: 4 },
            alignItems: 'center',
            display: 'flex',
          }}>
            {/* Left Section - Mobile Menu & Page Title */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 2, md: 3 },
              flex: 1,
              minWidth: 0, // Allows proper text truncation
            }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                sx={{ 
                  display: { md: 'none' },
                  color: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '16px',
                  padding: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.15)',
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <MenuIcon sx={{ fontSize: '24px' }} />
              </IconButton>

              {/* Page Title - Hidden on mobile */}
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 2,
                flex: 1,
                justifyContent: 'flex-start',
              }}>
              
              </Box>
            </Box>
            
            {/* Right Section - Action Items */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, md: 1.5 },
              borderRadius: '24px',
              px: { xs: 2, md: 3 },
              py: 1.5,
              flexShrink: 0, // Prevent shrinking
            }}>
              {/* Location Filter Display */}
              {(selectedLocation.country || selectedLocation.state || selectedLocation.city) && (
                <Chip
                  label={
                    selectedLocation.city ||
                    selectedLocation.state ||
                    selectedLocation.country ||
                    'Location'
                  }
                  size="small"
                  sx={{ 
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    border: 'none',
                    '& .MuiChip-deleteIcon': {
                      color: 'white',
                      fontSize: '16px',
                      '&:hover': {
                        color: 'rgba(255, 255, 255, 0.8)',
                      }
                    }
                  }}
                  onDelete={handleClearLocation}
                />
              )}

              {/* Action Icons */}
              <Tooltip title="Location Filter" arrow>
                <IconButton
                  onClick={handleLocationSidebarToggle}
                  sx={{ 
                    color: '#667eea',
                    padding: { xs: '8px', md: '10px' },
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '12px',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.15)',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <FilterList sx={{ fontSize: { xs: '18px', md: '20px' } }} />
                </IconButton>
              </Tooltip>

              {/* Hide some icons on mobile for better spacing
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"} arrow>
                  <IconButton
                    onClick={handleDarkModeToggle}
                    sx={{ 
                      color: '#667eea',
                      padding: { xs: '8px', md: '10px' },
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isDarkMode ? <LightMode sx={{ fontSize: { xs: '18px', md: '20px' } }} /> : <DarkMode sx={{ fontSize: { xs: '18px', md: '20px' } }} />}
                  </IconButton>
                </Tooltip>
              </Box> */}

              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Tooltip title="Shortcuts" arrow>
                  <IconButton
                    onClick={handleKeyboardShortcuts}
                    sx={{ 
                      color: '#667eea',
                      padding: '10px',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <DashboardCustomize sx={{ fontSize: '20px' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Tooltip title={`Zoom (${zoomLevel}%)`} arrow>
                  <IconButton
                    onClick={handleZoomPopoverOpen}
                    sx={{ 
                      color: '#667eea',
                      padding: '10px',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <TextFields sx={{ fontSize: '20px' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} arrow>
                  <IconButton
                    onClick={handleFullscreenToggle}
                    sx={{ 
                      color: '#667eea',
                      padding: { xs: '8px', md: '10px' },
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isFullscreen ? <FullscreenExit sx={{ fontSize: { xs: '18px', md: '20px' } }} /> : <Fullscreen sx={{ fontSize: { xs: '18px', md: '20px' } }} />}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Elegant Divider */}
              <Box sx={{ 
                width: '2px', 
                height: '24px', 
                background: 'linear-gradient(to bottom, transparent, rgba(102, 126, 234, 0.3), transparent)',
                mx: 1 
              }} />

              {/* Profile Section */}
              <Tooltip title="Profile Menu" arrow>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  cursor: 'pointer',
                  borderRadius: '20px',
                  px: 2,
                  py: 1,
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.15)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={handleProfileMenuOpen}
                >
                  <Box sx={{ 
                    textAlign: 'right', 
                    display: { xs: 'none', sm: 'block' },
                    lineHeight: 1.2
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: '#333', 
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#667eea',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                    }}>
                      Administrator
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      fontSize: '16px',
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                      }
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              </Tooltip>
            </Box>

            {/* Zoom Popover */}
            <Popover
              open={Boolean(zoomAnchorEl)}
              anchorEl={zoomAnchorEl}
              onClose={handleZoomPopoverClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              sx={{
                '& .MuiPopover-paper': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  p: 3,
                  minWidth: '220px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                color: 'white'
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  minWidth: '30px',
                  fontWeight: 600
                }}>
                  {Math.round(zoomLevel * 0.1) / 10}x
                </Typography>
                <Slider
                  value={zoomLevel}
                  onChange={handleZoomChange}
                  min={70}
                  max={130}
                  step={10}
                  marks={[
                    { value: 70, label: '' },
                    { value: 80, label: '' },
                    { value: 90, label: '' },
                    { value: 100, label: '' },
                    { value: 110, label: '' },
                    { value: 120, label: '' },
                    { value: 130, label: '' },
                  ]}
                  sx={{
                    color: '#FF8A50',
                    width: 140,
                    '& .MuiSlider-thumb': {
                      width: 18,
                      height: 18,
                      backgroundColor: '#FF8A50',
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(255, 138, 80, 0.4)',
                      '&:hover': {
                        boxShadow: '0 0 0 8px rgba(255, 138, 80, 0.16)',
                      },
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#FF8A50',
                      height: 6,
                      border: 'none',
                      borderRadius: '3px',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      height: 6,
                      borderRadius: '3px',
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                    },
                    '& .MuiSlider-markActive': {
                      backgroundColor: '#FF8A50',
                    },
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  minWidth: '30px',
                  fontWeight: 600
                }}>
                  {Math.round(zoomLevel * 1.3) / 10}x
                </Typography>
              </Box>
            </Popover>
            
            {/* Profile Menu */}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              sx={{
                '& .MuiPaper-root': {
                  mt: 1,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  '& .MuiMenuItem-root': {
                    borderRadius: '12px',
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }
                }
              }}
            >
              <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Administrator
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ mx: 1, my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                minWidth: drawerWidth,
                maxWidth: drawerWidth,
                overflow: 'hidden',
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                minWidth: drawerWidth,
                maxWidth: drawerWidth,
                overflow: 'hidden',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: '80px', // Match new header height
            minHeight: 'calc(100vh - 80px)',
            mr: locationSidebarOpen ? { md: '280px' } : 0,
            transition: theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
            },
          }}
        >
          {children}
        </Box>

        {/* Location Sidebar */}
        <LocationSidebar
          open={locationSidebarOpen}
          onClose={() => setLocationSidebarOpen(false)}
          onLocationSelect={handleLocationSelect}
        />

        {/* Shortcuts Tooltip Popover */}
        <Popover
          open={Boolean(shortcutsAnchorEl)}
          anchorEl={shortcutsAnchorEl}
          onClose={handleShortcutsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{
            '& .MuiPopover-paper': {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              p: 2,
              mt: 1,
            }
          }}
        >
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 1.5, 
            width: '240px' 
          }}>
            {shortcuts.map((shortcut, index) => (
              <Box key={index}>
                <Tooltip title={shortcut.title} arrow placement="top">
                  <Card
                    onClick={() => {
                      router.push(shortcut.path);
                      handleShortcutsClose();
                    }}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      height: '70px',
                      width: '70px',
                      mx: 'auto',
                      '&:hover': {
                        transform: 'translateY(-3px) scale(1.05)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(-1px) scale(1.02)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:last-child': { pb: 0 } }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                          transition: 'all 0.3s ease',
                          '& svg': {
                            color: 'white',
                            fontSize: '20px',
                          }
                        }}
                      >
                        {shortcut.icon}
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Popover>

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
