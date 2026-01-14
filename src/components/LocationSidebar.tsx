'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Box,
  Drawer,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SelectChangeEvent,
} from '@mui/material';
import {
  LocationOn,
  ExpandMore,
  Close as CloseIcon,
  Public as CountryIcon,
  LocationCity as StateIcon,
  Place as CityIcon,
} from '@mui/icons-material';

interface LocationData {
  countries: Country[];
  states: State[];
  cities: City[];
}

interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  id: string;
  name: string;
  countryId: string;
}

interface City {
  id: string;
  name: string;
  stateId: string;
}

interface LocationSidebarProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect?: (location: { country?: string; state?: string; city?: string }) => void;
}

const sidebarWidth = 280;

// Sample data - replace with actual API calls
const sampleLocationData: LocationData = {
  countries: [
    { id: '1', name: 'India', code: 'IN' },
    { id: '2', name: 'United States', code: 'US' },
    { id: '3', name: 'United Kingdom', code: 'UK' },
    { id: '4', name: 'Canada', code: 'CA' },
    { id: '5', name: 'Australia', code: 'AU' },
  ],
  states: [
    // India
    { id: '1', name: 'Tamil Nadu', countryId: '1' },
    { id: '2', name: 'Karnataka', countryId: '1' },
    { id: '3', name: 'Kerala', countryId: '1' },
    { id: '4', name: 'Andhra Pradesh', countryId: '1' },
    { id: '5', name: 'Maharashtra', countryId: '1' },
    // US
    { id: '6', name: 'California', countryId: '2' },
    { id: '7', name: 'Texas', countryId: '2' },
    { id: '8', name: 'New York', countryId: '2' },
    // UK
    { id: '9', name: 'England', countryId: '3' },
    { id: '10', name: 'Scotland', countryId: '3' },
    // Canada
    { id: '11', name: 'Ontario', countryId: '4' },
    { id: '12', name: 'British Columbia', countryId: '4' },
    // Australia
    { id: '13', name: 'New South Wales', countryId: '5' },
    { id: '14', name: 'Victoria', countryId: '5' },
  ],
  cities: [
    // Tamil Nadu
    { id: '1', name: 'Chennai', stateId: '1' },
    { id: '2', name: 'Coimbatore', stateId: '1' },
    { id: '3', name: 'Madurai', stateId: '1' },
    { id: '4', name: 'Palani', stateId: '1' },
    { id: '5', name: 'Salem', stateId: '1' },
    // Karnataka
    { id: '6', name: 'Bangalore', stateId: '2' },
    { id: '7', name: 'Mysore', stateId: '2' },
    // Kerala
    { id: '8', name: 'Kochi', stateId: '3' },
    { id: '9', name: 'Trivandrum', stateId: '3' },
    // California
    { id: '10', name: 'Los Angeles', stateId: '6' },
    { id: '11', name: 'San Francisco', stateId: '6' },
    // Texas
    { id: '12', name: 'Houston', stateId: '7' },
    { id: '13', name: 'Dallas', stateId: '7' },
    // New York
    { id: '14', name: 'New York City', stateId: '8' },
    { id: '15', name: 'Buffalo', stateId: '8' },
  ],
};


export default function LocationSidebar({ open, onClose, onLocationSelect }: LocationSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [locationData] = useState<LocationData>(sampleLocationData);
  
  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
const APP_HEADER_HEIGHT = 80; // main header height

  // Update available states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = locationData.states.filter(state => state.countryId === selectedCountry);
      setAvailableStates(states);
      setSelectedState('');
      setSelectedCity('');
      setAvailableCities([]);
    } else {
      setAvailableStates([]);
      setSelectedState('');
      setSelectedCity('');
      setAvailableCities([]);
    }
  }, [selectedCountry, locationData.states]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      const cities = locationData.cities.filter(city => city.stateId === selectedState);
      setAvailableCities(cities);
      setSelectedCity('');
    } else {
      setAvailableCities([]);
      setSelectedCity('');
    }
  }, [selectedState, locationData.cities]);

  // Memoize the current location data
  const currentLocationData = useMemo(() => {
    const country = locationData.countries.find(c => c.id === selectedCountry)?.name || '';
    const state = availableStates.find(s => s.id === selectedState)?.name || '';
    const city = availableCities.find(c => c.id === selectedCity)?.name || '';
    
    return {
      country: country || undefined,
      state: state || undefined,
      city: city || undefined,
    };
  }, [selectedCountry, selectedState, selectedCity, locationData.countries, availableStates, availableCities]);

  // Notify parent when location selection changes
  useEffect(() => {
  if (!onLocationSelect) return;

  if (selectedCity || selectedState || selectedCountry) {
    onLocationSelect(currentLocationData);
  }
}, [selectedCountry, selectedState, selectedCity]);


const handleClearLocation = () => {
  setSelectedCountry('');
  setSelectedState('');
  setSelectedCity('');
  setAvailableStates([]);
  setAvailableCities([]);

  // Optional: parent-ku clear inform panna
  if (onLocationSelect) {
    onLocationSelect({});
  }
};


const handleSaveLocation = () => {
  if (!onLocationSelect) return;

  onLocationSelect(currentLocationData); // save
  onClose(); // auto close sidebar
};


  const handleCountryChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedCountry(event.target.value);
  }, []);

  const handleStateChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedState(event.target.value);
  }, []);

  const handleCityChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedCity(event.target.value);
  }, []);

 const sidebarContent = (
  <Box
    sx={{
      width: sidebarWidth,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'white',
    }}
  >
    {/* ===== SIDEBAR HEADER (BELOW MAIN HEADER) ===== */}
    <Box
      sx={{
        position: 'sticky',
        top: APP_HEADER_HEIGHT,
        zIndex: 5,
        px: 3,
        py: 2.5,
        backgroundColor: '#eaeffc',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1} sx={{marginLeft:"25px"}}>
          <LocationOn color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Location Filter
          </Typography>
        </Box>

        {isMobile && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Typography
        variant="body2"
        sx={{ mt: 0.5, color: '#7353ae' }}
      >
        Filter data by country, state and city
      </Typography>
    </Box>

    {/* ===== CONTENT ===== */}
    <Box
      sx={{
        flex: 1,
        overflowY: 'hidden',
        px: 3,
        py: 3,
        marginTop:"30%",
        
            }}
    >
      <Stack spacing={3}>

        {/* COUNTRY */}
        <Paper sx={{ p: 2.5, borderRadius: 3,backgroundColor:"#f4f5fa" }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
            Country
          </Typography>
          <FormControl
  fullWidth
  size="small"
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,

      // 🔹 default border
      '& fieldset': {
        borderColor: '#d1d5db',
      },

      // 🔵 hover border
      '&:hover fieldset': {
        borderColor: '#2563eb', // blue
      },

      // 🔵 focus border
      '&.Mui-focused fieldset': {
        borderColor: '#2563eb',
        borderWidth: 2,
      },
    },

    // 🔵 label color on focus
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#2563eb',
    },
  }}
>
  <InputLabel>Select Country</InputLabel>
  <Select
    value={selectedCountry}
    label="Select Country"
    onChange={handleCountryChange}
  >
    <MenuItem value="">All Countries</MenuItem>
    {locationData.countries.map((c) => (
      <MenuItem key={c.id} value={c.id}>
        {c.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>

        </Paper>

        {/* STATE */}
        <Paper sx={{ p: 2.5, borderRadius: 3,backgroundColor:"#f4f5fa" }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
            State 
          </Typography>
          <FormControl fullWidth size="small" disabled={!selectedCountry}>
            <InputLabel>Select State</InputLabel>
            <Select
              value={selectedState}
              label="Select State"
              onChange={handleStateChange}
            >
              <MenuItem value="">All States</MenuItem>
              {availableStates.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* CITY */}
        <Paper sx={{ p: 2.5, borderRadius: 3,backgroundColor:"#f4f5fa" }}>
           <Typography variant="h6" sx={{ mb: 2, color: '#7353ae', fontWeight: "bold" }}>
            City
          </Typography>
          <FormControl fullWidth size="small" disabled={!selectedState}>
            <InputLabel>Select City</InputLabel>
            <Select
              value={selectedCity}
              label="Select City"
              onChange={handleCityChange}
            >
              <MenuItem value="">All Cities</MenuItem>
              {availableCities.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

       

        <Box height={24} />
      </Stack>
    </Box>
 {/* ===== ACTION FOOTER ===== */}
<Box
  sx={{
    position: 'sticky',
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTop: '1px solid',
    borderColor: 'divider',
    px: 3,
    py: 2,
  }}
>
  <Stack direction="row" spacing={2}>
    <Button
      variant="outlined"
      onClick={handleClearLocation}
      disabled={!selectedCountry && !selectedState && !selectedCity}
      sx={{
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                   startIcon={<ClearIcon />}
    >
      Clear
    </Button>

    <Box flex={1} />

    <Button
      variant="contained"
      startIcon={<SaveIcon />}
      onClick={handleSaveLocation}
      disabled={!selectedCountry}
      sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
    >
      Save
    </Button>
  </Stack>
</Box>


  </Box>
);


  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.default',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}
