import { useState, useEffect } from 'react';
import { FiX, FiSave, FiImage, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import type { Dress } from '../../pages/Catalogo';
import '../../styles/EditDressModal.css';

interface EditDressModalProps {
    isOpen: boolean;
    onClose: () => void;
    dress: Dress | null;
    onDressUpdated: () => void;
}

const EditDressModal = ({ isOpen, onClose, dress, onDressUpdated }: EditDressModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        details: '',
        notes: '',
        imageUrl: '',
        status: 'available',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (dress && isOpen) {
            setFormData({
                name: dress.name || '',
                price: dress.price.toString() || '',
                description: dress.description || '',
                details: dress.details || '',
                notes: dress.notes || '',
                imageUrl: dress.image || '',
                status: dress.status || 'available',
            });
            setImagePreview(dress.image || '');
            setImageFile(null);
        }
    }, [dress, isOpen]);

    if (!isOpen || !dress) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor selecciona una imagen válida');
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La imagen debe ser menor a 5MB');
                return;
            }

            setImageFile(file);

            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `dress_images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('dress_photos')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            const { data } = supabase.storage
                .from('dress_photos')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        if (!formData.price || parseFloat(formData.price) < 0) {
            toast.error('El precio debe ser mayor o igual a 0');
            return;
        }

        try {
            setIsSubmitting(true);

            let finalImageUrl = formData.imageUrl;

            // Si hay una nueva imagen, subirla
            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                } else {
                    toast.error('Error al subir la imagen');
                    return;
                }
            }

            const updateData: any = {
                name: formData.name.trim(),
                price: parseFloat(formData.price),
                description: formData.description.trim() || null,
                details: formData.details.trim() || null,
                notes: formData.notes.trim() || null,
                status: formData.status,
            };

            if (finalImageUrl) {
                updateData.image_url = finalImageUrl;
            }

            const { error } = await supabase
                .from('Products')
                .update(updateData)
                .eq('id', parseInt(dress.id));

            if (error) {
                console.error('Error updating dress:', error);
                toast.error('Error al actualizar el vestido');
                return;
            }

            toast.success('Vestido actualizado exitosamente');
            onDressUpdated();
            handleClose();
        } catch (error) {
            console.error('Error updating dress:', error);
            toast.error('Error al actualizar el vestido');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            price: '',
            description: '',
            details: '',
            notes: '',
            imageUrl: '',
            status: 'available',
        });
        setImageFile(null);
        setImagePreview('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="edit-dress-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Editar Vestido</h2>
                    <button className="modal-close-btn" onClick={handleClose} disabled={isSubmitting}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">
                                Nombre <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nombre del vestido"
                                required
                                disabled={isSubmitting}
                                minLength={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="price">
                                Precio por renta <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="price"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                required
                                disabled={isSubmitting}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="status">Estado</label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                disabled={isSubmitting}
                                className="status-select"
                            >
                                <option value="available">✓ Disponible</option>
                                <option value="rented">⏱ Rentado</option>
                                <option value="maintenance">🔧 Mantenimiento</option>
                                <option value="damaged">⚠ Dañado</option>
                                <option value="not_available">✕ No Disponible</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="imageFile">
                                <FiImage className="label-icon" />
                                Imagen del vestido
                            </label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="imageFile"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={isSubmitting}
                                    className="file-input"
                                />
                                <label htmlFor="imageFile" className="file-input-label">
                                    <FiUpload />
                                    {imageFile ? imageFile.name : 'Seleccionar imagen'}
                                </label>
                            </div>
                        </div>
                    </div>

                    {imagePreview && (
                        <div className="image-preview-container">
                            <label>Vista previa:</label>
                            <div className="image-preview">
                                <img
                                    src={imagePreview}
                                    alt="Vista previa"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '';
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="description">Descripción</label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descripción breve del vestido..."
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="details">Detalles</label>
                        <textarea
                            id="details"
                            value={formData.details}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            placeholder="Detalles adicionales (tallas, colores, materiales)..."
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notas Internas</label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Notas internas (no visibles para clientes)..."
                            rows={2}
                            disabled={isSubmitting}
                        />
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
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            <FiSave />
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDressModal;
