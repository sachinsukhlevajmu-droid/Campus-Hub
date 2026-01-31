import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Palette, Monitor, Leaf, Waves, Sunset } from 'lucide-react';

type Theme = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'system';

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const themes: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" />, description: 'Clean & bright' },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" />, description: 'Easy on the eyes' },
  { value: 'ocean', label: 'Ocean', icon: <Waves className="h-4 w-4" />, description: 'Calm blue tones' },
  { value: 'forest', label: 'Forest', icon: <Leaf className="h-4 w-4" />, description: 'Natural greens' },
  { value: 'sunset', label: 'Sunset', icon: <Sunset className="h-4 w-4" />, description: 'Warm orange hues' },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" />, description: 'Match your OS' },
];

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'ocean', 'forest', 'sunset');
    
    let effectiveTheme = theme;
    
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (effectiveTheme !== 'light') {
      root.classList.add(effectiveTheme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('dark', 'ocean', 'forest', 'sunset');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={`flex items-center gap-3 cursor-pointer ${
              theme === themeOption.value ? 'bg-primary/10' : ''
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
              {themeOption.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{themeOption.label}</p>
              <p className="text-xs text-muted-foreground">{themeOption.description}</p>
            </div>
            {theme === themeOption.value && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
