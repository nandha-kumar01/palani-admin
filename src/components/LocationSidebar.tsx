'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
    if (onLocationSelect) {
      onLocationSelect(currentLocationData);
    }
  }, [currentLocationData, onLocationSelect]);

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
    <Box sx={{ width: sidebarWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FFA726 100%)',
          color: 'white',
          p: 3,
          borderRadius: 0,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <LocationOn sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Location Filter
            </Typography>
          </Box>
          {isMobile && (
            <IconButton
              onClick={onClose}
              sx={{ color: 'white', ml: 1 }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
          Select location to filter data
        </Typography>
      </Paper>

      <Divider />

      {/* Location Filters */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Stack spacing={3}>
          {/* Country Selection */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <Box display="flex" alignItems="center">
                <CountryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Country
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Select Country</InputLabel>
                <Select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  label="Select Country"
                >
                  <MenuItem value="">
                    <em>All Countries</em>
                  </MenuItem>
                  {locationData.countries.map((country) => (
                    <MenuItem key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>

          {/* State Selection */}
          <Accordion defaultExpanded disabled={!selectedCountry}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                backgroundColor: selectedCountry ? 'background.paper' : 'action.disabledBackground',
                '&:hover': { 
                  backgroundColor: selectedCountry ? 'action.hover' : 'action.disabledBackground',
                },
              }}
            >
              <Box display="flex" alignItems="center">
                <StateIcon sx={{ mr: 1, color: selectedCountry ? 'primary.main' : 'text.disabled' }} />
                <Typography 
                  variant="subtitle1" 
                  fontWeight="medium"
                  color={selectedCountry ? 'text.primary' : 'text.disabled'}
                >
                  State / Province
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth variant="outlined" disabled={!selectedCountry}>
                <InputLabel>Select State</InputLabel>
                <Select
                  value={selectedState}
                  onChange={handleStateChange}
                  label="Select State"
                >
                  <MenuItem value="">
                    <em>All States</em>
                  </MenuItem>
                  {availableStates.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>

          {/* City Selection */}
          <Accordion defaultExpanded disabled={!selectedState}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                backgroundColor: selectedState ? 'background.paper' : 'action.disabledBackground',
                '&:hover': { 
                  backgroundColor: selectedState ? 'action.hover' : 'action.disabledBackground',
                },
              }}
            >
              <Box display="flex" alignItems="center">
                <CityIcon sx={{ mr: 1, color: selectedState ? 'primary.main' : 'text.disabled' }} />
                <Typography 
                  variant="subtitle1" 
                  fontWeight="medium"
                  color={selectedState ? 'text.primary' : 'text.disabled'}
                >
                  City
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth variant="outlined" disabled={!selectedState}>
                <InputLabel>Select City</InputLabel>
                <Select
                  value={selectedCity}
                  onChange={handleCityChange}
                  label="Select City"
                >
                  <MenuItem value="">
                    <em>All Cities</em>
                  </MenuItem>
                  {availableCities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>
        </Stack>

        {/* Selected Location Summary */}
        {(selectedCountry || selectedState || selectedCity) && (
          <Paper
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Selected Location:
            </Typography>
            <Stack spacing={0.5}>
              {selectedCountry && (
                <Typography variant="body2">
                  Country: {locationData.countries.find(c => c.id === selectedCountry)?.name}
                </Typography>
              )}
              {selectedState && (
                <Typography variant="body2">
                  State: {availableStates.find(s => s.id === selectedState)?.name}
                </Typography>
              )}
              {selectedCity && (
                <Typography variant="body2">
                  City: {availableCities.find(c => c.id === selectedCity)?.name}
                </Typography>
              )}
            </Stack>
          </Paper>
        )}
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
