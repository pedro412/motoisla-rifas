/**
 * Test script to validate ticket availability and check for existing conflicts
 * Run this to test the new validation system
 */

import { validateTicketAvailability } from '../lib/ticket-validation';
import { supabaseConfig } from '../lib/supabase-config';

async function findExistingConflicts() {
  console.log('🔍 Checking for existing ticket conflicts in the database...\n');

  try {
    // Get all paid orders
    const response = await fetch(`${supabaseConfig.url}/rest/v1/orders?status=eq.paid&select=id,tickets,raffle_id,customer_name`, {
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const paidOrders = await response.json();
    console.log(`Found ${paidOrders.length} paid orders`);

    // Check for conflicts between orders
    const conflicts: Array<{
      ticket: number;
      orders: Array<{ id: string; customer_name: string }>;
    }> = [];

    for (let i = 0; i < paidOrders.length; i++) {
      for (let j = i + 1; j < paidOrders.length; j++) {
        const order1 = paidOrders[i];
        const order2 = paidOrders[j];

        // Only check orders from the same raffle
        if (order1.raffle_id === order2.raffle_id) {
          const tickets1 = order1.tickets as number[];
          const tickets2 = order2.tickets as number[];

          const duplicates = tickets1.filter(ticket => tickets2.includes(ticket));

          for (const ticket of duplicates) {
            const existingConflict = conflicts.find(c => c.ticket === ticket);
            if (existingConflict) {
              existingConflict.orders.push({ id: order2.id, customer_name: order2.customer_name });
            } else {
              conflicts.push({
                ticket,
                orders: [
                  { id: order1.id, customer_name: order1.customer_name },
                  { id: order2.id, customer_name: order2.customer_name }
                ]
              });
            }
          }
        }
      }
    }

    if (conflicts.length > 0) {
      console.log('❌ CONFLICTS FOUND:');
      for (const conflict of conflicts) {
        console.log(`\n🎫 Ticket ${conflict.ticket.toString().padStart(3, '0')} is in multiple orders:`);
        for (const order of conflict.orders) {
          console.log(`   - Order ${order.id} (${order.customer_name})`);
        }
      }
    } else {
      console.log('✅ No conflicts found in existing paid orders');
    }

    return conflicts;

  } catch (error) {
    console.error('Error checking for conflicts:', error);
    return [];
  }
}

async function testValidationFunction() {
  console.log('\n🧪 Testing validation function...\n');

  try {
    // Get a sample raffle ID
    const rafflesResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles?select=id&limit=1`, {
      headers: supabaseConfig.headers
    });

    if (!rafflesResponse.ok) {
      throw new Error('Failed to fetch raffles');
    }

    const raffles = await rafflesResponse.json();
    if (raffles.length === 0) {
      console.log('No raffles found to test with');
      return;
    }

    const raffleId = raffles[0].id;
    console.log(`Testing with raffle ID: ${raffleId}`);

    // Test 1: Validate some tickets that should be available
    console.log('\n📝 Test 1: Validating available tickets [0, 1, 2]');
    const result1 = await validateTicketAvailability([0, 1, 2], raffleId);
    console.log(`Result: ${result1.isValid ? '✅' : '❌'} - ${result1.message}`);

    // Test 2: Get some tickets that are already paid and try to validate them
    const paidOrdersResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?raffle_id=eq.${raffleId}&status=eq.paid&select=tickets&limit=1`, {
      headers: supabaseConfig.headers
    });

    if (paidOrdersResponse.ok) {
      const paidOrders = await paidOrdersResponse.json();
      if (paidOrders.length > 0) {
        const paidTickets = paidOrders[0].tickets as number[];
        console.log(`\n📝 Test 2: Validating already paid tickets [${paidTickets.slice(0, 3).join(', ')}]`);
        const result2 = await validateTicketAvailability(paidTickets.slice(0, 3), raffleId);
        console.log(`Result: ${result2.isValid ? '✅' : '❌'} - ${result2.message}`);
        if (!result2.isValid) {
          console.log(`Conflicting orders: ${result2.conflictingOrders.join(', ')}`);
        }
      }
    }

  } catch (error) {
    console.error('Error testing validation function:', error);
  }
}

async function main() {
  console.log('🎯 Ticket Validation Test Script\n');
  console.log('================================\n');

  await findExistingConflicts();
  await testValidationFunction();

  console.log('\n✨ Test completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { findExistingConflicts, testValidationFunction };
