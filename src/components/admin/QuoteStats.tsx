'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Star,
  Visibility,
  Language,
  Category,
  Psychology,
} from '@mui/icons-material';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  featured: number;
  categories: {
    [key: string]: number;
  };
  languages: {
    [key: string]: number;
  };
}

interface QuoteStatsProps {
  stats: Stats;
}

export default function QuoteStats({ stats }: QuoteStatsProps) {
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      motivational: '#4CAF50',
      spiritual: '#9C27B0',
      wisdom: '#FF9800',
      love: '#E91E63',
      success: '#2196F3',
      life: '#607D8B',
      happiness: '#FFEB3B',
      peace: '#00BCD4',
      devotional: '#795548',
      inspirational: '#FF5722',
    };
    return colors[category] || '#757575';
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      tamil: '#FF5722',
      english: '#2196F3',
      hindi: '#FF9800',
      sanskrit: '#9C27B0',
    };
    return colors[language] || '#757575';
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Overview Stats */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp />
            Overview
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Quotes
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active ({getPercentage(stats.active, stats.total)}%)
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats.featured}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Featured ({getPercentage(stats.featured, stats.total)}%)
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {stats.inactive}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive ({getPercentage(stats.inactive, stats.total)}%)
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Category />
            Categories
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {Object.entries(stats.categories).map(([category, count]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                    size="small"
                    sx={{
                      bgcolor: getCategoryColor(category),
                      color: 'white',
                      fontWeight: 'medium',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {count} ({getPercentage(count, stats.total)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(count, stats.total)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getCategoryColor(category),
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Language />
            Languages
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {Object.entries(stats.languages).map(([language, count]) => (
              <Box key={language} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={language.charAt(0).toUpperCase() + language.slice(1)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: getLanguageColor(language),
                      color: getLanguageColor(language),
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {count} ({getPercentage(count, stats.total)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(count, stats.total)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getLanguageColor(language),
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Health Score */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology />
            Content Health
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Active Ratio</Typography>
                <Typography variant="body2" color="text.secondary">
                  {getPercentage(stats.active, stats.total)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getPercentage(stats.active, stats.total)}
                color={getPercentage(stats.active, stats.total) > 80 ? 'success' : getPercentage(stats.active, stats.total) > 60 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Featured Content</Typography>
                <Typography variant="body2" color="text.secondary">
                  {getPercentage(stats.featured, stats.active)}% of active
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getPercentage(stats.featured, stats.active)}
                color="warning"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Content Diversity</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Object.keys(stats.categories).length} categories
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (Object.keys(stats.categories).length / 10) * 100)}
                color="info"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}