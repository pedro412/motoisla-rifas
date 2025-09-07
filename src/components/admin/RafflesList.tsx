'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  DollarSign, 
  Hash, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useRaffles, useDeleteRaffle } from '@/hooks/useApi';


interface RafflesListProps {
  onRefresh?: () => void;
}

export default function RafflesList({ onRefresh }: RafflesListProps) {
  const { data: raffles = [], isLoading: loading, error, refetch } = useRaffles();
  const deleteRaffleMutation = useDeleteRaffle();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Activa</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const handleDeleteRaffle = async (raffleId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta rifa?')) {
      try {
        await deleteRaffleMutation.mutateAsync(raffleId);
      } catch (error) {
        console.error('Error deleting raffle:', error);
        alert('Error al cancelar la rifa');
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando rifas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">
              {error instanceof Error ? error.message : 'Error al cargar las rifas'}
            </p>
            <Button onClick={handleRefresh} variant="outline" className="border-slate-600 text-slate-300">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Rifas Existentes</span>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {raffles.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No hay rifas creadas</p>
            <p className="text-sm">Crea tu primera rifa usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="space-y-4">
            {raffles.map((raffle) => (
              <div
                key={raffle.id}
                className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg">{raffle.title}</h3>
                      {getStatusBadge(raffle.status)}
                    </div>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                      {raffle.description}
                    </p>
                  </div>
                  {raffle.image_url && (
                    <div className="ml-4">
                      <img
                        src={raffle.image_url}
                        alt={raffle.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">{formatCurrency(raffle.ticket_price)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm">{raffle.total_tickets} boletos</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Inicio: {formatDate(raffle.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Fin: {formatDate(raffle.end_date)}</span>
                  </div>
                </div>

                {raffle.draw_date && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Sorteo: {formatDate(raffle.draw_date)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-600">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-600"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {raffle.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRaffle(raffle.id)}
                      disabled={deleteRaffleMutation.isPending}
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteRaffleMutation.isPending ? 'Cancelando...' : 'Cancelar'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
