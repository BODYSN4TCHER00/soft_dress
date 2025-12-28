import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiList,
  FiCalendar,
  FiUsers,
  FiMenu,
  FiX
} from 'react-icons/fi';
import MagnifiqueLogo from '../shared/MagnifiqueLogo';
import '../../styles/StaffNavbar.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const StaffNavbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const navItems: NavItem[] = [
    { path: '/staff/menu', label: 'Menu', icon: <FiHome /> },
    { path: '/staff/rentas', label: 'Rentas', icon: <FiList /> },
    { path: '/staff/clientes', label: 'Clientes', icon: <FiUsers /> },
    { path: '/catalogo', label: 'Catalogo', icon: <FiCalendar /> },
  ];

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />
      <div className={`staff-navbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="navbar-sidebar">
          <div className="sidebar-header">
            <div className="brand-logo">
              <MagnifiqueLogo size="small" className="text-only" />
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
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default StaffNavbar;


