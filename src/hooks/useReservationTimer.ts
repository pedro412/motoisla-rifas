import { useState, useEffect, useCallback, useRef } from 'react';

interface UseReservationTimerProps {
  onTimeout: () => void;
  duration?: number; // Duration in minutes
  initialTimeLeft?: number; // Initial time left in seconds from server
}

export function useReservationTimer({ onTimeout, duration = 15, initialTimeLeft }: UseReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const onTimeoutRef = useRef(onTimeout);
  
  // Keep the callback ref updated
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const startTimer = useCallback((customTimeLeft?: number) => {
    const timeInSeconds = customTimeLeft || (duration * 60);
    const endTime = Date.now() + (timeInSeconds * 1000);
    console.log('🚀 Starting timer with:', { customTimeLeft, timeInSeconds, endTime: new Date(endTime) });
    localStorage.setItem('reservationEndTime', endTime.toString());
    setTimeLeft(timeInSeconds);
    setIsActive(true);
  }, [duration]);

  const stopTimer = useCallback(() => {
    localStorage.removeItem('reservationEndTime');
    setTimeLeft(null);
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    startTimer();
  }, [startTimer, stopTimer]);

  // Check for existing timer on mount or use initial time from server
  useEffect(() => {
    console.log('🔧 Timer hook initializing with:', { initialTimeLeft });
    
    if (initialTimeLeft !== undefined && initialTimeLeft > 0) {
      // Use server-provided time
      console.log('📥 Using server-provided initial time:', initialTimeLeft);
      const endTime = Date.now() + (initialTimeLeft * 1000);
      localStorage.setItem('reservationEndTime', endTime.toString());
      setTimeLeft(initialTimeLeft);
      setIsActive(true);
      return;
    }

    const savedEndTime = localStorage.getItem('reservationEndTime');
    console.log('💾 Checking localStorage for saved end time:', savedEndTime);
    
    if (savedEndTime) {
      const endTime = parseInt(savedEndTime);
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      console.log('⏱️ Calculated remaining time from localStorage:', remaining);
      
      // Only trigger timeout if we have no server data and timer is actually expired
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsActive(true);
      } else if (initialTimeLeft === undefined) {
        // Only timeout if server hasn't provided data yet
        console.log('⚠️ Timer expired and no server data, stopping');
        stopTimer();
        onTimeoutRef.current();
      } else {
        // Server data indicates timer is expired
        console.log('⚠️ Server confirms timer expired');
        stopTimer();
      }
    } else if (initialTimeLeft === undefined) {
      console.log('🆕 No saved timer found, waiting for server sync');
    }
  }, [stopTimer, initialTimeLeft]); // Include initialTimeLeft

  // Timer countdown effect
  useEffect(() => {
    if (!isActive || timeLeft === null) return;

    if (timeLeft <= 0) {
      stopTimer();
      onTimeoutRef.current();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          stopTimer();
          onTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, stopTimer]); // Include stopTimer as it's stable

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeLeft,
    isActive,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime: timeLeft !== null ? formatTime(timeLeft) : null,
    isExpired: timeLeft === 0
  };
}
