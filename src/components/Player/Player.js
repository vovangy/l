import React, { useState, useRef, useEffect } from 'react';
import './Player.css';

const Player = ({ currentTrack, onTrackChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  console.log(currentTrack)
  
  const getTrackUrl = () => {
    if (!currentTrack) return '';
    return currentTrack.url || currentTrack.Url || 
           currentTrack.link || currentTrack.Link || 
           (currentTrack.audio && currentTrack.audio.url) ||
           (currentTrack.Audio && currentTrack.Audio.url) ||
           '';
  };

  const getTrackID = () => {
    if (!currentTrack) return '';
    return currentTrack.id || currentTrack.ID || 
           '';
  };
  
  const getTrackTitle = () => {
    if (!currentTrack) return 'Название трека';
    return currentTrack.title || currentTrack.Title || 
           currentTrack.name || currentTrack.Name ||
           'Название трека';
  };
  
  const getTrackArtist = () => {
    if (!currentTrack) return '';
    return currentTrack.artist || currentTrack.Artist || 
           currentTrack.performer || currentTrack.Performer ||
           '';
  };
  
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      setError(null);
      
      if (!getTrackUrl()) {
        setError('URL трека недоступен');
        setIsPlaying(false);
        return;
      }
      
      if (isPlaying) {
        audioRef.current.play().catch(() => {
        });
      }
    }
  }, [currentTrack, isPlaying]);
  
  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const loadMetadata = () => setDuration(audio.duration || 0);
    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onTrackChange) onTrackChange('next');
    };
    
    const handleError = (e) => {
      setIsPlaying(false);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', loadMetadata);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', loadMetadata);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [onTrackChange, currentTrack]);
  
  useEffect(() => {
    if (!audioRef.current) return;

    console.log(audioRef.current)
    
    if (isPlaying) {
      audioRef.current.play().catch(() => {
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);
  
  const handlePlay = () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
        });
      }
    setIsPlaying(!isPlaying);
    } catch (error) {
    }
  };
  
  const handlePrevious = () => {
    if (onTrackChange) onTrackChange('previous');
  };
  
  const handleNext = () => {
    if (onTrackChange) onTrackChange('next');
  };
  
  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressClick = (e) => {
    if (!audioRef.current || error) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (isNaN(newTime) || !isFinite(newTime)) return;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  
  if (!currentTrack) return null;
  
  const trackUrl = getTrackUrl();
  const trackTitle = getTrackTitle();
  const trackArtist = getTrackArtist();
  const trackID = getTrackID();
  
  return (
    <div className="player">
      {trackUrl && (
        <audio 
        key={trackID}  // <-- вот эта строка решает проблему
        ref={audioRef} 
        src={`https://webbcrew.ru/api/stream/${trackID}?v=${trackID}`} 
        preload="metadata"
        />
      )}
      
      <div className="player-content">
        <div className="player-track-info">
          <div className="player-track-title">
            {trackTitle}
          </div>
          {trackArtist && (
            <div className="player-track-artist">
              {trackArtist}
            </div>
          )}
          {error && (
            <div className="player-error">
              {error}
            </div>
          )}
        </div>
        
        <div className="player-progress">
          <span className="player-time">{formatTime(currentTime)}</span>
          <div 
            className="player-progress-bar"
            onClick={handleProgressClick}
          >
            <div 
              className="player-progress-current"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
        
        <div className="player-controls">
          <button 
            className="player-control-button"
            onClick={handlePrevious}
            aria-label="Предыдущий трек"
          >
            ◀◀
          </button>
          <button 
            className={`player-control-button player-play ${error ? 'disabled' : ''}`}
            onClick={handlePlay}
            aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            disabled={!!error}
          >
            {isPlaying ? '❙❙' : '▶'}
          </button>
          <button 
            className="player-control-button"
            onClick={handleNext}
            aria-label="Следующий трек"
          >
            ▶▶
          </button>
        </div>
      </div>
    </div>
  );
};

Player.defaultProps = {
  currentTrack: null,
  onTrackChange: () => {}
};

export default Player; 