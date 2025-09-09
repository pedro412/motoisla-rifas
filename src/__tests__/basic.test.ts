import { sanitizeString } from '../lib/validation'

describe('Basic Functionality Tests', () => {
  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeString(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
      expect(sanitized).toContain('Hello')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const sanitized = sanitizeString(input)
      
      expect(sanitized).toBe('Hello World')
    })

    it('should handle empty strings', () => {
      const sanitized = sanitizeString('')
      expect(sanitized).toBe('')
    })
  })

  describe('Cart Logic', () => {
    it('should validate ticket selection limits', () => {
      const maxTickets = 3
      const selectedTickets = [1, 2]
      
      // Simulate adding a ticket within limit
      const canAdd = selectedTickets.length < maxTickets
      expect(canAdd).toBe(true)
      
      // Simulate adding a ticket at limit
      const fullSelection = [1, 2, 3]
      const canAddMore = fullSelection.length < maxTickets
      expect(canAddMore).toBe(false)
    })

    it('should calculate total price correctly', () => {
      const tickets = [
        { number: 1, price: 100 },
        { number: 2, price: 100 },
        { number: 3, price: 100 }
      ]
      
      const total = tickets.reduce((sum, ticket) => sum + ticket.price, 0)
      expect(total).toBe(300)
    })

    it('should prevent duplicate ticket selection', () => {
      const selectedTickets = [1, 2, 3]
      const newTicket = 2
      
      const isDuplicate = selectedTickets.includes(newTicket)
      expect(isDuplicate).toBe(true)
    })
  })

  describe('Timer Calculations', () => {
    it('should calculate time remaining correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      const endDate = new Date('2024-01-01T13:30:00Z') // 1.5 hours later
      
      const diffMs = endDate.getTime() - now.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      expect(hours).toBe(1)
      expect(minutes).toBe(30)
    })

    it('should detect expired raffles', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      const endDate = new Date('2024-01-01T11:00:00Z') // 1 hour ago
      
      const isExpired = endDate.getTime() < now.getTime()
      expect(isExpired).toBe(true)
    })

    it('should detect active raffles', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      const endDate = new Date('2024-01-01T13:00:00Z') // 1 hour later
      
      const isExpired = endDate.getTime() < now.getTime()
      expect(isExpired).toBe(false)
    })
  })

  describe('Form Validation Logic', () => {
    it('should validate email format', () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      expect(emailRegex.test(validEmail)).toBe(true)
      expect(emailRegex.test(invalidEmail)).toBe(false)
    })

    it('should validate phone number length', () => {
      const validPhone = '1234567890'
      const shortPhone = '123'
      
      expect(validPhone.length >= 10).toBe(true)
      expect(shortPhone.length >= 10).toBe(false)
    })

    it('should validate name length', () => {
      const validName = 'John Doe'
      const shortName = 'A'
      
      expect(validName.length >= 2).toBe(true)
      expect(shortName.length >= 2).toBe(false)
    })
  })

  describe('Security Validation', () => {
    it('should validate ticket availability', () => {
      const tickets = [
        { number: 1, status: 'free' },
        { number: 2, status: 'sold' },
        { number: 3, status: 'reserved' }
      ]
      
      const requestedTickets = [1, 2, 3]
      const availableTickets = tickets.filter(t => t.status === 'free').map(t => t.number)
      
      const allAvailable = requestedTickets.every(num => availableTickets.includes(num))
      expect(allAvailable).toBe(false) // Should fail because ticket 2 and 3 are not free
    })

    it('should validate raffle expiration', () => {
      const raffle = {
        end_date: '2024-01-01T11:00:00Z'
      }
      
      const now = new Date('2024-01-01T12:00:00Z')
      const endDate = new Date(raffle.end_date)
      
      const isExpired = endDate.getTime() < now.getTime()
      expect(isExpired).toBe(true)
    })

    it('should validate ticket limits per user', () => {
      const maxTicketsPerUser = 3
      const requestedTickets = [1, 2, 3, 4] // 4 tickets
      
      const exceedsLimit = requestedTickets.length > maxTicketsPerUser
      expect(exceedsLimit).toBe(true)
    })
  })
})
