'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Slider,
  Autocomplete,
  Paper,
  Divider,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Save,
  ArrowBack,
  Preview,
  Psychology,
  Schedule,
  Star,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import AdminLayout from '@/components/admin/AdminLayout';

interface QuoteFormData {
  text: string;
  author: string;
  category: string;
  language: string;
  tags: string[];
  source: string;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  scheduledAt: Date | null;
  metadata: {
    difficulty: string;
    sentiment: string;
  };
}

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
      notifications.show({ ...config, color: 'green' });
      break;
    case 'error':
      notifications.show({ ...config, color: 'red' });
      break;
    case 'warning':
      notifications.show({ ...config, color: 'orange' });
      break;
    case 'info':
      notifications.show({ ...config, color: 'blue' });
      break;
  }
};

export default function QuoteFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEditing = params?.id && params.id !== 'new';
  const quoteId = isEditing ? params.id as string : null;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuoteFormData>({
    text: '',
    author: '',
    category: 'motivational',
    language: 'tamil',
    tags: [],
    source: '',
    isActive: true,
    isFeatured: false,
    priority: 0,
    scheduledAt: null,
    metadata: {
      difficulty: 'easy',
      sentiment: 'positive',
    },
  });

  const categories = [
    'motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 
    'happiness', 'peace', 'devotional', 'inspirational'
  ];
  
  const languages = ['tamil', 'english', 'hindi', 'sanskrit'];
  const difficulties = ['easy', 'medium', 'hard'];
  const sentiments = ['positive', 'neutral', 'negative'];

  // Common tags for autocomplete
  const commonTags = [
    'motivation', 'inspiration', 'life', 'success', 'happiness', 'wisdom',
    'spiritual', 'devotion', 'peace', 'love', 'god', 'temple', 'prayer',
    'meditation', 'faith', 'hope', 'strength', 'courage', 'perseverance',
    'growth', 'mindfulness', 'gratitude', 'compassion', 'forgiveness',
    'journey', 'destiny', 'purpose', 'truth', 'enlightenment'
  ];

  useEffect(() => {
    if (isEditing && quoteId) {
      fetchQuote();
    }
  }, [isEditing, quoteId]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      const quote = data.quote;

      setFormData({
        text: quote.text || '',
        author: quote.author || '',
        category: quote.category || 'motivational',
        language: quote.language || 'tamil',
        tags: quote.tags || [],
        source: quote.source || '',
        isActive: quote.isActive ?? true,
        isFeatured: quote.isFeatured ?? false,
        priority: quote.priority ?? 0,
        scheduledAt: quote.scheduledAt ? new Date(quote.scheduledAt) : null,
        metadata: {
          difficulty: quote.metadata?.difficulty || 'easy',
          sentiment: quote.metadata?.sentiment || 'positive',
        },
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      showNotification('error', 'Error', 'Failed to fetch quote details');
      router.push('/admin/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.text.trim() || !formData.author.trim()) {
      showNotification('warning', 'Validation Error', 'Text and author are required');
      return;
    }

    if (formData.text.length > 1000) {
      showNotification('warning', 'Validation Error', 'Quote text cannot exceed 1000 characters');
      return;
    }

    try {
      setSubmitting(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const submitData = {
        ...formData,
        createdBy: isEditing ? undefined : userData._id,
        updatedBy: isEditing ? userData._id : undefined,
      };

      const url = isEditing ? `/api/admin/quotes/${quoteId}` : '/api/admin/quotes';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save quote');
      }

      const data = await response.json();
      showNotification('success', 'Success', isEditing ? 'Quote updated successfully' : 'Quote created successfully');
      router.push('/admin/quotes');
    } catch (error: any) {
      console.error('Error saving quote:', error);
      showNotification('error', 'Error', error.message || 'Failed to save quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof QuoteFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetadataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const getCharacterCount = () => {
    return formData.text.length;
  };

  const getEstimatedReadingTime = () => {
    const wordCount = formData.text.split(' ').length;
    return Math.max(5, Math.ceil(wordCount / 2));
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/admin/quotes')}
              sx={{ mr: 2 }}
            >
              Back to Quotes
            </Button>
            <Typography variant="h4" fontWeight="bold">
              {isEditing ? 'Edit Quote' : 'Add New Quote'}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* Main Content */}
              <Box sx={{ flex: '1 1 600px', minWidth: '400px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quote Content
                    </Typography>
                    
                    {/* Quote Text */}
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Quote Text"
                      value={formData.text}
                      onChange={(e) => handleInputChange('text', e.target.value)}
                      placeholder="Enter the quote text..."
                      helperText={`${getCharacterCount()}/1000 characters • Est. reading time: ${getEstimatedReadingTime()}s`}
                      error={getCharacterCount() > 1000}
                      sx={{ mb: 3 }}
                      required
                    />

                    {/* Author */}
                    <TextField
                      fullWidth
                      label="Author"
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      placeholder="Enter author name..."
                      sx={{ mb: 3 }}
                      required
                    />

                    {/* Source */}
                    <TextField
                      fullWidth
                      label="Source (Optional)"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      placeholder="Book, speech, website, etc..."
                      sx={{ mb: 3 }}
                    />

                    {/* Tags */}
                    <Autocomplete
                      multiple
                      freeSolo
                      options={commonTags}
                      value={formData.tags}
                      onChange={(event, newValue) => {
                        handleInputChange('tags', newValue);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          placeholder="Add tags..."
                          helperText="Press Enter to add custom tags"
                        />
                      )}
                      sx={{ mb: 3 }}
                    />
                  </CardContent>
                </Card>

                {/* Preview Card */}
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Preview sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Preview
                    </Typography>
                    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontStyle: 'italic',
                          fontSize: '1.1rem',
                          lineHeight: 1.6,
                          mb: 2,
                          color: 'text.primary',
                        }}
                      >
                        "{formData.text || 'Your quote will appear here...'}"
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: 'right',
                          fontWeight: 'medium',
                          color: 'text.secondary',
                        }}
                      >
                        — {formData.author || 'Author Name'}
                      </Typography>
                      {formData.source && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            textAlign: 'right',
                            color: 'text.disabled',
                            mt: 0.5,
                          }}
                        >
                          Source: {formData.source}
                        </Typography>
                      )}
                    </Paper>
                  </CardContent>
                </Card>
              </Box>

              {/* Sidebar */}
              <Box sx={{ flex: '0 0 350px', minWidth: '300px' }}>
                {/* Basic Settings */}
                <Card sx={{ mb: 3, height: 'fit-content' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Settings
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        label="Category"
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        label="Language"
                      >
                        {languages.map((language) => (
                          <MenuItem key={language} value={language}>
                            {language.charAt(0).toUpperCase() + language.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography gutterBottom>Priority: {formData.priority}</Typography>
                    <Slider
                      value={formData.priority}
                      onChange={(e, value) => handleInputChange('priority', value)}
                      min={0}
                      max={10}
                      marks
                      step={1}
                      valueLabelDisplay="auto"
                      color="primary"
                    />
                  </CardContent>
                </Card>

                {/* Status Settings */}
                <Card sx={{ mb: 3, height: 'fit-content' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Status Settings
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                      sx={{ display: 'block', mb: 2 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFeatured}
                          onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star sx={{ mr: 0.5, fontSize: '1rem' }} />
                          Featured
                        </Box>
                      }
                      sx={{ display: 'block', mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Schedule Publication"
                      type="datetime-local"
                      value={formData.scheduledAt ? formData.scheduledAt.toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value ? new Date(e.target.value) : null)}
                      helperText="Leave empty for immediate publication"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Metadata */}
                <Card sx={{ mb: 3, height: 'fit-content' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Metadata
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Difficulty</InputLabel>
                      <Select
                        value={formData.metadata.difficulty}
                        onChange={(e) => handleMetadataChange('difficulty', e.target.value)}
                        label="Difficulty"
                      >
                        {difficulties.map((difficulty) => (
                          <MenuItem key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Sentiment</InputLabel>
                      <Select
                        value={formData.metadata.sentiment}
                        onChange={(e) => handleMetadataChange('sentiment', e.target.value)}
                        label="Sentiment"
                      >
                        {sentiments.map((sentiment) => (
                          <MenuItem key={sentiment} value={sentiment}>
                            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card sx={{ position: 'sticky', top: 20, height: 'fit-content' }}>
                  <CardContent>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    >
                      {submitting ? 'Saving...' : (isEditing ? 'Update Quote' : 'Create Quote')}
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push('/admin/quotes')}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </form>
      </Box>
    </AdminLayout>
  );
}