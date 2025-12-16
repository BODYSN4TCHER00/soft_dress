import { useState } from 'react';
import { FiFileText, FiDollarSign, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import type { RentFormData } from './RentDressModal';
import '../../styles/RentDressSteps.css';

interface RentDressStep3Props {
  formData: RentFormData;
  updateFormData: (data: Partial<RentFormData>) => void;
  onPrevious: () => void;
  onFinish: () => void;
  onContractGenerated?: (pdfBlob: Blob) => void;
}

const RentDressStep3 = ({ formData, updateFormData, onPrevious, onFinish, onContractGenerated }: RentDressStep3Props) => {
  const [notas, setNotas] = useState(formData.notas || '');
  const [adelanto, setAdelanto] = useState(formData.adelanto?.toString() || '');

  const handleGenerateContract = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Nombre de la empresa
    doc.setFontSize(24);
    doc.setTextColor(124, 16, 124);
    doc.text('Magnifique Vestidos', pageWidth / 2, 20, { align: 'center' });
    
    // Tagline
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Renta de vestidos', pageWidth / 2, 28, { align: 'center' });
    
    // Título del contrato
    doc.setFontSize(18);
    doc.setTextColor(124, 16, 124);
    doc.text('CONTRATO DE RENTA DE VESTIDO', pageWidth / 2, 40, { align: 'center' });
    
    // Información del cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('DATOS DEL CLIENTE:', 20, 40);
    doc.text(`Nombre: ${formData.nombre} ${formData.apellido}`, 20, 50);
    doc.text(`Teléfono: ${formData.telefono}${formData.segundoTelefono ? ` / ${formData.segundoTelefono}` : ''}`, 20, 56);
    doc.text(`Domicilio: ${formData.address}`, 20, 62);
    
    // Información de la renta
    doc.text('DATOS DE LA RENTA:', 20, 75);
    doc.text(`Vestido: ${formData.selectedDress}`, 20, 85);
    doc.text(`Fecha de Entrega: ${formData.fechaEntrega}`, 20, 91);
    doc.text(`Fecha de Devolución: ${formData.fechaDevolucion}`, 20, 97);
    doc.text(`Subtotal: $${formData.subtotal}`, 20, 103);
    
    if (adelanto) {
      doc.text(`Adelanto: $${adelanto}`, 20, 109);
    }
    
    if (notas) {
      doc.text(`Notas: ${notas}`, 20, 120);
    }
    
    // Firma
    doc.text('Firma del Cliente:', 20, 250);
    doc.line(20, 255, 100, 255);
    
    doc.text('Firma del Personal:', 120, 250);
    doc.line(120, 255, 200, 255);
    
    // Generar blob del PDF
    const pdfBlob = doc.output('blob');
    
    // Guardar y abrir para imprimir
    doc.save(`contrato-${formData.nombre}-${formData.apellido}.pdf`);
    window.open(URL.createObjectURL(pdfBlob), '_blank');
    
    // Pasar el blob al componente padre para subirlo a Supabase
    if (onContractGenerated) {
      onContractGenerated(pdfBlob);
    }
    
    toast.success('Contrato generado e impreso');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({
      notas,
      adelanto: adelanto ? parseFloat(adelanto) : undefined,
    });
    
    onFinish();
  };

  return (
    <form onSubmit={handleSubmit} className="rent-step-form">
      <h3 className="step-title">Finalizar Renta</h3>

      <div className="final-step-options">
        <button
          type="button"
          className="contract-button"
          onClick={handleGenerateContract}
        >
          <FiFileText />
          <span>Generar Contrato PDF e Imprimir</span>
        </button>
      </div>

      <div className="final-step-content">
        <div className="form-group">
          <label htmlFor="adelanto">Adelanto (Opcional)</label>
          <div className="input-with-icon">
            <FiDollarSign className="input-icon" />
            <input
              type="number"
              id="adelanto"
              value={adelanto}
              onChange={(e) => setAdelanto(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notas">Notas</label>
          <textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas adicionales sobre la renta..."
            rows={6}
          />
        </div>
      </div>

      <div className="rental-summary-final">
        <h4 className="summary-title">Resumen de la Renta</h4>
        <div className="summary-box">
          <div className="summary-row">
            <span className="summary-label">Cliente</span>
            <span className="summary-value">{formData.nombre} {formData.apellido}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Teléfono</span>
            <span className="summary-value">{formData.telefono}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Vestido</span>
            <span className="summary-value">{formData.selectedDress || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha de Entrega</span>
            <span className="summary-value">{formData.fechaEntrega || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha de Devolución</span>
            <span className="summary-value">{formData.fechaDevolucion || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">{formData.subtotal > 0 ? `$${formData.subtotal}` : '$--'}</span>
          </div>
          {adelanto && parseFloat(adelanto) > 0 && (
            <div className="summary-row">
              <span className="summary-label">Adelanto</span>
              <span className="summary-value">${parseFloat(adelanto).toFixed(2)}</span>
            </div>
          )}
          {adelanto && parseFloat(adelanto) > 0 && formData.subtotal > 0 && (
            <div className="summary-row summary-total">
              <span className="summary-label">Restante</span>
              <span className="summary-value">${(formData.subtotal - parseFloat(adelanto)).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          <FiArrowLeft />
          Anterior
        </button>
        <button type="submit" className="btn-primary">
          <FiCheck />
          Finalizar Renta
        </button>
      </div>
    </form>
  );
};

export default RentDressStep3;

