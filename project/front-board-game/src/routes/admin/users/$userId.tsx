import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { adminApi } from '@/services/apiAdmin';
import { UserAvatar } from '@/components/UserAvatar';
import type { User } from '@/types/authTypes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, User as UserIcon, Mail, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Route = createFileRoute('/admin/users/$userId')({
  component: AdminUserDetailComponent,
});

function AdminUserDetailComponent() {
  const { userId } = Route.useParams();
  
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Временное состояние для редактирования
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.users.getById(userId);
        setUser(data);
        setFormData(data); // Заполняем форму данными
      } catch (err) {
        toast.error("Пользователь не найден");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    try {
      // Вызываем именно админский метод
      const updated = await adminApi.users.update(userId, formData);
      setUser(updated);
      setIsEditing(false);
      toast.success("Данные успешно сохранены администратором");
    } catch (err) {
      toast.error("Ошибка при сохранении");
    }
  };

  if (isLoading) return <div className="p-10 text-center">Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" /> К списку пользователей</Link>
      </Button>

      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="flex flex-row items-center gap-4 bg-muted/30">
          <UserAvatar imageUrl={user.avatar} username={user.name} className="w-16 h-16" />
          <div className="flex-1">
            <CardTitle className="text-2xl">{user.name || 'Игрок'}</CardTitle>
            <Badge variant="outline" className="mt-1">ID: {user._id}</Badge>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">Изменить</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon"><X size={18} /></Button>
              <Button onClick={handleSave} variant="default" size="icon" className="bg-green-600 hover:bg-green-700">
                <Save size={18} />
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          {/* Поле: Имя */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><UserIcon size={14}/> Имя пользователя</label>
            {isEditing ? (
              <Input 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            ) : (
              <p className="p-2 bg-muted/20 rounded border">{user.name || 'Не указано'}</p>
            )}
          </div>

          {/* Поле: Login */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">@ Логин</label>
            {isEditing ? (
              <Input 
                value={formData.login || ''} 
                onChange={e => setFormData({...formData, login: e.target.value})}
              />
            ) : (
              <p className="p-2 bg-muted/20 rounded border font-mono text-primary">{user.login}</p>
            )}
          </div>

          {/* Поле: Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Mail size={14}/> Электронная почта</label>
            {isEditing ? (
              <Input 
                value={formData.email || ''} 
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            ) : (
              <p className="p-2 bg-muted/20 rounded border">{user.email}</p>
            )}
          </div>

          {/* Поле: Роль (Select или просто текст для админа) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Shield size={14}/> Права доступа</label>
            <div className="flex items-center gap-4 p-2 bg-muted/10 rounded border">
               <span className="flex-1 capitalize font-bold">{isEditing ? formData.role : user.role}</span>
               {isEditing && (
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setFormData({...formData, role: formData.role === 'admin' ? 'user' : 'admin' as any})}
                 >
                   Переключить на {formData.role === 'admin' ? 'User' : 'Admin'}
                 </Button>
               )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}