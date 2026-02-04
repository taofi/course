
export function AppFooter() {
    return (
        <footer className="w-full border-t border-border p-4 text-center bg-card text-muted-foreground text-sm">
            <div className="max-w-7xl mx-auto">
                &copy; {new Date().getFullYear()} Карточкин. Все права защищены.
            </div>
        </footer>
    );
}