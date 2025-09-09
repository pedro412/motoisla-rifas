'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit, Calendar, DollarSign, Hash, ImageIcon, Users, X } from 'lucide-react';
import { raffleSchema, type RaffleFormData } from '@/lib/validations';
import { useRaffle, useUpdateRaffle } from '@/hooks/useApi';
import { useEffect } from 'react';

interface EditRaffleFormProps {
  raffleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditRaffleForm({ raffleId, onSuccess, onCancel }: EditRaffleFormProps) {
  const { data: raffle, isLoading } = useRaffle(raffleId);
  const updateRaffleMutation = useUpdateRaffle();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<RaffleFormData>({
    resolver: zodResolver(raffleSchema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      ticket_price: 50,
      total_tickets: 500,
      max_tickets_per_user: 10,
      draw_date: ''
    }
  });

  // Populate form when raffle data is loaded
  useEffect(() => {
    if (raffle) {
      setValue('title', raffle.title);
      setValue('description', raffle.description);
      setValue('image_url', raffle.image_url || '');
      setValue('ticket_price', raffle.ticket_price);
      setValue('total_tickets', raffle.total_tickets);
      setValue('max_tickets_per_user', raffle.max_tickets_per_user);
      
      // Format draw_date for datetime-local input
      if (raffle.draw_date) {
        const drawDate = new Date(raffle.draw_date);
        const formattedDate = drawDate.toISOString().slice(0, 16);
        setValue('draw_date', formattedDate);
      }
    }
  }, [raffle, setValue]);

  const onSubmit = (data: RaffleFormData) => {
    updateRaffleMutation.mutate({ raffleId, data }, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando rifa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!raffle) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-400">Rifa no encontrada</p>
            <Button onClick={onCancel} className="mt-4">
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Rifa
          </CardTitle>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Título de la Rifa *
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Rifa de Motocicleta 2024"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-slate-300 flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                URL de Imagen
              </Label>
              <Input
                id="image_url"
                {...register('image_url')}
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.image_url && (
                <p className="text-red-400 text-sm mt-1">{errors.image_url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Descripción *
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe los detalles de la rifa, el premio, términos y condiciones..."
              className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Pricing and Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_price" className="text-slate-300 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Precio por Boleto (MXN) *
              </Label>
              <Input
                id="ticket_price"
                {...register('ticket_price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="50.00"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.ticket_price && (
                <p className="text-red-400 text-sm mt-1">{errors.ticket_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_tickets" className="text-slate-300 flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Total de Boletos *
              </Label>
              <Input
                id="total_tickets"
                {...register('total_tickets', { valueAsNumber: true })}
                type="number"
                min="1"
                max="10000"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.total_tickets && (
                <p className="text-red-400 text-sm mt-1">{errors.total_tickets.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_tickets_per_user" className="text-slate-300 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Máx. por Usuario *
              </Label>
              <Input
                id="max_tickets_per_user"
                {...register('max_tickets_per_user', { valueAsNumber: true })}
                type="number"
                min="1"
                max="1000"
                placeholder="10"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.max_tickets_per_user && (
                <p className="text-red-400 text-sm mt-1">{errors.max_tickets_per_user.message}</p>
              )}
            </div>
          </div>

          {/* Draw Date */}
          <div className="space-y-2">
            <Label htmlFor="draw_date" className="text-slate-300 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Fecha del Sorteo *
            </Label>
            <Input
              id="draw_date"
              {...register('draw_date')}
              type="datetime-local"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {errors.draw_date && (
              <p className="text-red-400 text-sm mt-1">{errors.draw_date.message}</p>
            )}
          </div>

          {/* Warning about ticket changes */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              <strong>⚠️ Importante:</strong> Si cambias el número total de boletos:
            </p>
            <ul className="text-yellow-300 text-sm mt-2 space-y-1">
              <li>• Si aumentas: se crearán nuevos boletos disponibles</li>
              <li>• Si disminuyes: solo se eliminarán boletos libres (no vendidos/reservados)</li>
            </ul>
          </div>

          {updateRaffleMutation.error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                {updateRaffleMutation.error instanceof Error 
                  ? updateRaffleMutation.error.message 
                  : 'Error al actualizar la rifa'
                }
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateRaffleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              {updateRaffleMutation.isPending ? 'Actualizando...' : 'Actualizar Rifa'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
