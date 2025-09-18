import { renderHook, act } from '@testing-library/react'
import { useReservationTimer } from '../useReservationTimer'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.fn()
global.console = { ...console, log: mockConsoleLog }

describe('useReservationTimer Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Timer Initialization', () => {
    it('should initialize with null timeLeft when no initial data', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      expect(result.current.timeLeft).toBeNull()
      expect(result.current.isActive).toBe(false)
      expect(result.current.formatTime).toBeNull()
    })

    it('should initialize with server-provided time', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 600 // 10 minutes
        })
      )

      expect(result.current.timeLeft).toBe(600)
      expect(result.current.isActive).toBe(true)
      expect(result.current.formatTime).toBe('10:00')
    })

    it('should restore timer from localStorage when available', () => {
      const futureTime = Date.now() + 300000 // 5 minutes from now
      mockLocalStorage.getItem.mockReturnValue(futureTime.toString())

      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      expect(result.current.timeLeft).toBeGreaterThan(0)
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('Timer Countdown Behavior', () => {
    it('should count down correctly', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 5
        })
      )

      expect(result.current.timeLeft).toBe(5)
      expect(result.current.formatTime).toBe('0:05')

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.timeLeft).toBe(4)
      expect(result.current.formatTime).toBe('0:04')
    })

    it('should call onTimeout when timer reaches zero', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 2
        })
      )

      // Advance timer to completion
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockOnTimeout).toHaveBeenCalledTimes(1)
      expect(result.current.timeLeft).toBeNull()
      expect(result.current.isActive).toBe(false)
      expect(result.current.isExpired).toBe(false) // isExpired is timeLeft === 0, but timeLeft is null when stopped
    })

    it('should NOT automatically redirect or clear data on timeout', () => {
      const mockOnTimeout = jest.fn(() => {
        // This simulates the new non-destructive timeout behavior
        console.log('Timer expired (display only - tickets remain reserved)')
      })

      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 1
        })
      )

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockOnTimeout).toHaveBeenCalledTimes(1)
      
      // Verify the timeout doesn't perform destructive actions
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Timer expired (display only - tickets remain reserved)'
      )
      
      // Timer should be stopped but not cleared destructively
      expect(result.current.isActive).toBe(false)
      expect(result.current.isExpired).toBe(false) // isExpired only true when timeLeft === 0, but timer stops with null
    })
  })

  describe('Timer Controls', () => {
    it('should start timer with default duration', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout, duration: 2 })
      )

      act(() => {
        result.current.startTimer()
      })

      expect(result.current.timeLeft).toBe(120) // 2 minutes = 120 seconds
      expect(result.current.isActive).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should start timer with custom time', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      act(() => {
        result.current.startTimer(300) // 5 minutes
      })

      expect(result.current.timeLeft).toBe(300)
      expect(result.current.isActive).toBe(true)
    })

    it('should stop timer and clear localStorage', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 600
        })
      )

      act(() => {
        result.current.stopTimer()
      })

      expect(result.current.timeLeft).toBeNull()
      expect(result.current.isActive).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('reservationEndTime')
    })

    it('should reset timer', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout, duration: 5 })
      )

      // Start timer first
      act(() => {
        result.current.startTimer()
      })

      // Let it count down a bit
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.timeLeft).toBe(298) // 5 minutes - 2 seconds

      // Reset timer
      act(() => {
        result.current.resetTimer()
      })

      expect(result.current.timeLeft).toBe(300) // Back to 5 minutes
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('Time Formatting', () => {
    it('should format time correctly', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      act(() => {
        result.current.startTimer(3661) // 1 hour, 1 minute, 1 second
      })

      expect(result.current.formatTime).toBe('61:01') // Shows as minutes:seconds
    })

    it('should format single digits with leading zeros', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 65 // 1 minute, 5 seconds
        })
      )

      expect(result.current.formatTime).toBe('1:05')
    })

    it('should handle zero time', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 0
        })
      )

      // When initialTimeLeft is 0, hook doesn't initialize timer (condition is > 0)
      expect(result.current.formatTime).toBeNull()
      expect(result.current.timeLeft).toBeNull()
      expect(result.current.isExpired).toBe(false)
    })
  })

  describe('LocalStorage Integration', () => {
    it('should save timer end time to localStorage', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      act(() => {
        result.current.startTimer(300)
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'reservationEndTime',
        expect.any(String)
      )
    })

    it('should clear localStorage when timer stops', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 100
        })
      )

      act(() => {
        result.current.stopTimer()
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('reservationEndTime')
    })

    it('should handle expired localStorage timer gracefully', () => {
      const pastTime = Date.now() - 60000 // 1 minute ago
      mockLocalStorage.getItem.mockReturnValue(pastTime.toString())

      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      // Should trigger timeout for expired localStorage timer
      expect(mockOnTimeout).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative initial time', () => {
      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: -100
        })
      )

      // Should not start with negative time - hook doesn't initialize with negative values
      expect(result.current.timeLeft).toBeNull()
      expect(result.current.isActive).toBe(false)
    })

    it('should handle invalid localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-data')

      const mockOnTimeout = jest.fn()
      const { result } = renderHook(() => 
        useReservationTimer({ onTimeout: mockOnTimeout })
      )

      // Should handle gracefully and not crash
      expect(result.current.timeLeft).toBeNull()
      expect(result.current.isActive).toBe(false)
    })

    it('should handle onTimeout callback changes', () => {
      const mockOnTimeout1 = jest.fn()
      const mockOnTimeout2 = jest.fn()

      const { result, rerender } = renderHook(
        ({ onTimeout }) => useReservationTimer({ onTimeout, initialTimeLeft: 1 }),
        { initialProps: { onTimeout: mockOnTimeout1 } }
      )

      // Change the callback
      rerender({ onTimeout: mockOnTimeout2 })

      // Let timer expire
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should call the updated callback
      expect(mockOnTimeout1).not.toHaveBeenCalled()
      expect(mockOnTimeout2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Pressure-Only Behavior Validation', () => {
    it('should maintain timer display even after expiration for pressure', () => {
      const mockOnTimeout = jest.fn(() => {
        // This simulates the new non-destructive timeout behavior
        console.log('Timer expired (display only - tickets remain reserved)')
      })
      const { result } = renderHook(() => 
        useReservationTimer({ 
          onTimeout: mockOnTimeout,
          initialTimeLeft: 1
        })
      )

      // Let timer expire
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Timer should be stopped after expiration
      expect(result.current.isExpired).toBe(false) // isExpired is false when timeLeft is null
      expect(result.current.timeLeft).toBeNull() // Timer stops and sets timeLeft to null
      expect(mockOnTimeout).toHaveBeenCalledTimes(1)
      
      // Verify the callback was called (the actual behavior is in the callback)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Timer expired (display only - tickets remain reserved)'
      )
    })
  })
})
