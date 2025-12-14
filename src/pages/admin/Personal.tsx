import { useState, useEffect, useMemo } from 'react';
import { FiEdit, FiUsers, FiUserCheck, FiUserX, FiShield, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SharedLayout from '../../Components/shared/SharedLayout';
import SharedHeader from '../../Components/shared/SharedHeader';
import DataTable from '../../Components/shared/DataTable';
import type { TableColumn } from '../../Components/shared/DataTable';
import StatusBadge from '../../Components/shared/StatusBadge';
import ActionButton from '../../Components/shared/ActionButton';
import SummaryCard from '../../Components/shared/SummaryCard';
import { supabase } from '../../utils/supabase/client';
import EditUserModal from '../../Components/admin/EditUserModal';
import AddUserModal from '../../Components/admin/AddUserModal';
import '../../styles/Personal.css';

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

const Personal = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error al cargar usuarios');
        return;
      }

      if (data) {
        // Mapear datos y asignar status por defecto si no existe
        const usersWithStatus = data.map((user: any) => ({
          ...user,
          status: user.status || 'active', // Por defecto activo si no existe el campo
        }));
        setUsers(usersWithStatus);
      }
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleGenerateReport = () => {
    toast.success('Generando reporte...');
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('Profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        toast.error('Error al actualizar estatus');
        return;
      }

      toast.success('Estatus actualizado correctamente');
      loadUsers();
    } catch (error) {
      toast.error('Error al actualizar estatus');
    }
  };

  const handleSaveEdit = async (updatedUser: Partial<User>) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('Profiles')
        .update({
          name: updatedUser.name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role_user: updatedUser.role_user,
        })
        .eq('id', selectedUser.id);

      if (error) {
        toast.error('Error al actualizar usuario');
        return;
      }

      toast.success('Usuario actualizado correctamente');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      toast.error('Error al actualizar usuario');
    }
  };

  const handleAddUser = async (userData: {
    name: string;
    last_name: string;
    email: string;
    phone: string;
    role_user: string;
    password: string;
  }) => {
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        toast.error(`Error al crear usuario: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        toast.error('Error al crear usuario');
        return;
      }

      // Crear perfil en Profiles
      const { error: profileError } = await supabase
        .from('Profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          last_name: userData.last_name || null,
          email: userData.email,
          phone: userData.phone || null,
          role_user: userData.role_user,
          status: 'active',
        });

      if (profileError) {
        toast.error(`Error al crear perfil: ${profileError.message}`);
        // Nota: El usuario fue creado en Auth pero no se pudo crear el perfil
        // El administrador deberá eliminar el usuario manualmente si es necesario
        return;
      }

      toast.success('Usuario agregado correctamente');
      setIsAddModalOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Error al agregar usuario');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'N/A';
    return role === 'admin' ? 'Administrador' : 'Personal';
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const admins = users.filter(u => u.role_user === 'admin').length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      admins,
    };
  }, [users]);

  const columns: TableColumn<User>[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellido' },
    { key: 'email', label: 'Correo' },
    { key: 'phone', label: 'Teléfono' },
    { 
      key: 'role_user', 
      label: 'Rol',
      render: (_, user) => (
        <span className={`role-badge ${user.role_user === 'admin' ? 'admin' : 'staff'}`}>
          {getRoleLabel(user.role_user)}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Fecha de Creación',
      render: (_, user) => formatDate(user.created_at)
    },
    { 
      key: 'status', 
      label: 'Estatus',
      render: (_, user) => (
        <StatusBadge 
          status={user.status || 'active'} 
          onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
        />
      )
    },
    { 
      key: 'actions', 
      label: 'Acciones',
      render: (_, user) => (
        <ActionButton
          variant="edit"
          icon={<FiEdit />}
          onClick={() => handleEdit(user)}
          title="Editar"
        />
      )
    },
  ];

  return (
    <SharedLayout>
      <div className="personal-container">
        <SharedHeader 
          onSearch={handleSearch}
          onGenerateReport={handleGenerateReport}
          searchValue={searchQuery}
        />

        <main className="personal-main">
          <div className="personal-header-section">
            <h1 className="personal-title">Personal</h1>
            <button className="add-user-button" onClick={() => setIsAddModalOpen(true)}>
              <FiPlus />
              <span>Agregar Usuario</span>
            </button>
          </div>

          <div className="summary-cards">
            <SummaryCard
              title="Total de Personal"
              value={stats.totalUsers}
              icon={<FiUsers />}
              variant="default"
            />
            <SummaryCard
              title="Personal Activo"
              value={stats.activeUsers}
              icon={<FiUserCheck />}
              variant="success"
            />
            <SummaryCard
              title="Personal Inactivo"
              value={stats.inactiveUsers}
              icon={<FiUserX />}
              variant="danger"
            />
            <SummaryCard
              title="Administradores"
              value={stats.admins}
              icon={<FiShield />}
              variant="warning"
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
            keyExtractor={(user) => user.id}
            loading={loading}
            emptyMessage="No hay usuarios para mostrar"
          />
        </main>

        {isEditModalOpen && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            onSave={handleSaveEdit}
          />
        )}

        {isAddModalOpen && (
          <AddUserModal
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddUser}
          />
        )}
      </div>
    </SharedLayout>
  );
};

export default Personal;

