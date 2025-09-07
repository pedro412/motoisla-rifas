'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, DollarSign, Hash, ImageIcon } from 'lucide-react';

interface CreateRaffleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateRaffleForm({ onSuccess, onCancel }: CreateRaffleFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    start_date: '',
    end_date: '',
    ticket_price: '',
    total_tickets: '500',
    draw_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.ticket_price || !formData.start_date || !formData.end_date) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const drawDate = formData.draw_date ? new Date(formData.draw_date) : null;

      if (startDate >= endDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      if (drawDate && drawDate <= endDate) {
        throw new Error('La fecha del sorteo debe ser posterior a la fecha de fin');
      }

      // Validate ticket price and count
      const ticketPrice = parseFloat(formData.ticket_price);
      const totalTickets = parseInt(formData.total_tickets);

      if (ticketPrice <= 0) {
        throw new Error('El precio del boleto debe ser mayor a 0');
      }

      if (totalTickets <= 0 || totalTickets > 10000) {
        throw new Error('El número de boletos debe estar entre 1 y 10,000');
      }

      const response = await fetch('/api/admin/raffles-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ticket_price: ticketPrice,
          total_tickets: totalTickets,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          draw_date: drawDate ? drawDate.toISOString() : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la rifa');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        image_url: '',
        start_date: '',
        end_date: '',
        ticket_price: '',
        total_tickets: '500',
        draw_date: ''
      });

      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Título de la Rifa *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ej: Rifa de Motocicleta 2024"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-slate-300 flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                URL de Imagen
              </Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Descripción *
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe los detalles de la rifa, el premio, términos y condiciones..."
              className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              required
            />
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
                name="ticket_price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.ticket_price}
                onChange={handleInputChange}
                placeholder="50.00"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_tickets" className="text-slate-300 flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Total de Boletos *
              </Label>
              <Input
                id="total_tickets"
                name="total_tickets"
                type="number"
                min="1"
                max="10000"
                value={formData.total_tickets}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-slate-300 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha de Inicio *
              </Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-slate-300 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha de Fin *
              </Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draw_date" className="text-slate-300 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha del Sorteo
              </Label>
              <Input
                id="draw_date"
                name="draw_date"
                type="datetime-local"
                value={formData.draw_date}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Creando...' : 'Crear Rifa'}
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
