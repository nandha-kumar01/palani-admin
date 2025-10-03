'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Slider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeDown,
  VolumeMute,
  SkipNext,
  SkipPrevious,
  MusicNote,
} from '@mui/icons-material';

interface Song {
  _id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration?: number;
}

interface AudioPlayerProps {
  currentSong?: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek?: (time: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  playlist?: Song[];
  formatTime: (time: number) => string;
  className?: string;
}

export default function AudioPlayer({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onStop,
  onVolumeChange,
  onSeek,
  onNext,
  onPrevious,
  playlist,
  formatTime,
  className,
}: AudioPlayerProps) {
  if (!currentSong) {
    return null;
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeMute />;
    if (volume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  const handleSeekChange = (event: Event, newValue: number | number[]) => {
    if (onSeek && typeof newValue === 'number' && duration > 0) {
      const seekTime = (newValue / 100) * duration;
      onSeek(seekTime);
    }
  };

  return (
    <Card className={className} sx={{ minWidth: 500, maxWidth: 850 }}>
      <CardHeader 
        title={
          <Typography variant="h6" fontWeight="bold">
            Now Playing
          </Typography>
        } 
         avatar={<MusicNote color="primary" />}
      />
    
      <CardContent sx={{ py: 1, '&:last-child': { pb: 2 } }}>
        {/* Song Info */}
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" component="div" noWrap sx={{ fontWeight: 600 }}>
            {currentSong.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {currentSong.artist}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 1.5 }}>
          {onSeek ? (
            <Slider
              value={duration > 0 ? progress : 0}
              onChange={handleSeekChange}
              sx={{ 
                mb: 0.5,
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                },
                '& .MuiSlider-track': {
                  height: 3,
                },
                '& .MuiSlider-rail': {
                  height: 3,
                },
              }}
              size="small"
              min={0}
              max={100}
              step={0.1}
            />
          ) : (
            <LinearProgress 
              variant="determinate" 
              value={duration > 0 ? progress : 0} 
              sx={{ 
                mb: 0.5,
                height: 3,
                borderRadius: 2,
              }}
            />
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: '30px' }}>
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: '30px', textAlign: 'right' }}>
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        {/* Control Buttons & Volume in One Line */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          {/* Play Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {onPrevious && (
              <Tooltip title="Previous">
                <IconButton onClick={onPrevious} size="small">
                  <SkipPrevious fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title={isPlaying ? "Pause" : "Play"}>
              <IconButton 
                onClick={onPlayPause}
                color="primary"
                size="medium"
                sx={{ mx: 0.5 }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Stop">
              <IconButton onClick={onStop} size="small">
                <Stop fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {onNext && (
              <Tooltip title="Next">
                <IconButton onClick={onNext} size="small">
                  <SkipNext fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Volume Control */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '80px' }}>
            <IconButton 
              size="small" 
              onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
            >
              {getVolumeIcon()}
            </IconButton>
            <Slider
              value={volume}
              onChange={(_, value) => onVolumeChange(value as number)}
              min={0}
              max={1}
              step={0.05}
              sx={{ 
                width: 60,
                '& .MuiSlider-thumb': {
                  width: 8,
                  height: 8,
                },
                '& .MuiSlider-track': {
                  height: 2,
                },
                '& .MuiSlider-rail': {
                  height: 2,
                },
              }}
              size="small"
            />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', minWidth: '25px', textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </Typography>
          </Box>
        </Box>


      </CardContent>
    </Card>
  );
}
