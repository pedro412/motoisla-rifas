import { useState, useCallback } from 'react';
import { CartItem } from '@/lib/types';

export function useCart(raffleId?: string) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTicket = useCallback((ticketNumber: number, price: number) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.ticketNumber === ticketNumber);
      if (exists) return prev;
      
      return [...prev, {
        id: `ticket-${ticketNumber}`,
        ticketNumber,
        price,
        quantity: 1
      }];
    });
  }, []);

  const removeTicket = useCallback((ticketNumber: number) => {
    setCartItems(prev => prev.filter(item => item.ticketNumber !== ticketNumber));
  }, []);

  const toggleTicket = useCallback((ticketNumber: number, price: number) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.ticketNumber === ticketNumber);
      if (exists) {
        // Remove if already selected
        return prev.filter(item => item.ticketNumber !== ticketNumber);
      } else {
        // Add if not selected
        return [...prev, {
          id: `ticket-${ticketNumber}`,
          ticketNumber,
          price,
          quantity: 1
        }];
      }
    });
  }, []);

  const isTicketSelected = useCallback((ticketNumber: number) => {
    return cartItems.some(item => item.ticketNumber === ticketNumber);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getTicketNumbers = useCallback(() => {
    return cartItems.map(item => item.ticketNumber);
  }, [cartItems]);

  const submitOrder = async (customerInfo: { name: string; phone: string; email?: string }) => {
    if (cartItems.length === 0) return null;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffle_id: raffleId || '1', // Use the passed raffle ID or default to '1' for mock data
          ticket_numbers: cartItems.map(item => item.ticketNumber),
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const data = await response.json();
      
      // Save order data to localStorage for recovery
      const orderData = {
        orderId: data.order.id,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        ticketNumbers: cartItems.map(item => item.ticketNumber),
        totalAmount: getTotalPrice(),
        raffleName: 'Moto Isla Raffle'
      };
      
      localStorage.setItem('currentOrder', JSON.stringify(orderData));
      
      // Clear cart after successful submission
      clearCart();
      
      return {
        success: true,
        orderId: data.order.id
      };
    } catch (error) {
      console.error('Error submitting order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit order'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    cartItems,
    addTicket,
    removeTicket,
    toggleTicket,
    isTicketSelected,
    clearCart,
    getTotalPrice,
    getTicketNumbers,
    submitOrder,
    isSubmitting,
    itemCount: cartItems.length
  };
}
