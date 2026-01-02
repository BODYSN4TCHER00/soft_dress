import { useState, type ReactElement } from 'react';
import { FiX, FiChevronDown, FiChevronUp, FiPackage, FiCalendar, FiRotateCcw, FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiPlayCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import CompletionNotesModal from './CompletionNotesModal';
import '../../styles/DayDetailsModal.css';

interface RentalDetail {
    id: number;
    clientName: string;
    dressName: string;
    status: string;
    advance: number;
    total: number;
    remaining: number;
    activityType: 'delivery' | 'event' | 'return';
    productId: number;
}

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    rentals: RentalDetail[];
    onRefresh: () => void;
}

const DayDetailsModal = ({ isOpen, onClose, selectedDate, rentals, onRefresh }: DayDetailsModalProps) => {
    const [expandedRental, setExpandedRental] = useState<number | null>(null);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState<RentalDetail | null>(null);
    const [changingStatus, setChangingStatus] = useState<number | null>(null);
    const [cancelNotes, setCancelNotes] = useState('');

    if (!isOpen) return null;

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: ReactElement }> = {
            pending: { label: 'Pendiente', color: '#ffc107', icon: <FiClock /> },
            on_course: { label: 'En Curso', color: '#0d6efd', icon: <FiPlayCircle /> },
            finished: { label: 'Finalizado', color: '#28a745', icon: <FiCheckCircle /> },
            canceled: { label: 'Cancelado', color: '#dc3545', icon: <FiXCircle /> },
        };
        return statusMap[status] || { label: status, color: '#6c757d', icon: <FiClock /> };
    };

    const handleStatusChange = async (rental: RentalDetail, newStatus: string) => {
        if (newStatus === rental.status) return;

        // Si va a finalizar, abrir modal de notas de completado
        if (newStatus === 'finished') {
            setSelectedRental(rental);
            setIsCompletionModalOpen(true);
            return;
        }

        // Si va a cancelar, abrir modal de notas de cancelación
        if (newStatus === 'canceled') {
            setSelectedRental(rental);
            setCancelNotes('');
            setIsCancelModalOpen(true);
            return;
        }

        // Para otros cambios de status, actualizar directamente
        try {
            setChangingStatus(rental.id);

            const { error } = await supabase
                .from('Orders')
                .update({ status: newStatus })
                .eq('id', rental.id);

            if (error) {
                toast.error('Error al actualizar el estado');
                return;
            }

            toast.success('Estado actualizado');
            onRefresh();
        } catch (error) {
            toast.error('Error al actualizar el estado');
        } finally {
            setChangingStatus(null);
        }
    };

    const handleCancelWithNotes = async () => {
        if (!selectedRental) return;

        if (!cancelNotes.trim()) {
            toast.error('Por favor ingresa el motivo de la cancelación');
            return;
        }

        try {
            setChangingStatus(selectedRental.id);

            // Actualizar orden a cancelado con notas
            const { error: orderError } = await supabase
                .from('Orders')
                .update({
                    status: 'canceled',
                    notes: cancelNotes
                })
                .eq('id', selectedRental.id);

            if (orderError) {
                toast.error('Error al cancelar la renta');
                return;
            }

            // Liberar el vestido (cambiar a available)
            const { error: productError } = await supabase
                .from('Products')
                .update({ status: 'available' })
                .eq('id', selectedRental.productId);

            if (productError) {
                // No cancelar la operación por esto
            }

            toast.success('Renta cancelada y vestido liberado');
            setIsCancelModalOpen(false);
            setSelectedRental(null);
            setCancelNotes('');
            onRefresh();
        } catch (error) {
            toast.error('Error al cancelar la renta');
        } finally {
            setChangingStatus(null);
        }
    };

    const handleCompletionWithNotes = async (notes: string) => {
        if (!selectedRental) return;

        try {
            setChangingStatus(selectedRental.id);

            // Actualizar orden a finalizado con notas
            const { error: orderError } = await supabase
                .from('Orders')
                .update({
                    status: 'finished',
                    delivery_notes: notes || null
                })
                .eq('id', selectedRental.id);

            if (orderError) {
                toast.error('Error al finalizar la renta');
                return;
            }

            // Liberar el vestido (cambiar a available)
            const { error: productError } = await supabase
                .from('Products')
                .update({ status: 'available' })
                .eq('id', selectedRental.productId);

            if (productError) {
                // No cancelar la operación por esto
            }

            toast.success('Renta finalizada y vestido liberado');
            setIsCompletionModalOpen(false);
            setSelectedRental(null);
            onRefresh();
        } catch (error) {
            toast.error('Error al finalizar la renta');
        } finally {
            setChangingStatus(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getActivityInfo = (type: string) => {
        const info: Record<string, { label: string; icon: ReactElement; color: string }> = {
            delivery: { label: 'Entrega', icon: <FiPackage />, color: '#22c55e' },
            event: { label: 'Evento', icon: <FiCalendar />, color: '#8b5cf6' },
            return: { label: 'Devolución', icon: <FiRotateCcw />, color: '#ef4444' },
        };
        return info[type] || { label: type, icon: <FiCalendar />, color: '#6b7280' };
    };

    const dateStr = selectedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="day-details-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">Rentas del {dateStr}</h2>
                        <button className="modal-close-btn" onClick={onClose}>
                            <FiX />
                        </button>
                    </div>

                    <div className="modal-body">
                        {rentals.length === 0 ? (
                            <p className="no-rentals">No hay rentas para este día</p>
                        ) : (
                            <div className="rentals-list">
                                {rentals.map((rental) => {
                                    const isExpanded = expandedRental === rental.id;
                                    const statusInfo = getStatusBadge(rental.status);
                                    const activityInfo = getActivityInfo(rental.activityType);

                                    return (
                                        <div key={rental.id} className="rental-item">
                                            <div
                                                className="rental-header"
                                                onClick={() => setExpandedRental(isExpanded ? null : rental.id)}
                                            >
                                                <div className="rental-main-info">
                                                    <div className="rental-client">{rental.clientName}</div>
                                                    <div className="rental-dress">{rental.dressName}</div>
                                                </div>
                                                <div className="rental-header-actions">
                                                    <span
                                                        className="status-badge"
                                                        style={{ backgroundColor: statusInfo.color }}
                                                    >
                                                        {statusInfo.icon}
                                                        <span>{statusInfo.label}</span>
                                                    </span>
                                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="rental-details">
                                                    <div className="detail-row activity-type-row">
                                                        <span className="detail-label">Tipo de Actividad:</span>
                                                        <span className="activity-badge" style={{ color: activityInfo.color }}>
                                                            {activityInfo.icon}
                                                            <span>{activityInfo.label}</span>
                                                        </span>
                                                    </div>

                                                    <div className="detail-row">
                                                        <span className="detail-label">
                                                            <FiDollarSign className="detail-icon" />
                                                            Total
                                                        </span>
                                                        <span className="detail-value">{formatCurrency(rental.total)}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">
                                                            <FiCheckCircle className="detail-icon success" />
                                                            Adelanto
                                                        </span>
                                                        <span className="detail-value success">{formatCurrency(rental.advance)}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">
                                                            <FiClock className="detail-icon warning" />
                                                            Restante
                                                        </span>
                                                        <span className="detail-value warning">{formatCurrency(rental.remaining)}</span>
                                                    </div>

                                                    <div className="status-change-section">
                                                        <label>Cambiar Estado:</label>
                                                        <div className="status-buttons">
                                                            <button
                                                                className={`status-btn pending ${rental.status === 'pending' ? 'active' : ''}`}
                                                                onClick={() => handleStatusChange(rental, 'pending')}
                                                                disabled={changingStatus === rental.id || rental.status === 'pending'}
                                                            >
                                                                <FiClock />
                                                                <span>Pendiente</span>
                                                            </button>
                                                            <button
                                                                className={`status-btn on-course ${rental.status === 'on_course' ? 'active' : ''}`}
                                                                onClick={() => handleStatusChange(rental, 'on_course')}
                                                                disabled={changingStatus === rental.id || rental.status === 'on_course'}
                                                            >
                                                                <FiPlayCircle />
                                                                <span>En Curso</span>
                                                            </button>
                                                            <button
                                                                className={`status-btn finished ${rental.status === 'finished' ? 'active' : ''}`}
                                                                onClick={() => handleStatusChange(rental, 'finished')}
                                                                disabled={changingStatus === rental.id || rental.status === 'finished'}
                                                            >
                                                                <FiCheckCircle />
                                                                <span>Finalizar</span>
                                                            </button>
                                                            <button
                                                                className={`status-btn canceled ${rental.status === 'canceled' ? 'active' : ''}`}
                                                                onClick={() => handleStatusChange(rental, 'canceled')}
                                                                disabled={changingStatus === rental.id || rental.status === 'canceled'}
                                                            >
                                                                <FiXCircle />
                                                                <span>Cancelar</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Completado */}
            <CompletionNotesModal
                isOpen={isCompletionModalOpen}
                onClose={() => {
                    setIsCompletionModalOpen(false);
                    setSelectedRental(null);
                }}
                onComplete={handleCompletionWithNotes}
                rentalInfo={selectedRental ? {
                    client: selectedRental.clientName,
                    dress: selectedRental.dressName
                } : undefined}
            />

            {/* Modal de Cancelación */}
            {isCancelModalOpen && selectedRental && (
                <div className="modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
                    <div className="completion-notes-modal cancel-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <FiXCircle className="title-icon cancel" />
                                Cancelar Renta
                            </h2>
                            <button className="modal-close-btn" onClick={() => setIsCancelModalOpen(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="rental-info-summary">
                                <p><strong>Cliente:</strong> {selectedRental.clientName}</p>
                                <p><strong>Vestido:</strong> {selectedRental.dressName}</p>
                            </div>
                            <div className="form-group">
                                <label htmlFor="cancel-notes">Motivo de cancelación *</label>
                                <textarea
                                    id="cancel-notes"
                                    value={cancelNotes}
                                    onChange={(e) => setCancelNotes(e.target.value)}
                                    placeholder="Describe el motivo de la cancelación..."
                                    rows={4}
                                    className="notes-textarea"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setIsCancelModalOpen(false)}
                                >
                                    Volver
                                </button>
                                <button
                                    className="btn-danger"
                                    onClick={handleCancelWithNotes}
                                    disabled={changingStatus === selectedRental.id}
                                >
                                    {changingStatus === selectedRental.id ? 'Cancelando...' : 'Confirmar Cancelación'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DayDetailsModal;
