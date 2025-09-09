import { renderHook, act } from '@testing-library/react'
import { useCart } from '../useCart'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Ticket Selection and Limits', () => {
    it('should add tickets up to the maximum limit', () => {
      const { result } = renderHook(() => useCart('raffle-1', 3))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(2, 100)
        result.current.addTicket(3, 100)
      })

      expect(result.current.cartItems).toHaveLength(3)
      expect(result.current.itemCount).toBe(3)
    })

    it('should not add tickets beyond the maximum limit', () => {
      const { result } = renderHook(() => useCart('raffle-1', 2))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(2, 100)
        result.current.addTicket(3, 100) // This should be ignored
      })

      expect(result.current.cartItems).toHaveLength(2)
      expect(result.current.itemCount).toBe(2)
      expect(result.current.getTicketNumbers()).toEqual([1, 2])
    })

    it('should not add duplicate tickets', () => {
      const { result } = renderHook(() => useCart('raffle-1', 5))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(1, 100) // Duplicate
      })

      expect(result.current.cartItems).toHaveLength(1)
      expect(result.current.itemCount).toBe(1)
    })

    it('should toggle tickets correctly', () => {
      const { result } = renderHook(() => useCart('raffle-1', 5))

      // Add ticket
      act(() => {
        result.current.toggleTicket(1, 100)
      })

      expect(result.current.cartItems).toHaveLength(1)
      expect(result.current.isTicketSelected(1)).toBe(true)

      // Remove ticket
      act(() => {
        result.current.toggleTicket(1, 100)
      })

      expect(result.current.cartItems).toHaveLength(0)
      expect(result.current.isTicketSelected(1)).toBe(false)
    })

    it('should not toggle tickets beyond maximum limit', () => {
      const { result } = renderHook(() => useCart('raffle-1', 2))

      act(() => {
        result.current.toggleTicket(1, 100)
        result.current.toggleTicket(2, 100)
        result.current.toggleTicket(3, 100) // Should be ignored
      })

      expect(result.current.cartItems).toHaveLength(2)
      expect(result.current.isTicketSelected(3)).toBe(false)
    })

    it('should remove tickets correctly', () => {
      const { result } = renderHook(() => useCart('raffle-1', 5))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(2, 100)
        result.current.removeTicket(1)
      })

      expect(result.current.cartItems).toHaveLength(1)
      expect(result.current.getTicketNumbers()).toEqual([2])
    })

    it('should clear all tickets', () => {
      const { result } = renderHook(() => useCart('raffle-1', 5))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(2, 100)
        result.current.clearCart()
      })

      expect(result.current.cartItems).toHaveLength(0)
      expect(result.current.itemCount).toBe(0)
    })

    it('should calculate total price correctly', () => {
      const { result } = renderHook(() => useCart('raffle-1', 5))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(2, 150)
      })

      expect(result.current.getTotalPrice()).toBe(250)
    })
  })

  describe('Order Submission', () => {
    it('should submit order successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order: { id: 'order-123' } })
      })

      const { result } = renderHook(() => useCart('raffle-1', 5))

      act(() => {
        result.current.addTicket(1, 100)
        result.current.addTicket(2, 100)
      })

      let submitResult: { success: boolean; orderId?: string; error?: string } = { success: false }
      await act(async () => {
        submitResult = await result.current.submitOrder({
          name: 'John Doe',
          phone: '1234567890',
          email: 'john@example.com'
        })
      })

      expect(submitResult.success).toBe(true)
      expect(submitResult.orderId).toBe('order-123')
      expect(result.current.cartItems).toHaveLength(0) // Cart should be cleared
    })

    it('should handle order submission failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Order failed' })
      })

      const { result } = renderHook(() => useCart('raffle-1', 5))

      act(() => {
        result.current.addTicket(1, 100)
      })

      let submitResult: { success: boolean; orderId?: string; error?: string } = { success: true }
      await act(async () => {
        submitResult = await result.current.submitOrder({
          name: 'John Doe',
          phone: '1234567890'
        })
      })

      expect(submitResult.success).toBe(false)
      expect(submitResult.error).toBeDefined()
      expect(result.current.cartItems).toHaveLength(1) // Cart should not be cleared
    })

    it('should not submit empty cart', async () => {
      const { result } = renderHook(() => useCart('raffle-1', 5))

      let submitResult: { success: boolean; orderId?: string; error?: string } = { success: true }
      await act(async () => {
        submitResult = await result.current.submitOrder({
          name: 'John Doe',
          phone: '1234567890'
        })
      })

      expect(submitResult.success).toBe(false)
      expect(submitResult.error).toBe('No hay boletos en el carrito')
    })
  })
})
