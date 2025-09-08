'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Ticket, Search, Filter, RefreshCw, Trash2, Lock, Unlock } from 'lucide-react';
import { useAvailableTickets } from '@/hooks/useApi';

interface TicketInfo {
  id: string;
  number: string;
  status: 'free' | 'reserved' | 'sold';
  raffle_id: string;
  order_id?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

interface TicketManagerProps {
  raffleId?: string;
}

export default function TicketManager({ raffleId }: TicketManagerProps) {
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [currentRaffleId, setCurrentRaffleId] = useState(raffleId || '');

  const { data: availableTickets, refetch: refetchTickets } = useAvailableTickets(currentRaffleId);

  useEffect(() => {
    if (availableTickets) {
      // Transform available tickets data to include status information
      const ticketData = availableTickets.map((ticket: any) => ({
        id: ticket.id,
        number: ticket.number,
        status: ticket.status,
        raffle_id: ticket.raffle_id,
        order_id: ticket.order_id,
        customer_name: ticket.customer_name,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      }));
      setTickets(ticketData);
    }
  }, [availableTickets]);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.number.includes(searchTerm) || 
                         (ticket.customer_name && ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(t => t.id));
    }
  };

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleBulkStatusChange = async (newStatus: 'free' | 'reserved' | 'sold') => {
    if (selectedTickets.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tickets/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketIds: selectedTickets,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tickets');
      }

      // Refresh tickets data
      await refetchTickets();
      setSelectedTickets([]);
    } catch (error) {
      console.error('Error updating tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedTickets.length} boletos? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/tickets/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketIds: selectedTickets
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete tickets');
      }

      // Refresh tickets data
      await refetchTickets();
      setSelectedTickets([]);
    } catch (error) {
      console.error('Error deleting tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'free':
        return <Badge variant="outline" className="text-green-400 border-green-400">Libre</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Reservado</Badge>;
      case 'sold':
        return <Badge variant="outline" className="text-red-400 border-red-400">Vendido</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Gestión de Boletos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número de boleto o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="free">Libres</SelectItem>
                <SelectItem value="reserved">Reservados</SelectItem>
                <SelectItem value="sold">Vendidos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => refetchTickets()}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300 text-sm self-center">
                {selectedTickets.length} boletos seleccionados:
              </span>
              <Button
                onClick={() => handleBulkStatusChange('free')}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/20"
              >
                <Unlock className="h-4 w-4 mr-1" />
                Liberar
              </Button>
              <Button
                onClick={() => handleBulkStatusChange('reserved')}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
              >
                <Lock className="h-4 w-4 mr-1" />
                Reservar
              </Button>
              <Button
                onClick={() => handleBulkStatusChange('sold')}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600/20"
              >
                <Lock className="h-4 w-4 mr-1" />
                Marcar Vendido
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          )}

          {/* Tickets Table */}
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left text-slate-300 font-medium">Número</th>
                    <th className="p-3 text-left text-slate-300 font-medium">Estado</th>
                    <th className="p-3 text-left text-slate-300 font-medium">Cliente</th>
                    <th className="p-3 text-left text-slate-300 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-slate-700 hover:bg-slate-700/25">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedTickets.includes(ticket.id)}
                          onCheckedChange={() => handleTicketSelect(ticket.id)}
                        />
                      </td>
                      <td className="p-3 text-white font-mono">#{ticket.number}</td>
                      <td className="p-3">{getStatusBadge(ticket.status)}</td>
                      <td className="p-3 text-slate-300">
                        {ticket.customer_name || '-'}
                      </td>
                      <td className="p-3 text-slate-400 text-sm">
                        {new Date(ticket.updated_at).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No se encontraron boletos con los filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
