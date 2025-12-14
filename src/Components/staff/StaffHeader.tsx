// Re-export SharedHeader for backward compatibility
// StaffHeader doesn't show welcome message by default
import SharedHeader from '../shared/SharedHeader';

interface StaffHeaderProps {
  onSearch?: (query: string) => void;
  onGenerateReport?: () => void;
}

const StaffHeader = (props: StaffHeaderProps) => {
  return <SharedHeader {...props} showWelcome={false} />;
};

export default StaffHeader;

