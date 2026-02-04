import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router'; // Добавили Link
import { adminApi } from '@/services/apiAdmin';
import type { User } from '@/types/authTypes';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal,  Trash2, ShieldAlert, Loader2, Eye } from "lucide-react"; // Добавили Eye
import { toast } from "react-hot-toast";

export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersComponent,
})

function AdminUsersComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.users.getAll();
      setUsers(data || []);
    } catch (error) {
      toast.error("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeletePending(true);
      await adminApi.users.delete(userToDelete._id);
      toast.success(`Пользователь @${userToDelete.login} удален`);
      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
    } catch (error) {
      toast.error("Не удалось удалить пользователя");
    } finally {
      setIsDeletePending(false);
      setUserToDelete(null);
    }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.users.update(user._id, { role: newRole as any });
      toast.success(`Роль @${user.login} изменена`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole as any } : u));
    } catch (error) {
      toast.error("Ошибка обновления роли");
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Загрузка...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <Badge variant="outline">Всего: {users.length}</Badge>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead>Профиль</TableHead>
              <TableHead>Email / Логин</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="text-right whitespace-nowrap">Управление</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  {/* ПЕРЕХОД ПО КЛИКУ НА ИМЯ/АВАТАР */}
                  <Link 
                    to="/admin/users/$userId" 
                    params={{ userId: user._id }}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <UserAvatar
                      imageUrl={user.avatar}
                      username={user.name || user.login}
                      className="w-10 h-10 border transition-transform group-hover:scale-105"
                      isEditable={false}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {user.name || 'Игрок'}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Details</span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-mono text-muted-foreground">@{user.login}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Действия</DropdownMenuLabel>
                      
                      {/* ПЕРЕХОД ЧЕРЕЗ МЕНЮ */}
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users/$userId" params={{ userId: user._id }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотреть профиль
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => toggleRole(user)}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Изменить роль
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setUserToDelete(user)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить аккаунт
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => !isDeletePending && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Пользователь <strong>@{userToDelete?.login}</strong> будет навсегда удален из базы данных.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletePending}
            >
              {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Удалить безвозвратно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}