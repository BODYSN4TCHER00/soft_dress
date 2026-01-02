import { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import '../../styles/CompletionNotesModal.css';

interface CompletionNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (notes: string) => void;
    rentalInfo?: {
        client: string;
        dress: string;
    };
}

const CompletionNotesModal = ({ isOpen, onClose: _onClose, onComplete, rentalInfo }: CompletionNotesModalProps) => {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(notes.trim());
        setNotes('');
    };

    const handleSkip = () => {
        onComplete('');
        setNotes('');
    };

    return (
        <div className="modal-overlay" onClick={handleSkip}>
            <div className="completion-notes-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Finalizar Renta</h2>
                    <button className="modal-close-btn" onClick={handleSkip}>
                        <FiX />
                    </button>
                </div>

                {rentalInfo && (
                    <div className="rental-info-banner">
                        <div className="info-item">
                            <span className="info-label">Cliente:</span>
                            <span className="info-value">{rentalInfo.client}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vestido:</span>
                            <span className="info-value">{rentalInfo.dress}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label htmlFor="notes">
                            Notas de incidencias (opcional)
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej: Vestido devuelto con pequeña mancha en la falda, cliente solicitó descuento..."
                            rows={6}
                            className="notes-textarea"
                        />
                        <p className="help-text">
                            Registra aquí cualquier incidencia o detalle importante sobre la devolución
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleSkip}
                        >
                            Omitir y Finalizar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            <FiSave />
                            Guardar y Finalizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompletionNotesModal;
