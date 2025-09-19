'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, MessageCircle, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { sendFollowUpMessage, sendPaymentConfirmationMessage, WhatsAppMessageData } from '@/lib/whatsapp';
import { useDeleteOrder } from '@/hooks/useApi';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  tickets: string[];
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  payment_deadline: string;
  raffle?: {
    title: string;
  };
}

interface OrderActionsMenuProps {
  order: Order;
  raffleName?: string;
}

export default function OrderActionsMenu({ order, raffleName = 'Moto Isla Raffle' }: OrderActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteOrder = useDeleteOrder();

  const handleShowOrder = () => {
    const checkoutUrl = `/checkout?orderId=${order.id}`;
    window.open(checkoutUrl, '_blank');
    setIsOpen(false);
  };

  const handleSendFollowUp = () => {
    const ticketNumbers = order.tickets.map(ticket => parseInt(ticket));
    
    const messageData: WhatsAppMessageData = {
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      orderId: order.id,
      ticketNumbers: ticketNumbers,
      totalAmount: order.total_amount,
      raffleName: order.raffle?.title || raffleName
    };

    sendFollowUpMessage(messageData);
    setIsOpen(false);
  };

  const handleSendConfirmation = () => {
    const ticketNumbers = order.tickets.map(ticket => parseInt(ticket));
    
    const messageData: WhatsAppMessageData = {
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      orderId: order.id,
      ticketNumbers: ticketNumbers,
      totalAmount: order.total_amount,
      raffleName: order.raffle?.title || raffleName
    };

    sendPaymentConfirmationMessage(messageData);
    setIsOpen(false);
  };

  const handleDeleteOrder = () => {
    setIsOpen(false);
    setShowDeleteDialog(true);
  };

  const confirmDeleteOrder = async () => {
    try {
      await deleteOrder.mutateAsync(order.id);
      setShowDeleteDialog(false);
      // Success feedback will be handled by the parent component refresh
    } catch (error) {
      console.error('Error deleting order:', error);
      // Error handling - could add toast notification here
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0 hover:bg-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-8 z-20 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1">
            <button
              onClick={handleShowOrder}
              className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-3" />
              Ver orden
              <ExternalLink className="h-3 w-3 ml-auto" />
            </button>

            <button
              onClick={handleSendFollowUp}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                !order.customer_phone
                  ? 'text-slate-500 cursor-not-allowed bg-slate-800/50'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              disabled={!order.customer_phone}
              title={
                !order.customer_phone 
                  ? 'Sin número de teléfono' 
                  : 'Enviar ayuda de pago por WhatsApp'
              }
            >
              <MessageCircle className={`h-4 w-4 mr-3 ${
                !order.customer_phone ? 'text-slate-600' : ''
              }`} />
              Enviar ayuda de pago
            </button>

            <button
              onClick={handleSendConfirmation}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                !order.customer_phone || order.status !== 'paid'
                  ? 'text-slate-500 cursor-not-allowed bg-slate-800/50'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              disabled={!order.customer_phone || order.status !== 'paid'}
              title={
                !order.customer_phone 
                  ? 'Sin número de teléfono' 
                  : order.status !== 'paid' 
                  ? 'Solo disponible para órdenes pagadas' 
                  : 'Enviar confirmación de pago por WhatsApp'
              }
            >
              <CheckCircle className={`h-4 w-4 mr-3 ${
                !order.customer_phone || order.status !== 'paid'
                  ? 'text-slate-600'
                  : ''
              }`} />
              Confirmar pago
            </button>

            {/* Separator */}
            <div className="border-t border-slate-600 my-1"></div>

            {/* Delete Order - Danger Action */}
            <button
              onClick={handleDeleteOrder}
              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300"
              title="Eliminar orden (libera boletos y ajusta ingresos)"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Eliminar orden
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteOrder}
        title="Eliminar Orden"
        message={`¿Estás seguro de que quieres eliminar esta orden?

• Cliente: ${order.customer_name}
• Boletos: ${order.tickets.join(', ')}
• Total: $${order.total_amount.toLocaleString()} MXN

Esta acción:
- Liberará los boletos para que otros puedan comprarlos
- Ajustará los ingresos totales
- No se puede deshacer`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteOrder.isPending}
      />
    </div>
  );
}
