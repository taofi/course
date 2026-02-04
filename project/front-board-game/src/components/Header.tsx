import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { UserAvatar } from '@/components/UserAvatar';

export function Header() {
    const { user, isAuthenticated } = useAuth();

    return (
        <header className="bg-card border-b border-border shadow-md sticky top-0 z-1000">
            <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">

                {/* Логотип/Название сайта */}
                <Link
                    to="/"
                    className="text-2xl font-semibold tracking-wide text-foreground hover:text-primary transition-colors"
                >
                    КАРТОЧКИН
                </Link>

                {/* Навигация и Статус */}
                <nav className="flex items-center space-x-4">

                    {/* Кнопка смены темы */}
                    <ThemeToggle />

                    {isAuthenticated && user ? (
                        <div className="flex items-center space-x-2">

                            {/* Ссылка на Профиль: Оборачиваем Аватар и Имя */}
                            <Link
                                to="/profile"
                                className="flex items-center space-x-2 p-1 rounded-full hover:bg-accent transition-colors"
                            >
                                {/* 1. Аватар пользователя */}
                                <UserAvatar
                                    imageUrl={user.avatar}
                                    username={user.name || user.login}
                                    className="w-8 h-8" // Маленький размер для хедера
                                />

                                {/* 2. Имя пользователя */}
                                <span className="font-semibold text-sm text-foreground hidden sm:inline">
                                    {user.name || user.login}
                                </span>
                            </Link>


                        </div>
                    ) : (
                        <div className="space-x-2">
                            {/* Кнопка Войти */}
                            <Link to="/auth/login">
                                <Button variant="default" size="sm">
                                    Войти
                                </Button>
                            </Link>
                            {/* Кнопка Регистрация */}
                            <Link to="/auth/register">
                                <Button variant="secondary" size="sm">
                                    Регистрация
                                </Button>
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}