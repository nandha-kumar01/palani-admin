'use client';

import {
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  InputAdornment,
  Autocomplete,
  Typography,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Tune,
} from '@mui/icons-material';
import { useState } from 'react';

interface QuoteFilters {
  search: string;
  category: string;
  language: string;
  status: string;
  author: string;
  tags: string[];
  priority: string;
  sentiment: string;
  difficulty: string;
}

interface QuoteFilterProps {
  filters: QuoteFilters;
  onFiltersChange: (filters: QuoteFilters) => void;
  onClearFilters: () => void;
  showAdvanced?: boolean;
}

export default function QuoteFilter({
  filters,
  onFiltersChange,
  onClearFilters,
  showAdvanced = false,
}: QuoteFilterProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);

  const categories = [
    'motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 
    'happiness', 'peace', 'devotional', 'inspirational'
  ];
  
  const languages = ['tamil', 'english', 'hindi', 'sanskrit'];
  const statuses = ['active', 'inactive', 'featured', 'deleted'];
  const priorities = ['0', '1-3', '4-6', '7-10'];
  const sentiments = ['positive', 'neutral', 'negative'];
  const difficulties = ['easy', 'medium', 'hard'];

  const commonTags = [
    'motivation', 'inspiration', 'life', 'success', 'happiness', 'wisdom',
    'spiritual', 'devotion', 'peace', 'love', 'god', 'temple', 'prayer',
    'meditation', 'faith', 'hope', 'strength', 'courage', 'perseverance',
    'growth', 'mindfulness', 'gratitude', 'compassion', 'forgiveness',
    'journey', 'destiny', 'purpose', 'truth', 'enlightenment'
  ];

  const handleFilterChange = (field: keyof QuoteFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.language) count++;
    if (filters.status) count++;
    if (filters.author) count++;
    if (filters.tags.length > 0) count++;
    if (filters.priority) count++;
    if (filters.sentiment) count++;
    if (filters.difficulty) count++;
    return count;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filters
            {getActiveFilterCount() > 0 && (
              <Chip
                label={getActiveFilterCount()}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Tune />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outlined"
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
            </Button>
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={onClearFilters}
              variant="outlined"
              disabled={getActiveFilterCount() === 0}
            >
              Clear All
            </Button>
          </Box>
        </Box>

        {/* Basic Filters */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)', 
            lg: 'repeat(5, 1fr)' 
          }, 
          gap: 2, 
          mb: 2 
        }}>
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search quotes, authors, tags..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Category */}
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Language */}
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              label="Language"
            >
              <MenuItem value="">All Languages</MenuItem>
              {languages.map((language) => (
                <MenuItem key={language} value={language}>
                  {language.charAt(0).toUpperCase() + language.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Author */}
          <TextField
            fullWidth
            label="Author"
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
            placeholder="Search by author..."
          />
        </Box>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Advanced Filters
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(4, 1fr)' 
              }, 
              gap: 2, 
              mt: 2 
            }}>
              {/* Tags */}
              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={commonTags}
                  value={filters.tags}
                  onChange={(event, newValue) => {
                    handleFilterChange('tags', newValue);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} size="small" />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Filter by tags..."
                    />
                  )}
                />
              </Box>

              {/* Priority */}
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  {priorities.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sentiment */}
              <FormControl fullWidth>
                <InputLabel>Sentiment</InputLabel>
                <Select
                  value={filters.sentiment}
                  onChange={(e) => handleFilterChange('sentiment', e.target.value)}
                  label="Sentiment"
                >
                  <MenuItem value="">All Sentiments</MenuItem>
                  {sentiments.map((sentiment) => (
                    <MenuItem key={sentiment} value={sentiment}>
                      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {filters.search && (
                <Chip
                  label={`Search: "${filters.search}"`}
                  size="small"
                  onDelete={() => handleFilterChange('search', '')}
                />
              )}
              {filters.category && (
                <Chip
                  label={`Category: ${filters.category}`}
                  size="small"
                  onDelete={() => handleFilterChange('category', '')}
                />
              )}
              {filters.language && (
                <Chip
                  label={`Language: ${filters.language}`}
                  size="small"
                  onDelete={() => handleFilterChange('language', '')}
                />
              )}
              {filters.status && (
                <Chip
                  label={`Status: ${filters.status}`}
                  size="small"
                  onDelete={() => handleFilterChange('status', '')}
                />
              )}
              {filters.author && (
                <Chip
                  label={`Author: ${filters.author}`}
                  size="small"
                  onDelete={() => handleFilterChange('author', '')}
                />
              )}
              {filters.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`Tag: ${tag}`}
                  size="small"
                  onDelete={() => {
                    const newTags = filters.tags.filter((_, i) => i !== index);
                    handleFilterChange('tags', newTags);
                  }}
                />
              ))}
              {filters.priority && (
                <Chip
                  label={`Priority: ${filters.priority}`}
                  size="small"
                  onDelete={() => handleFilterChange('priority', '')}
                />
              )}
              {filters.sentiment && (
                <Chip
                  label={`Sentiment: ${filters.sentiment}`}
                  size="small"
                  onDelete={() => handleFilterChange('sentiment', '')}
                />
              )}
              {filters.difficulty && (
                <Chip
                  label={`Difficulty: ${filters.difficulty}`}
                  size="small"
                  onDelete={() => handleFilterChange('difficulty', '')}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}