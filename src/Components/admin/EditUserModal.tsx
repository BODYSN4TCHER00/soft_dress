import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import '../../styles/EditUserModal.css';

interface User {
  id: string;
  name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role_user: string | null;
  created_at: string;
  status?: 'active' | 'inactive';
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
}

const EditUserModal = ({ user, onClose, onSave }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    role_user: user.role_user || 'staff',
  });

  useEffect(() => {
    setFormData({
      name: user.name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role_user: user.role_user || 'staff',
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Usuario</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Apellido</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role_user">Rol</label>
            <select
              id="role_user"
              name="role_user"
              value={formData.role_user}
              onChange={handleChange}
              required
            >
              <option value="staff">Personal</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="save-button">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

