import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  CreditCard,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

export const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  // Get display name with fallbacks
  const displayName = profile?.display_name || 
    user?.user_metadata?.full_name || 
    user?.email?.split('@')[0] || 
    'Student';

  // Get initials for avatar fallback
  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'S';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
          <Avatar 
            className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
          >
            <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm sm:text-base font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 sm:w-56" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/profile-settings')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/profile-settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/profile-settings')}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Account</span>
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => window.open('mailto:vermaawishek1234@gmail.com', '_blank')}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
