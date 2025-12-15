import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import type { User } from '../../utils/types/user';

interface LoginAlertsProps {
  user: User | null;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  priority: number;
}

const LoginAlerts = ({ user }: LoginAlertsProps) => {
  const [hasShownAlerts, setHasShownAlerts] = useState(false);

  useEffect(() => {
    if (user && !hasShownAlerts) {
      loadAlerts();
      setHasShownAlerts(true);
    }
  }, [user, hasShownAlerts]);

  const loadAlerts = async () => {
    try {
      const alertsToShow: Alert[] = [];

      // 1. Verificar rentas pendientes de devolución
      const { data: pendingReturns, error: returnsError } = await supabase
        .from('Orders')
        .select('id, due_date, delivery_date, status')
        .in('status', ['active', 'pending'])
        .lte('due_date', new Date().toISOString().split('T')[0]);

      if (!returnsError && pendingReturns && pendingReturns.length > 0) {
        alertsToShow.push({
          id: 'pending-returns',
          type: 'warning',
          message: `Tienes ${pendingReturns.length} renta(s) con devolución pendiente`,
          priority: 1,
        });
      }

      // 2. Verificar entregas próximas (próximos 2 días)
      const today = new Date();
      const twoDaysLater = new Date(today);
      twoDaysLater.setDate(today.getDate() + 2);
      
      const { data: upcomingDeliveries, error: deliveriesError } = await supabase
        .from('Orders')
        .select('id, delivery_date, status')
        .in('status', ['pending', 'active'])
        .gte('delivery_date', today.toISOString().split('T')[0])
        .lte('delivery_date', twoDaysLater.toISOString().split('T')[0]);

      if (!deliveriesError && upcomingDeliveries && upcomingDeliveries.length > 0) {
        alertsToShow.push({
          id: 'upcoming-deliveries',
          type: 'info',
          message: `Tienes ${upcomingDeliveries.length} entrega(s) programada(s) en los próximos 2 días`,
          priority: 2,
        });
      }

      // 3. Verificar vestidos en mantenimiento
      const { data: maintenanceProducts, error: maintenanceError } = await supabase
        .from('Products')
        .select('id')
        .eq('status', 'maintenance');

      if (!maintenanceError && maintenanceProducts && maintenanceProducts.length > 0) {
        alertsToShow.push({
          id: 'maintenance-products',
          type: 'info',
          message: `${maintenanceProducts.length} vestido(s) en mantenimiento`,
          priority: 3,
        });
      }

      // Ordenar por prioridad y mostrar
      alertsToShow.sort((a, b) => a.priority - b.priority);

      // Mostrar alertas con toast
      alertsToShow.forEach((alert) => {
        if (alert.type === 'error') {
          toast.error(alert.message, { duration: 5000 });
        } else if (alert.type === 'warning') {
          toast(alert.message, {
            icon: '⚠️',
            duration: 5000,
            style: {
              background: '#fbbf24',
              color: '#fff',
            },
          });
        } else {
          toast(alert.message, {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
      });
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  return null; // Este componente solo muestra toasts, no renderiza UI
};

export default LoginAlerts;

