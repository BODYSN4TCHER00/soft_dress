import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'react-hot-toast';
import StatusBadge from '../shared/StatusBadge';
import ReturnNotesModal from '../modals/ReturnNotesModal';
import '../../styles/CalendarDayModal.css';

interface CalendarActivity {
  id: number;
  type: 'delivery' | 'return' | 'rental';
  dress: string;
  client: string;
  time?: string;
  status?: string;
  orderId: number;
}

interface CalendarDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  activities: CalendarActivity[];
  onStatusChange?: () => void;
}

const CalendarDayModal = ({ isOpen, onClose, date, activities, onStatusChange }: CalendarDayModalProps) => {
  const [changingStatus, setChangingStatus] = useState<Set<number>>(new Set());
  const [isReturnNotesOpen, setIsReturnNotesOpen] = useState(false);
  const [currentReturnActivity, setCurrentReturnActivity] = useState<CalendarActivity | null>(null);

  if (!isOpen) return null;

  const getActivityTypeLabel = (type: string) => {
    if (type === 'delivery') return 'Entrega';
    if (type === 'return') return 'Devolución';
    if (type === 'rental') return 'Renta Creada';
    return type;
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Activo';
    if (status === 'completed') return 'Completado';
    if (status === 'cancelled' || status === 'canceled') return 'Cancelado';
    if (status === 'active') return 'Activo';
    return status;
  };

  const getNextStatus = (currentStatus?: string) => {
    if (!currentStatus || currentStatus === 'active') return 'completed';
    if (currentStatus === 'completed') return 'cancelled';
    if (currentStatus === 'cancelled' || currentStatus === 'canceled') return 'active';
    return 'active';
  };

  const handleStatusChange = async (orderId: number, currentStatus?: string, activity?: CalendarActivity) => {
    if (changingStatus.has(orderId)) return;

    const newStatus = getNextStatus(currentStatus);

    // Si es una devolución y se está completando, mostrar el modal de notas
    if (activity && activity.type === 'return' && newStatus === 'completed') {
      setCurrentReturnActivity(activity);
      setIsReturnNotesOpen(true);
      return;
    }

    setChangingStatus(prev => new Set(prev).add(orderId));

    try {
      const { error } = await supabase
        .from('Orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Error al actualizar el estado');
        return;
      }

      toast.success('Estado actualizado');
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setChangingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calendar-day-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Actividades del {date}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          {activities.length === 0 ? (
            <p className="no-activities">No hay actividades programadas para este día.</p>
          ) : (
            <div className="activities-list">
              {activities.map((activity) => (
                <div key={`${activity.type}-${activity.orderId}-${activity.id}`} className={`activity-item ${activity.type}`}>
                  <div className="activity-header">
                    <div className="activity-type-badge">
                      {getActivityTypeLabel(activity.type)}
                    </div>
                    {activity.status && (
                      <div style={{ cursor: changingStatus.has(activity.orderId) ? 'wait' : 'pointer' }}>
                        <StatusBadge
                          status={activity.status === 'completed' ? 'completed' : activity.status === 'cancelled' || activity.status === 'canceled' ? 'cancelled' : 'pending'}
                          onClick={() => handleStatusChange(activity.orderId, activity.status, activity)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="activity-details">
                    <div className="activity-dress">{activity.dress}</div>
                    <div className="activity-client">{activity.client}</div>
                    {activity.time && (
                      <div className="activity-time">{activity.time}</div>
                    )}
                    {activity.status && (
                      <div className="activity-status">
                        Estado: {getStatusLabel(activity.status)}
                        {changingStatus.has(activity.orderId) && (
                          <span className="status-changing"> (Cambiando...)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ReturnNotesModal
          isOpen={isReturnNotesOpen}
          onClose={() => {
            setIsReturnNotesOpen(false);
            setCurrentReturnActivity(null);
          }}
          orderId={currentReturnActivity?.orderId || 0}
          dressName={currentReturnActivity?.dress || ''}
          clientName={currentReturnActivity?.client || ''}
          onReturnCompleted={() => {
            setIsReturnNotesOpen(false);
            setCurrentReturnActivity(null);
            if (onStatusChange) {
              onStatusChange();
            }
          }}
        />
      </div>
    </div>
  );
};

export default CalendarDayModal;

