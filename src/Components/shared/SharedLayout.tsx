import type { ReactNode } from 'react';
import SharedNavbar from './SharedNavbar';
import '../../styles/StaffMenu.css';

interface SharedLayoutProps {
  children: ReactNode;
}

const SharedLayout = ({ children }: SharedLayoutProps) => {
  return (
    <div className="staff-layout">
      <SharedNavbar />
      <div className="staff-main-content">
        {children}
      </div>
    </div>
  );
};

export default SharedLayout;

