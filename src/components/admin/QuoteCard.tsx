'use client';

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
  Share,
  ThumbUp,
  ContentCopy,
} from '@mui/icons-material';
import { useState } from 'react';

interface Quote {
  _id: string;
  text: string;
  author: string;
  category: string;
  language: string;
  tags: string[];
  source?: string;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: string;
  metadata: {
    difficulty: string;
    readingTime: number;
    sentiment: string;
  };
}

interface QuoteCardProps {
  quote: Quote;
  onEdit?: (quote: Quote) => void;
  onDelete?: (quote: Quote) => void;
  onToggleActive?: (quote: Quote) => void;
  onToggleFeatured?: (quote: Quote) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function QuoteCard({
  quote,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  showActions = true,
  compact = false,
}: QuoteCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`"${quote.text}" - ${quote.author}`);
    handleMenuClose();
  };

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

  return (
    <Card
      sx={{
        mb: 2,
        border: quote.isFeatured ? '2px solid #ffd700' : '1px solid #e0e0e0',
        boxShadow: quote.isFeatured ? '0 4px 8px rgba(255, 215, 0, 0.3)' : 1,
        opacity: quote.isActive ? 1 : 0.7,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ pb: compact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Chip
              label={quote.category}
              size="small"
              sx={{
                bgcolor: getCategoryColor(quote.category),
                color: 'white',
                fontWeight: 'medium',
                textTransform: 'capitalize',
              }}
            />
            <Chip
              label={quote.language}
              size="small"
              variant="outlined"
              sx={{
                borderColor: getLanguageColor(quote.language),
                color: getLanguageColor(quote.language),
                textTransform: 'capitalize',
              }}
            />
            {quote.isFeatured && (
              <Chip
                label="Featured"
                size="small"
                color="warning"
                icon={<Star fontSize="small" />}
              />
            )}
            {!quote.isActive && (
              <Chip
                label="Inactive"
                size="small"
                color="default"
                variant="outlined"
              />
            )}
          </Box>
          
          {showActions && (
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Quote Text */}
        <Typography
          variant={compact ? 'body2' : 'body1'}
          sx={{
            fontStyle: 'italic',
            fontSize: compact ? '0.9rem' : '1.1rem',
            lineHeight: 1.6,
            mb: 2,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: compact ? 3 : 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          "{quote.text}"
        </Typography>

        {/* Author and Source */}
        <Box sx={{ mb: compact ? 1 : 2 }}>
          <Typography
            variant="body2"
            sx={{
              textAlign: 'right',
              fontWeight: 'medium',
              color: 'text.secondary',
            }}
          >
            — {quote.author}
          </Typography>
          {quote.source && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'right',
                color: 'text.disabled',
                mt: 0.5,
              }}
            >
              Source: {quote.source}
            </Typography>
          )}
        </Box>

        {/* Tags */}
        {quote.tags.length > 0 && !compact && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {quote.tags.slice(0, 5).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {quote.tags.length > 5 && (
              <Chip
                label={`+${quote.tags.length - 5} more`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', opacity: 0.7 }}
              />
            )}
          </Box>
        )}

        {/* Stats */}
        {!compact && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Visibility fontSize="small" color="action" />
                <Typography variant="caption">{quote.viewCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ThumbUp fontSize="small" color="action" />
                <Typography variant="caption">{quote.likeCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Share fontSize="small" color="action" />
                <Typography variant="caption">{quote.shareCount}</Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Priority: {quote.priority}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {quote.metadata.readingTime}s read
              </Typography>
            </Box>
          </Box>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {onEdit && (
            <MenuItem
              onClick={() => {
                onEdit(quote);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          
          {onToggleActive && (
            <MenuItem
              onClick={() => {
                onToggleActive(quote);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                {quote.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </ListItemIcon>
              <ListItemText>{quote.isActive ? 'Deactivate' : 'Activate'}</ListItemText>
            </MenuItem>
          )}
          
          {onToggleFeatured && (
            <MenuItem
              onClick={() => {
                onToggleFeatured(quote);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                {quote.isFeatured ? <StarBorder fontSize="small" /> : <Star fontSize="small" />}
              </ListItemIcon>
              <ListItemText>{quote.isFeatured ? 'Unfeature' : 'Feature'}</ListItemText>
            </MenuItem>
          )}
          
          <MenuItem onClick={handleCopyText}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Text</ListItemText>
          </MenuItem>
          
          {onDelete && (
            <>
              <Divider />
              <MenuItem
                onClick={() => {
                  onDelete(quote);
                  handleMenuClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <Delete fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
}