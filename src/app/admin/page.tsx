'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Ticket, DollarSign, Plus, List, LogOut, Settings, Check, X, Eye, Clock, BarChart3 } from 'lucide-react';
import CreateRaffleForm from '@/components/admin/CreateRaffleForm';
import RafflesList from '@/components/admin/RafflesList';
import AdminSettings from '@/components/admin/AdminSettings';
import TicketManager from '@/components/admin/TicketManager';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { useUpdateOrderStatus } from '@/hooks/useApi';

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
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  payment_deadline: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create-raffle' | 'manage-raffles' | 'tickets' | 'analytics' | 'settings'>('dashboard');
  
  const updateOrderStatus = useUpdateOrderStatus();

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      fetchDashboardData(); // Refresh data after update
    } catch (err) {
      console.error('Error deleting raffle:', err);
    }
  };

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
    } catch {
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
    } catch {
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md moto-card moto-border moto-red-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 moto-text-primary" />
              🏍️ MOTO ISLA Admin
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
                className="moto-card moto-border text-white"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              onClick={handleLogin}
              disabled={loading || !password}
              variant="primary"
              className="w-full"
            >
              {loading ? '🏍️ Verificando...' : '🏁 Ingresar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 moto-racing-stripe">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.open('/', '_blank')}
              className="moto-text-secondary hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              🏍️ Ver Sitio
            </Button>
            <h1 className="text-4xl font-bold text-white flex items-center gap-2 moto-red-glow">
              <Shield className="h-8 w-8 moto-text-primary" />
              MOTO ISLA Admin
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
          >
            <LogOut className="h-4 w-4 mr-2" />
            🏁 Cerrar Sesión
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Button
            onClick={() => setActiveTab('dashboard')}
            variant={activeTab === 'dashboard' ? 'primary' : 'outline'}
          >
            <Shield className="h-4 w-4 mr-2" />
            📊 Dashboard
          </Button>
          <Button
            onClick={() => setActiveTab('create-raffle')}
            variant={activeTab === 'create-raffle' ? 'primary' : 'outline'}
          >
            <Plus className="h-4 w-4 mr-2" />
            ➕ Crear Rifa
          </Button>
          <Button
            onClick={() => setActiveTab('manage-raffles')}
            variant={activeTab === 'manage-raffles' ? 'primary' : 'outline'}
          >
            <List className="h-4 w-4 mr-2" />
            📋 Gestionar Rifas
          </Button>
          <Button
            onClick={() => setActiveTab('tickets')}
            variant={activeTab === 'tickets' ? 'primary' : 'outline'}
          >
            <Ticket className="h-4 w-4 mr-2" />
            🎫 Gestionar Boletos
          </Button>
          <Button
            onClick={() => setActiveTab('analytics')}
            variant={activeTab === 'analytics' ? 'primary' : 'outline'}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            📈 Analíticas
          </Button>
          <Button
            onClick={() => setActiveTab('settings')}
            variant={activeTab === 'settings' ? 'primary' : 'outline'}
          >
            <Settings className="h-4 w-4 mr-2" />
            ⚙️ Configuración
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="moto-card moto-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="moto-text-secondary text-sm">🎫 Boletos Vendidos</p>
                        <p className="text-2xl font-bold text-white">{stats.soldTickets}</p>
                      </div>
                      <Ticket className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="moto-card moto-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="moto-text-secondary text-sm">⏰ Boletos Reservados</p>
                        <p className="text-2xl font-bold text-white">{stats.reservedTickets}</p>
                      </div>
                      <Clock className="h-8 w-8 moto-text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="moto-card moto-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="moto-text-secondary text-sm">📄 Órdenes Pendientes</p>
                        <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
                      </div>
                      <Users className="h-8 w-8 moto-text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="moto-card moto-border moto-red-glow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="moto-text-secondary text-sm">💰 Ingresos Totales</p>
                        <p className="text-2xl font-bold moto-text-primary">{formatCurrency(stats.totalRevenue)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Orders Table */}
            <Card className="moto-card moto-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>📋 Órdenes Recientes</span>
                  <Button
                    onClick={fetchDashboardData}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Actualizar
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
                          <th className="text-left py-3 px-2 text-slate-300">Acciones</th>
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
                            <td className="py-3 px-2">
                              <div className="flex gap-2">
                                {order.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                                      disabled={updateOrderStatus.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Pagado
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                      disabled={updateOrderStatus.isPending}
                                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancelar
                                    </Button>
                                  </>
                                )}
                                {order.status === 'paid' && (
                                  <Badge variant="default" className="bg-green-600">
                                    Completado
                                  </Badge>
                                )}
                                {order.status === 'cancelled' && (
                                  <Badge variant="destructive">
                                    Cancelado
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'create-raffle' && (
          <CreateRaffleForm 
            onSuccess={() => {
              setActiveTab('manage-raffles');
              fetchDashboardData();
            }}
          />
        )}

        {activeTab === 'manage-raffles' && (
          <RafflesList onRefresh={fetchDashboardData} />
        )}

        {activeTab === 'tickets' && (
          <TicketManager />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'settings' && (
          <AdminSettings />
        )}
      </div>
    </div>
  );
}
