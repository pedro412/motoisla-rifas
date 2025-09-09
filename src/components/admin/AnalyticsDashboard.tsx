'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw,
  Target,
  Percent
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  averageOrderValue: number;
  ticketsSold: number;
  ticketsReserved: number;
  ticketsAvailable: number;
  dailyStats: {
    date: string;
    orders: number;
    revenue: number;
    ticketsSold: number;
  }[];
  hourlyStats: {
    hour: number;
    orders: number;
    revenue: number;
  }[];
  customerStats: {
    totalCustomers: number;
    repeatCustomers: number;
    averageTicketsPerCustomer: number;
  };
  paymentStats: {
    pending: number;
    paid: number;
    cancelled: number;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?range=${range}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-${range}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, fetchAnalytics]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Cargando analíticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analíticas y Reportes</h2>
          <p className="text-slate-400">Análisis detallado del rendimiento de las rifas</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${analytics.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Órdenes Totales</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.totalOrders}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Tasa de Conversión</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {analytics.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Valor Promedio</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      ${analytics.averageOrderValue.toFixed(0)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ingresos Diarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.dailyStats?.map((day: { date: string; orders: number; revenue: number }) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {new Date(day.date).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-sm">{day.orders} órdenes</span>
                        <span className="text-green-400 font-medium">${day.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Status Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estado de Boletos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Vendidos</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ 
                            width: `${(analytics.ticketsSold / (analytics.ticketsSold + analytics.ticketsReserved + analytics.ticketsAvailable)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-green-400 font-medium">{analytics.ticketsSold}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Reservados</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ 
                            width: `${(analytics.ticketsReserved / (analytics.ticketsSold + analytics.ticketsReserved + analytics.ticketsAvailable)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-yellow-400 font-medium">{analytics.ticketsReserved}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Disponibles</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full" 
                          style={{ 
                            width: `${(analytics.ticketsAvailable / (analytics.ticketsSold + analytics.ticketsReserved + analytics.ticketsAvailable)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-blue-400 font-medium">{analytics.ticketsAvailable}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer & Payment Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estadísticas de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total de Clientes</span>
                  <span className="text-white font-medium">{analytics.customerStats.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Clientes Recurrentes</span>
                  <span className="text-white font-medium">{analytics.customerStats.repeatCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Boletos por Cliente</span>
                  <span className="text-white font-medium">
                    {analytics.customerStats.averageTicketsPerCustomer.toFixed(1)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Estado de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-300">Pendientes</span>
                  <span className="text-yellow-400 font-medium">{analytics.paymentStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Pagados</span>
                  <span className="text-green-400 font-medium">{analytics.paymentStats.paid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Cancelados</span>
                  <span className="text-red-400 font-medium">{analytics.paymentStats.cancelled}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
