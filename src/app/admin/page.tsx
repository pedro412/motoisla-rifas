'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Ticket, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  LogOut
} from 'lucide-react';

interface AdminStats {
  totalTickets: number;
  soldTickets: number;
  reservedTickets: number;
  availableTickets: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

interface Order {
  id: string;
  tickets: string[];
  total: number;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  payment_deadline: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('adminAuth');
    if (adminAuth === 'authenticated') {
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        sessionStorage.setItem('adminAuth', 'authenticated');
        setIsAuthenticated(true);
        setPassword('');
        await fetchDashboardData();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setStats(null);
    setOrders([]);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch orders
      const ordersResponse = await fetch('/api/admin/orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch (error) {
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendiente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Completado</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-600">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Contraseña de administrador"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-slate-300 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Sitio
            </Button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Boletos Vendidos</p>
                    <p className="text-2xl font-bold text-white">{stats.soldTickets}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Boletos Reservados</p>
                    <p className="text-2xl font-bold text-white">{stats.reservedTickets}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Órdenes Pendientes</p>
                    <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Órdenes Recientes</span>
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Actualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-slate-400">Cargando órdenes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No hay órdenes disponibles
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-2 text-slate-300">ID</th>
                      <th className="text-left py-3 px-2 text-slate-300">Cliente</th>
                      <th className="text-left py-3 px-2 text-slate-300">Boletos</th>
                      <th className="text-left py-3 px-2 text-slate-300">Total</th>
                      <th className="text-left py-3 px-2 text-slate-300">Estado</th>
                      <th className="text-left py-3 px-2 text-slate-300">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-700/50">
                        <td className="py-3 px-2 text-slate-300 font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-2 text-white">
                          <div>
                            <p>{order.customer_name || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-300">
                          {order.tickets.join(', ')}
                        </td>
                        <td className="py-3 px-2 text-white font-medium">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3 px-2">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-xs">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
