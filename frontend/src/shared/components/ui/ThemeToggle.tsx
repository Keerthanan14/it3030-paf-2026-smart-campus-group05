import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../core/hooks/useTheme';
import { Button } from './Button';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const toggleButtonClass = `group !h-10 !w-10 !rounded-xl !p-0 !border-0 !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!ring-0 focus:!ring-offset-0 shadow-none ${className ?? ''}`;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme} 
      className={toggleButtonClass}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-foreground/70 transition-all duration-200 group-hover:scale-125 group-hover:text-foreground group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
      ) : (
        <Moon className="h-5 w-5 text-foreground/70 transition-all duration-200 group-hover:scale-125 group-hover:text-foreground group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
      )}
    </Button>
  );
}
