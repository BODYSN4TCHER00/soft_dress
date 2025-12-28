import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/context/AuthContext';
import '../../styles/UserDropdown.css';

const UserDropdown = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const userRole = user?.role === 'admin' ? 'Administrador' : 'Personal';

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    if (!user) return null;

    return (
        <div className="user-dropdown" ref={dropdownRef}>
            <button
                className="user-dropdown-trigger"
                onClick={toggleDropdown}
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                <FiUser className="user-icon" />
                <span className="user-name-display">{user.name}</span>
                <FiChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="user-dropdown-menu">
                    <div className="dropdown-user-info">
                        <div className="dropdown-user-name">{user.name}</div>
                        <div className="dropdown-user-role">{userRole}</div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-logout-btn" onClick={handleLogout}>
                        <FiLogOut />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
