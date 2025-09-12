"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Raffle, Ticket } from '@/lib/types';

// Types
interface CartItem {
  id: string;
  ticketNumber: number;
  price: number;
  quantity: number;
}

interface ActiveOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  ticketNumbers: number[];
  totalAmount: number;
  raffleName: string;
}

interface RaffleState {
  raffle: Raffle | null;
  tickets: Ticket[];
  cartItems: CartItem[];
  activeOrder: ActiveOrder | null;
  loading: boolean;
  error: string | null;
}

// Actions
type RaffleAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RAFFLE'; payload: Raffle | null }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'ADD_TO_CART'; payload: { ticketNumber: number; price: number } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ACTIVE_ORDER'; payload: ActiveOrder | null }
  | { type: 'REFRESH_TICKETS' };

// Initial state
const initialState: RaffleState = {
  raffle: null,
  tickets: [],
  cartItems: [],
  activeOrder: null,
  loading: true,
  error: null,
};

// Reducer
function raffleReducer(state: RaffleState, action: RaffleAction): RaffleState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_RAFFLE':
      return { ...state, raffle: action.payload };
    
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload, loading: false };
    
    case 'ADD_TO_CART': {
      const { ticketNumber, price } = action.payload;
      const existingItem = state.cartItems.find(item => item.ticketNumber === ticketNumber);
      
      if (existingItem) {
        return state; // Already in cart
      }
      
      const newItem: CartItem = {
        id: `ticket-${ticketNumber}`,
        ticketNumber,
        price,
        quantity: 1,
      };
      
      return {
        ...state,
        cartItems: [...state.cartItems, newItem],
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.ticketNumber !== action.payload),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: [],
      };
    
    case 'SET_ACTIVE_ORDER':
      return {
        ...state,
        activeOrder: action.payload,
      };
    
    case 'REFRESH_TICKETS':
      // This will trigger a re-fetch in the effect
      return { ...state, loading: true };
    
    default:
      return state;
  }
}

// Context
interface RaffleContextType {
  state: RaffleState;
  actions: {
    addToCart: (ticketNumber: number, price: number) => void;
    removeFromCart: (ticketNumber: number) => void;
    toggleTicket: (ticketNumber: number, price: number) => void;
    clearCart: () => void;
    setActiveOrder: (order: ActiveOrder | null) => void;
    refreshTickets: () => Promise<void>;
    getTotalPrice: () => number;
    getTicketNumbers: () => number[];
    isTicketInCart: (ticketNumber: number) => boolean;
  };
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

// Provider
interface RaffleProviderProps {
  children: ReactNode;
}

export function RaffleProvider({ children }: RaffleProviderProps) {
  const [state, dispatch] = useReducer(raffleReducer, initialState);

  // Fetch raffle and tickets
  const fetchRaffleData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch('/api/raffles');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const raffles = await response.json();
      const activeRaffle = raffles[0]; // Get the first active raffle

      if (!activeRaffle) {
        dispatch({ type: 'SET_RAFFLE', payload: null });
        dispatch({ type: 'SET_TICKETS', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        return; // Don't throw error, just set empty state
      }

      dispatch({ type: 'SET_RAFFLE', payload: activeRaffle });

      // Fetch tickets for this raffle
      const ticketsResponse = await fetch(`/api/tickets?raffle_id=${activeRaffle.id}`);
      if (!ticketsResponse.ok) {
        throw new Error('Failed to fetch tickets data');
      }
      const ticketsData = await ticketsResponse.json();
      dispatch({ type: 'SET_TICKETS', payload: ticketsData || [] });
    } catch (error) {
      console.error('Error fetching raffle data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Check for active order
  const checkActiveOrder = async () => {
    const savedOrder = localStorage.getItem("currentOrder");
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        const response = await fetch(`/api/orders/${parsedOrder.orderId}`);

        if (response.ok) {
          const { valid, expired, paid } = await response.json();
          if (valid && !expired && !paid) {
            dispatch({ type: 'SET_ACTIVE_ORDER', payload: parsedOrder });
          } else {
            localStorage.removeItem("currentOrder");
            dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
          }
        } else {
          localStorage.removeItem("currentOrder");
          dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
        }
      } catch (error) {
        console.error("Error checking active order:", error);
        localStorage.removeItem("currentOrder");
        dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
      }
    }
  };

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await fetchRaffleData();
      await checkActiveOrder();
    };
    initializeData();
  }, []);

  // Actions
  const actions = {
    addToCart: (ticketNumber: number, price: number) => {
      if (state.activeOrder) return; // Prevent adding to cart if there's an active order
      if (state.cartItems.length >= (state.raffle?.max_tickets_per_user || 20)) return;
      dispatch({ type: 'ADD_TO_CART', payload: { ticketNumber, price } });
    },

    removeFromCart: (ticketNumber: number) => {
      dispatch({ type: 'REMOVE_FROM_CART', payload: ticketNumber });
    },

    toggleTicket: (ticketNumber: number, price: number) => {
      const isInCart = state.cartItems.some(item => item.ticketNumber === ticketNumber);
      if (isInCart) {
        actions.removeFromCart(ticketNumber);
      } else {
        actions.addToCart(ticketNumber, price);
      }
    },

    clearCart: () => {
      dispatch({ type: 'CLEAR_CART' });
    },

    setActiveOrder: (order: ActiveOrder | null) => {
      dispatch({ type: 'SET_ACTIVE_ORDER', payload: order });
      if (order) {
        localStorage.setItem("currentOrder", JSON.stringify(order));
      } else {
        localStorage.removeItem("currentOrder");
      }
    },

    refreshTickets: async () => {
      await fetchRaffleData();
    },

    getTotalPrice: () => {
      return state.cartItems.reduce((sum, item) => sum + item.price, 0);
    },

    getTicketNumbers: () => {
      return state.cartItems.map(item => item.ticketNumber);
    },

    isTicketInCart: (ticketNumber: number) => {
      return state.cartItems.some(item => item.ticketNumber === ticketNumber);
    },
  };

  return (
    <RaffleContext.Provider value={{ state, actions }}>
      {children}
    </RaffleContext.Provider>
  );
}

// Hook
export function useRaffleContext() {
  const context = useContext(RaffleContext);
  if (context === undefined) {
    throw new Error('useRaffleContext must be used within a RaffleProvider');
  }
  return context;
}
