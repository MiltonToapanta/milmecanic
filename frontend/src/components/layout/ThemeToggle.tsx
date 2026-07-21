import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../app/store/theme.store';
import { Button } from '../ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <Button variant="ghost" className="w-10 px-0" onClick={toggleTheme} title="Cambiar tema">
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
