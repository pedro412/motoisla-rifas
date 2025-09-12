import { supabaseConfig } from './supabase-config';

export interface TicketValidationResult {
  isValid: boolean;
  conflictingTickets: number[];
  conflictingOrders: string[];
  message: string;
}

/**
 * Validates that all tickets in an order are available (not already paid in another order)
 * @param ticketNumbers Array of ticket numbers to validate
 * @param raffleId The raffle ID these tickets belong to
 * @param excludeOrderId Optional order ID to exclude from validation (for updating existing orders)
 * @returns Promise<TicketValidationResult>
 */
export async function validateTicketAvailability(
  ticketNumbers: number[],
  raffleId: string,
  excludeOrderId?: string
): Promise<TicketValidationResult> {
  try {
    if (!supabaseConfig.serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    // Check if any of these tickets are already in paid orders (excluding the current order if provided)
    let query = `${supabaseConfig.url}/rest/v1/orders?raffle_id=eq.${raffleId}&status=eq.paid&select=id,tickets`;
    
    if (excludeOrderId) {
      query += `&id=neq.${excludeOrderId}`;
    }

    const response = await fetch(query, {
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const paidOrders = await response.json();
    
    const conflictingTickets: number[] = [];
    const conflictingOrders: string[] = [];

    // Check each paid order for ticket conflicts
    for (const order of paidOrders) {
      const orderTickets = order.tickets as number[];
      const conflicts = ticketNumbers.filter(ticket => orderTickets.includes(ticket));
      
      if (conflicts.length > 0) {
        conflictingTickets.push(...conflicts);
        conflictingOrders.push(order.id);
      }
    }

    // Remove duplicates
    const uniqueConflictingTickets = [...new Set(conflictingTickets)];
    const uniqueConflictingOrders = [...new Set(conflictingOrders)];

    const isValid = uniqueConflictingTickets.length === 0;
    
    let message = '';
    if (!isValid) {
      const ticketList = uniqueConflictingTickets
        .map(t => t.toString().padStart(3, '0'))
        .join(', ');
      message = `Tickets ${ticketList} are already sold in other orders: ${uniqueConflictingOrders.join(', ')}`;
    } else {
      message = 'All tickets are available';
    }

    return {
      isValid,
      conflictingTickets: uniqueConflictingTickets,
      conflictingOrders: uniqueConflictingOrders,
      message
    };

  } catch (error) {
    console.error('Error validating ticket availability:', error);
    return {
      isValid: false,
      conflictingTickets: [],
      conflictingOrders: [],
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates that tickets exist and are in the correct status for the operation
 * @param ticketNumbers Array of ticket numbers to validate
 * @param raffleId The raffle ID these tickets belong to
 * @param expectedStatus Expected status of the tickets ('free', 'reserved', 'paid')
 * @returns Promise<TicketValidationResult>
 */
export async function validateTicketStatus(
  ticketNumbers: number[],
  raffleId: string,
  expectedStatus: 'free' | 'reserved' | 'paid'
): Promise<TicketValidationResult> {
  try {
    if (!supabaseConfig.serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    const query = `${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffleId}&number=in.(${ticketNumbers.join(',')})&select=number,status`;

    const response = await fetch(query, {
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tickets: ${response.statusText}`);
    }

    interface TicketResponse {
      number: number;
      status: string;
    }
    
    const tickets: TicketResponse[] = await response.json();
    
    const invalidTickets: number[] = [];
    const foundTickets = new Set(tickets.map((t) => t.number));
    
    // Check for missing tickets
    const missingTickets = ticketNumbers.filter(num => !foundTickets.has(num));
    
    // Check for tickets with wrong status
    const wrongStatusTickets = tickets
      .filter((t) => t.status !== expectedStatus)
      .map((t) => t.number);

    invalidTickets.push(...missingTickets, ...wrongStatusTickets);

    const isValid = invalidTickets.length === 0;
    
    let message = '';
    if (!isValid) {
      if (missingTickets.length > 0) {
        message += `Missing tickets: ${missingTickets.map(t => t.toString().padStart(3, '0')).join(', ')}. `;
      }
      
      if (wrongStatusTickets.length > 0) {
        message += `Tickets not in ${expectedStatus} status: ${wrongStatusTickets.map(t => t.toString().padStart(3, '0')).join(', ')}.`;
      }
    } else {
      message = `All tickets are in ${expectedStatus} status`;
    }

    return {
      isValid,
      conflictingTickets: invalidTickets,
      conflictingOrders: [],
      message
    };

  } catch (error) {
    console.error('Error validating ticket status:', error);
    return {
      isValid: false,
      conflictingTickets: [],
      conflictingOrders: [],
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
