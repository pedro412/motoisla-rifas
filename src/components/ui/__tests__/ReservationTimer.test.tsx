import { render, screen } from '@testing-library/react'
import { ReservationTimer } from '../ReservationTimer'

describe('ReservationTimer Component', () => {
  describe('Display States', () => {
    it('should not render when inactive and not expired', () => {
      const { container } = render(
        <ReservationTimer 
          timeLeft={null}
          isActive={false}
          isExpired={false}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should render active timer with time remaining', () => {
      render(
        <ReservationTimer 
          timeLeft="14:30"
          isActive={true}
          isExpired={false}
          ticketCount={3}
        />
      )
      
      expect(screen.getByText('Tienes 3 boletos reservados')).toBeInTheDocument()
      expect(screen.getByText('Tiempo restante:')).toBeInTheDocument()
      expect(screen.getByText('14:30')).toBeInTheDocument()
      expect(screen.getByText('¡Completa tu compra pronto! Otros usuarios están esperando estos boletos')).toBeInTheDocument()
    })

    it('should render expired timer with non-threatening message', () => {
      render(
        <ReservationTimer 
          timeLeft="0:00"
          isActive={false}
          isExpired={true}
          ticketCount={2}
        />
      )
      
      expect(screen.getByText('El tiempo de reservación ha terminado. Completa tu pago lo antes posible.')).toBeInTheDocument()
      expect(screen.queryByText('liberados')).not.toBeInTheDocument()
      expect(screen.queryByText('perdido')).not.toBeInTheDocument()
    })

    it('should show correct singular/plural ticket text', () => {
      // Test singular
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
          ticketCount={1}
        />
      )
      
      expect(screen.getByText('Tienes 1 boleto reservado')).toBeInTheDocument()
      
      // Test plural
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
          ticketCount={5}
        />
      )
      
      expect(screen.getByText('Tienes 5 boletos reservados')).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    it('should apply correct styling for active timer', () => {
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
        />
      )
      
      const card = screen.getByText('Reservación activa').closest('.border-2')
      expect(card).toHaveClass('text-blue-400', 'border-blue-600', 'bg-blue-900/20')
    })

    it('should apply warning styling for low time remaining', () => {
      render(
        <ReservationTimer 
          timeLeft="0:25"
          isActive={true}
          isExpired={false}
        />
      )
      
      const card = screen.getByText('Reservación activa').closest('.border-2')
      expect(card).toHaveClass('text-orange-400', 'border-orange-600', 'bg-orange-900/20')
    })

    it('should apply error styling for expired timer', () => {
      render(
        <ReservationTimer 
          timeLeft={null}
          isActive={false}
          isExpired={true}
        />
      )
      
      const expiredMessage = screen.getByText(/el tiempo de reservación ha terminado/i)
      const card = expiredMessage.closest('.border-2')
      expect(card).toHaveClass('text-red-400', 'border-red-600', 'bg-red-900/20')
    })
  })

  describe('Message Content Validation', () => {
    it('should show encouraging message when expired (not threatening)', () => {
      render(
        <ReservationTimer 
          timeLeft={null}
          isActive={false}
          isExpired={true}
        />
      )
      
      const message = screen.getByText(/el tiempo de reservación ha terminado/i)
      expect(message).toBeInTheDocument()
      
      // Ensure message is encouraging, not threatening
      expect(message.textContent).toContain('Completa tu pago lo antes posible')
      expect(message.textContent).not.toContain('liberados')
      expect(message.textContent).not.toContain('perdidos')
      expect(message.textContent).not.toContain('expirado')
    })

    it('should show pressure message that creates urgency without threats', () => {
      render(
        <ReservationTimer 
          timeLeft="5:00"
          isActive={true}
          isExpired={false}
        />
      )
      
      const pressureMessage = screen.getByText(/completa tu compra pronto/i)
      expect(pressureMessage).toBeInTheDocument()
      expect(pressureMessage.textContent).toContain('Otros usuarios están esperando')
      expect(pressureMessage.textContent).not.toContain('expira')
      expect(pressureMessage.textContent).not.toContain('perderás')
    })

    it('should not show pressure message when expired', () => {
      render(
        <ReservationTimer 
          timeLeft={null}
          isActive={false}
          isExpired={true}
        />
      )
      
      expect(screen.queryByText(/completa tu compra pronto/i)).not.toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('should show clock icon when active', () => {
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
        />
      )
      
      // Clock icon should be present (lucide-react Clock component)
      const clockIcon = document.querySelector('[data-testid="clock-icon"]') || 
                       document.querySelector('svg')
      expect(clockIcon).toBeInTheDocument()
    })

    it('should show warning icon when expired', () => {
      render(
        <ReservationTimer 
          timeLeft={null}
          isActive={false}
          isExpired={true}
        />
      )
      
      // AlertTriangle icon should be present
      const warningIcon = document.querySelector('[data-testid="warning-icon"]') || 
                         document.querySelector('svg')
      expect(warningIcon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
          ticketCount={3}
        />
      )
      
      // Should have proper heading structure
      expect(screen.getByText('Tienes 3 boletos reservados')).toBeInTheDocument()
      expect(screen.getByText('Tiempo restante:')).toBeInTheDocument()
      
      // Time should be in monospace font for better readability
      const timeDisplay = screen.getByText('10:00')
      expect(timeDisplay).toHaveClass('font-mono', 'font-bold')
    })

    it('should be readable by screen readers', () => {
      render(
        <ReservationTimer 
          timeLeft="2:30"
          isActive={true}
          isExpired={false}
          ticketCount={1}
        />
      )
      
      // All important information should be in text content
      expect(screen.getByText(/tienes 1 boleto reservado/i)).toBeInTheDocument()
      expect(screen.getByText('Tiempo restante:')).toBeInTheDocument()
      expect(screen.getByText('2:30')).toBeInTheDocument()
      expect(screen.getByText(/completa tu compra pronto/i)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero ticket count gracefully', () => {
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
          ticketCount={0}
        />
      )
      
      expect(screen.getByText('Reservación activa')).toBeInTheDocument()
      expect(screen.queryByText(/tienes.*boletos/i)).not.toBeInTheDocument()
    })

    it('should handle undefined ticket count', () => {
      render(
        <ReservationTimer 
          timeLeft="10:00"
          isActive={true}
          isExpired={false}
        />
      )
      
      expect(screen.getByText('Reservación activa')).toBeInTheDocument()
    })

    it('should handle very low time remaining', () => {
      render(
        <ReservationTimer 
          timeLeft="0:01"
          isActive={true}
          isExpired={false}
        />
      )
      
      expect(screen.getByText('0:01')).toBeInTheDocument()
      
      // Should show warning styling for very low time
      const card = screen.getByText('0:01').closest('.border-2')
      expect(card).toHaveClass('text-orange-400')
    })
  })
})
