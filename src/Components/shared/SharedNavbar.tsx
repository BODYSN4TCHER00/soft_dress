import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/context/AuthContext';
import { 
  FiHome, 
  FiList, 
  FiCalendar,
  FiClipboard,
  FiUsers,
  FiLogOut
} from 'react-icons/fi';
import '../../styles/StaffNavbar.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const SharedNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Items diferentes según el rol
  const staffNavItems: NavItem[] = [
    { path: '/staff/menu', label: 'Menu', icon: <FiHome /> },
    { path: '/staff/rentas', label: 'Rentas', icon: <FiList /> },
    { path: '/catalogo', label: 'Catalogo', icon: <FiCalendar /> },
  ];

  const adminNavItems: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/admin/personal', label: 'Personal', icon: <FiClipboard /> },
    { path: '/catalogo', label: 'Catalogo', icon: <FiCalendar /> },
    { path: '/admin/clientes', label: 'Clientes', icon: <FiUsers /> },
    { path: '/admin/historial', label: 'Historial', icon: <FiCalendar /> },
  ];

  const navItems = isAdmin ? adminNavItems : staffNavItems;
  const userRole = isAdmin ? 'Administrador' : 'Personal';

  return (
    <div className="staff-navbar">
      <div className="navbar-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="dress-icon-container">
              <svg className="dress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L8 7H6C5.4 7 5 7.4 5 8V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V8C19 7.4 18.6 7 18 7H16L12 3Z" />
                <path d="M9 11H15M9 15H15" />
              </svg>
            </div>
            <span className="brand-text">OUTLET</span>
          </div>
          <div className="brand-divider"></div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar"></div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Usuario'}</div>
              <div className="user-role">{userRole}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedNavbar;

