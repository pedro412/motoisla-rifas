'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, DollarSign, Hash, ImageIcon } from 'lucide-react';
import { raffleSchema, type RaffleFormData } from '@/lib/validations';
import { useCreateRaffle } from '@/hooks/useApi';


interface CreateRaffleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateRaffleForm({ onSuccess, onCancel }: CreateRaffleFormProps) {
  const createRaffleMutation = useCreateRaffle();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RaffleFormData>({
    resolver: zodResolver(raffleSchema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      ticket_price: 50,
      total_tickets: 500,
      draw_date: ''
    }
  });

  const onSubmit = (data: RaffleFormData) => {
    createRaffleMutation.mutate(data, {
      onSuccess: () => {
        reset();
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Crear Nueva Rifa
        </CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {createRaffleMutation.error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                {createRaffleMutation.error instanceof Error 
                  ? createRaffleMutation.error.message 
                  : 'Error al crear la rifa'
                }
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createRaffleMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createRaffleMutation.isPending ? 'Creando...' : 'Crear Rifa'}
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
