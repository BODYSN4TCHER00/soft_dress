import { useState } from 'react';
import { FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../utils/context/AuthContext';
import '../../styles/ReturnNotesModal.css';

interface ReturnNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    dressName: string;
    clientName: string;
    onReturnCompleted: () => void;
}

const ReturnNotesModal = ({
    isOpen,
    onClose,
    orderId,
    dressName,
    clientName,
    onReturnCompleted,
}: ReturnNotesModalProps) => {
    const { user } = useAuth();
    const [notes, setNotes] = useState('');
    const [hasPendingIssues, setHasPendingIssues] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (markAsPending: boolean) => {
        // Validación: las notas son obligatorias
        if (!notes.trim()) {
            toast.error('Las notas son obligatorias');
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. Guardar las notas de devolución
            const { error: notesError } = await supabase
                .from('return_notes')
                .insert([
                    {
                        order_id: orderId,
                        notes: notes.trim(),
                        has_pending_issues: markAsPending || hasPendingIssues,
                        issue_resolved: false,
                        created_by: user?.id || null,
                    },
                ]);

            if (notesError) {
                console.error('Error saving return notes:', notesError);
                toast.error('Error al guardar las notas');
                return;
            }

            // 2. Actualizar el estado de la orden a "completed" solo si no está pendiente
            if (!markAsPending) {
                const { error: orderError } = await supabase
                    .from('Orders')
                    .update({ status: 'completed' })
                    .eq('id', orderId);

                if (orderError) {
                    console.error('Error updating order status:', orderError);
                    toast.error('Error al actualizar el estado de la orden');
                    return;
                }
            }

            // 3. Actualizar el estado del producto a "available"
            const { data: orderData, error: fetchError } = await supabase
                .from('Orders')
                .select('product_id')
                .eq('id', orderId)
                .single();

            if (!fetchError && orderData) {
                await supabase
                    .from('Products')
                    .update({ status: 'available' })
                    .eq('id', orderData.product_id);
            }

            if (markAsPending) {
                toast.success('Devolución marcada como pendiente');
            } else {
                toast.success('Devolución completada exitosamente');
            }

            onReturnCompleted();
            handleClose();
        } catch (error) {
            console.error('Error processing return:', error);
            toast.error('Error al procesar la devolución');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setNotes('');
        setHasPendingIssues(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="return-notes-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Notas de Devolución</h2>
                    <button className="modal-close-btn" onClick={handleClose} disabled={isSubmitting}>
                        <FiX />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="return-info">
                        <div className="info-item">
                            <strong>Vestido:</strong> {dressName}
                        </div>
                        <div className="info-item">
                            <strong>Cliente:</strong> {clientName}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="return-notes">
                            Notas de Recibido <span className="required">*</span>
                        </label>
                        <textarea
                            id="return-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe el estado del vestido al recibirlo, cualquier daño o problema encontrado..."
                            rows={6}
                            className="notes-textarea"
                            disabled={isSubmitting}
                            required
                        />
                        <div className="field-hint">
                            Es obligatorio agregar notas al devolver un vestido
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={hasPendingIssues}
                                onChange={(e) => setHasPendingIssues(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <span>Hay problemas que requieren atención</span>
                        </label>
                        {hasPendingIssues && (
                            <div className="warning-message">
                                <FiAlertCircle />
                                <span>Se creará una notificación pendiente para dar seguimiento</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    {hasPendingIssues && (
                        <button
                            type="button"
                            className="btn-warning"
                            onClick={() => handleSubmit(true)}
                            disabled={isSubmitting || !notes.trim()}
                        >
                            <FiAlertCircle />
                            {isSubmitting ? 'Procesando...' : 'Marcar como Pendiente'}
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting || !notes.trim()}
                    >
                        <FiCheckCircle />
                        {isSubmitting ? 'Procesando...' : 'Completar Devolución'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnNotesModal;
