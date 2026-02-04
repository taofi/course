// src/components/ThemeToggle.tsx

import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/contexts/useTheme'; 

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const getIcon = () => {
        if (theme === 'light') return <Sun className="h-5 w-5" />;
        if (theme === 'dark') return <Moon className="h-5 w-5" />;
        return <Laptop className="h-5 w-5" />;
    };

    const getTitle = () => {
        if (theme === 'light') return 'Светлая';
        if (theme === 'dark') return 'Темная';
        return 'Системная';
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Текущая тема: ${getTitle()}. Нажмите для переключения.`}
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
        >
            {getIcon()}
            <span className="sr-only">Смена темы</span>
        </Button>
    );
}