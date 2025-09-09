import { useState, useCallback } from 'react';
import { CartItem } from '@/lib/types';

export function useCart(raffleId?: string, maxTicketsPerUser: number = 20) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTicket = useCallback((ticketNumber: number, price: number) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.ticketNumber === ticketNumber);
      if (exists) return prev;
      
      // Check if adding this ticket would exceed the maximum limit
      if (prev.length >= maxTicketsPerUser) {
        return prev;
      }
      
      return [...prev, {
        id: `ticket-${ticketNumber}`,
        ticketNumber,
        price,
        quantity: 1
      }];
    });
  }, [maxTicketsPerUser]);

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
        // Check if adding this ticket would exceed the maximum limit
        if (prev.length >= maxTicketsPerUser) {
          return prev;
        }
        // Add if not selected
        return [...prev, {
          id: `ticket-${ticketNumber}`,
          ticketNumber,
          price,
          quantity: 1
        }];
      }
    });
  }, [maxTicketsPerUser]);

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

  const submitOrder = useCallback(async (customerInfo: { name: string; phone?: string; email?: string }): Promise<{ success: boolean; error?: string; orderId?: string }> => {
    if (cartItems.length === 0) return { success: false, error: 'No hay boletos en el carrito' };
    if (!raffleId) return { success: false, error: 'ID de rifa requerido' };

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffle_id: raffleId,
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
  }, [cartItems, raffleId, getTotalPrice, clearCart]);

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
