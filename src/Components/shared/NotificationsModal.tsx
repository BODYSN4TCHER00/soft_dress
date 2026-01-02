import { useState, useEffect } from 'react';
import { FiX, FiPackage, FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'react-hot-toast';
import '../../styles/NotificationsModal.css';

interface Notification {
  id: number;
  type: 'delivery' | 'return';
  date: string;
  dress: string;
  client: string;
  orderId: number;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal = ({ isOpen, onClose }: NotificationsModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Cargar próximas entregas (próximos 7 días)
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const { data: deliveries, error: deliveriesError } = await supabase
        .from('Orders')
        .select(`
          *,
          Products!product_id (name),
          Customers!customer_id (name, last_name)
        `)
        .gte('delivery_date', todayStr)
        .lte('delivery_date', nextWeekStr)
        .in('status', ['on_course', 'pending'])
        .order('delivery_date', { ascending: true })
        .limit(20);

      // Cargar próximas devoluciones (próximos 7 días)
      const { data: returns, error: returnsError } = await supabase
        .from('Orders')
        .select(`
          *,
          Products!product_id (name),
          Customers!customer_id (name, last_name)
        `)
        .gte('due_date', todayStr)
        .lte('due_date', nextWeekStr)
        .in('status', ['on_course', 'pending'])
        .order('due_date', { ascending: true })
        .limit(20);

      if (deliveriesError || returnsError) {
        toast.error('Error al cargar notificaciones');
        return;
      }

      const allNotifications: Notification[] = [];

      if (deliveries) {
        deliveries.forEach((order: any) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';

          allNotifications.push({
            id: order.id,
            type: 'delivery',
            date: order.delivery_date,
            dress: order.Products?.name || 'Vestido desconocido',
            client: customerName,
            orderId: order.id,
          });
        });
      }

      if (returns) {
        returns.forEach((order: any) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';

          allNotifications.push({
            id: order.id,
            type: 'return',
            date: order.due_date,
            dress: order.Products?.name || 'Vestido desconocido',
            client: customerName,
            orderId: order.id,
          });
        });
      }

      // Ordenar por fecha
      allNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Próximos Eventos</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-notifications">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No hay eventos próximos programados</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={`${notification.type}-${notification.orderId}`} className={`notification-item ${notification.type}`}>
                  <div className="notification-icon">
                    {notification.type === 'delivery' ? (
                      <FiPackage className="icon-delivery" />
                    ) : (
                      <FiArrowLeft className="icon-return" />
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-type">
                      {notification.type === 'delivery' ? 'Entrega' : 'Devolución'}
                    </div>
                    <div className="notification-details">
                      <div className="notification-dress">{notification.dress}</div>
                      <div className="notification-client">{notification.client}</div>
                      <div className="notification-date">{formatDate(notification.date)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;


