'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Clock, CreditCard, Phone, Database, Save, RefreshCw, Trash2 } from 'lucide-react';
import { useSettings, useUpdateSetting } from '@/hooks/useApi';

interface BankInfo {
  bank_name: string;
  account_holder: string;
  account_number: string;
  clabe: string;
}

export default function AdminSettings() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettingMutation = useUpdateSetting();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isManualCleanupLoading, setIsManualCleanupLoading] = useState(false);

  const handleSettingChange = (key: string, value: string | boolean) => {
    const stringValue = typeof value === 'boolean' ? value.toString() : value;
    setLocalSettings(prev => ({ ...prev, [key]: stringValue }));
    setHasChanges(true);
  };

  const handleSave = async (key: string) => {
    if (localSettings[key] !== undefined) {
      try {
        await updateSettingMutation.mutateAsync({
          [key]: localSettings[key]
        });
        setLocalSettings(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        setHasChanges(Object.keys(localSettings).length > 1);
      } catch (error) {
        console.error('Failed to update setting:', error);
        alert('Failed to update setting');
      }
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const [key, value] of Object.entries(localSettings)) {
        await updateSettingMutation.mutateAsync({ [key]: value });
      }
      setLocalSettings({});
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings');
    }
  };

  const getSettingValue = (key: string): string => {
    return localSettings[key] ?? settings?.[key]?.value ?? '';
  };

  const getBankInfo = (): BankInfo => {
    try {
      const bankInfoStr = getSettingValue('bank_info');
      return JSON.parse(bankInfoStr);
    } catch {
      return {
        bank_name: '',
        account_holder: '',
        account_number: '',
        clabe: ''
      };
    }
  };

  const updateBankInfo = (field: keyof BankInfo, value: string) => {
    const currentBankInfo = getBankInfo();
    const updatedBankInfo = { ...currentBankInfo, [field]: value };
    handleSettingChange('bank_info', JSON.stringify(updatedBankInfo));
  };

  const handleManualCleanup = async () => {
    setIsManualCleanupLoading(true);
    try {
      const response = await fetch('/api/cleanup', { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        alert(`Cleanup completed successfully!\nReleased tickets: ${result.releasedTickets}\nCancelled orders: ${result.cancelledOrders}`);
      } else {
        alert(`Cleanup failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      alert('Manual cleanup failed. Please try again.');
    } finally {
      setIsManualCleanupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-slate-400">Loading settings...</p>
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
            <p className="text-red-400 mb-4">Error loading settings</p>
            <Button onClick={() => refetch()} variant="outline" className="border-slate-600 text-slate-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bankInfo = getBankInfo();

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Admin Settings
          {hasChanges && (
            <Button
              onClick={handleSaveAll}
              size="sm"
              className="ml-auto bg-green-600 hover:bg-green-700"
              disabled={updateSettingMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700">
            <TabsTrigger value="orders" className="data-[state=active]:bg-slate-600">
              <Clock className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-slate-600">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-slate-600">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-slate-600">
              <Database className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reservation_timeout" className="text-slate-300">
                  Reservation Timeout (minutes)
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="reservation_timeout"
                    type="number"
                    min="5"
                    max="60"
                    value={getSettingValue('reservation_timeout_minutes')}
                    onChange={(e) => handleSettingChange('reservation_timeout_minutes', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white max-w-32"
                  />
                  <Button
                    onClick={() => handleSave('reservation_timeout_minutes')}
                    size="sm"
                    disabled={!localSettings['reservation_timeout_minutes'] || updateSettingMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  How long customers have to complete their payment
                </p>
              </div>

              <div>
                <Label htmlFor="max_tickets" className="text-slate-300">
                  Maximum Tickets per Order
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="max_tickets"
                    type="number"
                    min="1"
                    max="50"
                    value={getSettingValue('max_tickets_per_order')}
                    onChange={(e) => handleSettingChange('max_tickets_per_order', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white max-w-32"
                  />
                  <Button
                    onClick={() => handleSave('max_tickets_per_order')}
                    size="sm"
                    disabled={!localSettings['max_tickets_per_order'] || updateSettingMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Maximum number of tickets a customer can buy in one order
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Bank Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name" className="text-slate-300">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={bankInfo.bank_name}
                    onChange={(e) => updateBankInfo('bank_name', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="account_holder" className="text-slate-300">Account Holder</Label>
                  <Input
                    id="account_holder"
                    value={bankInfo.account_holder}
                    onChange={(e) => updateBankInfo('account_holder', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="account_number" className="text-slate-300">Account Number</Label>
                  <Input
                    id="account_number"
                    value={bankInfo.account_number}
                    onChange={(e) => updateBankInfo('account_number', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clabe" className="text-slate-300">CLABE</Label>
                  <Input
                    id="clabe"
                    value={bankInfo.clabe}
                    onChange={(e) => updateBankInfo('clabe', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSave('bank_info')}
                disabled={!localSettings['bank_info'] || updateSettingMutation.isPending}
                className="mt-4"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Bank Information
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 mt-6">
          </TabsContent>

          <TabsContent value="system" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Maintenance Mode</Label>
                  <p className="text-sm text-slate-400">
                    Enable to temporarily disable public access
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('site_maintenance') === 'true'}
                  onCheckedChange={(checked: boolean) => handleSettingChange('site_maintenance', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Auto Cleanup</Label>
                  <p className="text-sm text-slate-400">
                    Automatically release expired ticket reservations (DISABLED for manual control)
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('auto_cleanup_enabled') === 'true'}
                  onCheckedChange={(checked: boolean) => handleSettingChange('auto_cleanup_enabled', checked)}
                />
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Manual Cleanup</Label>
                    <p className="text-sm text-slate-400">
                      Manually release expired reservations and cancel expired orders
                    </p>
                  </div>
                  <Button
                    onClick={handleManualCleanup}
                    disabled={isManualCleanupLoading}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isManualCleanupLoading ? 'Running...' : 'Run Cleanup'}
                  </Button>
                </div>
              </div>

              {(localSettings['site_maintenance'] || localSettings['auto_cleanup_enabled']) && (
                <Button
                  onClick={handleSaveAll}
                  disabled={updateSettingMutation.isPending}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save System Settings
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
