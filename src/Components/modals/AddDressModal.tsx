import { useState } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import '../../styles/AddDressModal.css';

interface AddDressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDressAdded?: () => void;
}

const AddDressModal = ({ isOpen, onClose, onDressAdded }: AddDressModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    salesPrice: '',
    description: '',
    details: '',
    notes: '',
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('dress_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast.error('Error al subir la imagen');
        return null;
      }

      if (!data?.path) {
        toast.error('Error: No se recibió la ruta del archivo');
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('dress_images')
        .getPublicUrl(data.path);

      return urlData?.publicUrl || null;
    } catch (error) {
      toast.error('Error inesperado al subir la imagen');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl: string | null = null;

      // Subir imagen si existe
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
        if (!imageUrl) {
          toast.error('Error al subir la imagen');
          setLoading(false);
          return;
        }
      }

      // Crear producto en la base de datos
      const { error } = await supabase
        .from('Products')
        .insert([          {
          name: formData.name,
          description: formData.description || null,
          rental_price: parseFloat(formData.price),
          sales_price: formData.salesPrice ? parseFloat(formData.salesPrice) : null,
          details: formData.details || null,
          notes: formData.notes || null,
          image_url: imageUrl,
          status: 'available',
        },
        ])
        .select()
        .single();

      if (error) {
        toast.error('Error al agregar el vestido');
        setLoading(false);
        return;
      }

      toast.success('Vestido agregado exitosamente');

      // Reset form
      setFormData({
        name: '',
        price: '',
        salesPrice: '',
        description: '',
        details: '',
        notes: '',
        image: null,
      });
      setImagePreview(null);

      onClose();
      if (onDressAdded) {
        onDressAdded();
      }
    } catch (error) {
      toast.error('Error al agregar el vestido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-dress-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Agregar al Catálogo</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="dress-name">Nombre del Vestido</label>
            <input
              type="text"
              id="dress-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Vestido casual de verano"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dress-price">Precio por Renta *</label>
            <input
              type="number"
              id="dress-price"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="300"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dress-sales-price">Precio de Venta (Opcional)</label>
            <input
              type="number"
              id="dress-sales-price"
              value={formData.salesPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, salesPrice: e.target.value }))}
              placeholder="500"
              min="0"
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '13px' }}>
              Dejar vacío si no está disponible para venta
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="dress-description">Descripción</label>
            <textarea
              id="dress-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del vestido..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dress-details">Detalles (Talla, Color, etc.)</label>
            <input
              type="text"
              id="dress-details"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Ej: Talla M, Color Rojo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dress-notes">Notas</label>
            <textarea
              id="dress-notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Imagen del Vestido</label>
            <div className="image-upload-area" onClick={() => document.getElementById('dress-image')?.click()}>
              <input
                id="dress-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image: null }));
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="image-upload-placeholder">
                  <FiUpload className="upload-icon" />
                  <p>Haz clic para subir una imagen</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Agregando...' : 'Agregar Vestido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDressModal;

