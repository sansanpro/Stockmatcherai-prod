
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  onOpenSettings: () => void;
}

const UserMenu = ({ onOpenSettings }: UserMenuProps) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleSettings = () => {
    onOpenSettings();
    setIsOpen(false);
  };

  // Extract first name from full name or use email if no full name
  const getDisplayName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(' ')[0]; // Get first name
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 hover:bg-sand transition-colors px-2 sm:px-3"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-ink-soft">
            {getDisplayName()}
          </span>
          <ChevronDown className="w-4 h-4 text-ink-faint" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 sm:w-56 p-1 sm:p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 border-b border-line">
            <p className="text-sm font-medium text-ink">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-ink-faint">
              {user?.email}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
            className="w-full justify-start h-8 px-2 hover:bg-sand"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 "
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserMenu;
