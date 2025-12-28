import { useState, useRef, useEffect } from 'react';
import { FiUser, FiUserPlus, FiUpload, FiArrowRight, FiX } from 'react-icons/fi';
import type { RentFormData } from './RentDressModal';
import ClientSearchModal, { type Client } from './ClientSearchModal';
import '../../styles/RentDressSteps.css';

interface RentDressStep1Props {
  formData: RentFormData;
  updateFormData: (data: Partial<RentFormData>) => void;
  onNext: () => void;
  onAutoNext?: () => void;
}

const RentDressStep1 = ({ formData, updateFormData, onNext, onAutoNext }: RentDressStep1Props) => {
  const [inePreview, setInePreview] = useState<string | null>(null);
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open client search modal when component mounts with registered client type
  useEffect(() => {
    if (formData.clientType === 'registered' && !hasAutoOpened && !formData.nombre) {
      setIsClientSearchOpen(true);
      setHasAutoOpened(true);
    }
  }, [formData.clientType, hasAutoOpened, formData.nombre]);

  const handleClientTypeChange = (type: 'new' | 'registered') => {
    updateFormData({ clientType: type });
    if (type === 'registered') {
      setIsClientSearchOpen(true);
    }
  };

  const handleClientSelect = (client: Client) => {
    updateFormData({
      nombre: client.nombre,
      apellido: client.apellido,
      telefono: client.telefono,
      segundoTelefono: client.segundoTelefono,
      address: client.address,
      customerStatus: client.status || null,
      customerId: parseInt(client.id),
    });
    // Pasar automáticamente al siguiente paso
    if (onAutoNext) {
      setTimeout(() => {
        onAutoNext();
      }, 300);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFormData({ ineFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setInePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="rent-step-form">
      <h3 className="step-title">Detalles del Cliente</h3>

      <div className="client-type-buttons">
        <button
          type="button"
          className={`type-button ${formData.clientType === 'new' ? 'active' : ''}`}
          onClick={() => handleClientTypeChange('new')}
        >
          <FiUserPlus />
          <span>Nuevo Cliente</span>
        </button>
        <button
          type="button"
          className={`type-button ${formData.clientType === 'registered' ? 'active' : ''}`}
          onClick={() => handleClientTypeChange('registered')}
        >
          <FiUser />
          <span>Cliente Registrado</span>
        </button>
      </div>

      {formData.clientType === 'registered' && (
        <div className="client-search-trigger">
          <button
            type="button"
            className="search-client-btn"
            onClick={() => setIsClientSearchOpen(true)}
          >
            <FiUser />
            <span>Buscar Cliente Registrado</span>
          </button>
          {(formData.nombre || formData.telefono) && (
            <div className="selected-client-info">
              <p><strong>Cliente seleccionado:</strong> {formData.nombre} {formData.apellido}</p>
              <p>Tel: {formData.telefono}{formData.segundoTelefono && ` / ${formData.segundoTelefono}`}</p>
            </div>
          )}
        </div>
      )}

      <div className="form-fields">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => updateFormData({ nombre: e.target.value })}
              placeholder="Nombre"
              required={formData.clientType === 'new'}
              disabled={formData.clientType === 'registered'}
            />
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <input
              type="text"
              id="apellido"
              value={formData.apellido}
              onChange={(e) => updateFormData({ apellido: e.target.value })}
              placeholder="Apellido"
              required={formData.clientType === 'new'}
              disabled={formData.clientType === 'registered'}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="telefono">Telefono</label>
            <input
              type="tel"
              id="telefono"
              value={formData.telefono}
              onChange={(e) => updateFormData({ telefono: e.target.value })}
              placeholder="55 1236 9874"
              required={formData.clientType === 'new'}
              disabled={formData.clientType === 'registered'}
            />
          </div>
          <div className="form-group">
            <label htmlFor="segundoTelefono">Segundo Telefono (Opcional)</label>
            <input
              type="tel"
              id="segundoTelefono"
              value={formData.segundoTelefono || ''}
              onChange={(e) => updateFormData({ segundoTelefono: e.target.value })}
              placeholder="55 1236 9874"
              disabled={formData.clientType === 'registered'}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="domicilio">Domicilio</label>
          <textarea
            id="domicilio"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="Dirección completa"
            rows={3}
            required={formData.clientType === 'new'}
            disabled={formData.clientType === 'registered'}
          />
        </div>

        {formData.clientType === 'new' && (
          <div className="form-group">
            <label>INE</label>
            <div className="ine-upload-area" onClick={handleUploadClick}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {inePreview ? (
                <div className="ine-preview">
                  <img src={inePreview} alt="INE preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInePreview(null);
                      updateFormData({ ineFile: null });
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="ine-upload-placeholder">
                  <FiUpload className="upload-icon" />
                  <p>Toma una fotografia clara de la INE del cliente y subela aqui</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {formData.clientType === 'new' && (
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Siguiente
            <FiArrowRight />
          </button>
        </div>
      )}

      <ClientSearchModal
        isOpen={isClientSearchOpen}
        onClose={() => setIsClientSearchOpen(false)}
        onSelect={handleClientSelect}
      />
    </form>
  );
};

export default RentDressStep1;

