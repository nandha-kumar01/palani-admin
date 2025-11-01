import { useState, useRef, useEffect, useCallback } from 'react';

interface Song {
  _id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration?: number;
}

interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentPlaying: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  setVolume: (volume: number) => void;
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => Promise<void>;
  stopSong: () => Promise<void>;
  seekTo: (time: number) => void;
  formatTime: (time: number) => string;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressUpdateRef = useRef<number | undefined>(undefined);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Progress update functions
  const startProgressUpdate = useCallback(() => {
    const updateProgress = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const time = audioRef.current.currentTime;
        if (!isNaN(time)) {
          setCurrentTime(Math.floor(time * 10) / 10);
        }
        progressUpdateRef.current = requestAnimationFrame(updateProgress);
      }
    };
    progressUpdateRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const stopProgressUpdate = useCallback(() => {
    if (progressUpdateRef.current !== undefined) {
      cancelAnimationFrame(progressUpdateRef.current);
      progressUpdateRef.current = undefined;
    }
  }, []);

  const playSong = useCallback(async (song: Song) => {
    if (!audioRef.current) return;

    // Cancel any existing play promise
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (error: any) {
        // Ignore AbortError as it's expected when interrupting
        if (error.name !== 'AbortError') {
          console.error('Error with previous play promise:', error);
        }
      }
      playPromiseRef.current = null;
    }

    if (currentPlaying === song._id && isPlaying) {
      // Pause current song
      audioRef.current.pause();
      setIsPlaying(false);
      stopProgressUpdate();
    } else {
      // Play new song or resume
      if (currentPlaying !== song._id) {
        audioRef.current.src = song.audioUrl;
        setCurrentPlaying(song._id);
        setCurrentTime(0);
        setDuration(0);
      }
      
      try {
        playPromiseRef.current = audioRef.current.play();
        await playPromiseRef.current;
        setIsPlaying(true);
        startProgressUpdate();
        playPromiseRef.current = null;
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error playing audio:', error);
        }
        setIsPlaying(false);
        playPromiseRef.current = null;
      }
    }
  }, [currentPlaying, isPlaying, startProgressUpdate, stopProgressUpdate]);

  const pauseSong = useCallback(async () => {
    if (!audioRef.current) return;

    // Wait for any existing play promise to resolve before pausing
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (error: any) {
        // Ignore AbortError
        if (error.name !== 'AbortError') {
          console.error('Error with play promise:', error);
        }
      }
      playPromiseRef.current = null;
    }

    audioRef.current.pause();
    setIsPlaying(false);
    stopProgressUpdate();
  }, [stopProgressUpdate]);

  const stopSong = useCallback(async () => {
    if (!audioRef.current) return;

    // Wait for any existing play promise to resolve before stopping
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (error: any) {
        // Ignore AbortError
        if (error.name !== 'AbortError') {
          console.error('Error with play promise:', error);
        }
      }
      playPromiseRef.current = null;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    stopProgressUpdate();
  }, [stopProgressUpdate]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current && !isNaN(time) && time >= 0) {
      try {
        audioRef.current.currentTime = Math.min(time, audioRef.current.duration || 0);
        setCurrentTime(time);
      } catch (error) {
        console.error('Error seeking audio:', error);
      }
    }
  }, []);

  const formatTime = useCallback((time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(Math.floor(audio.currentTime * 10) / 10); // Round to 1 decimal place for smoother updates
      }
    };
    
    const handleDurationChange = () => {
      if (audio.duration !== undefined && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(Math.floor(audio.duration * 10) / 10);
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audio.duration !== undefined && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(Math.floor(audio.duration * 10) / 10);
      }
    };
    
    const handleCanPlay = () => {
      if (audio.duration !== undefined && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(Math.floor(audio.duration * 10) / 10);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopProgressUpdate();
    };
    
    const handleLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      stopProgressUpdate();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);
    
    // Set volume
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
      stopProgressUpdate();
      
      // Cancel any pending play promise
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore any errors during cleanup
        });
        playPromiseRef.current = null;
      }
    };
  }, [volume, stopProgressUpdate]);

  return {
    audioRef,
    currentPlaying,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    playSong,
    pauseSong,
    stopSong,
    seekTo,
    formatTime,
  };
};
