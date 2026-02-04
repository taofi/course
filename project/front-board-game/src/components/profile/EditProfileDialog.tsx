import React, { useState, useEffect } from 'react';
import { ApiUser } from '@/services/apiUser';
import type { User } from '@/types/authTypes';
import type { UserUpdateData } from '@/types/userTypes';

// Компоненты shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export function EditProfileDialog({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Локальное состояние формы
  const [formData, setFormData] = useState({
    name: '',
    login: '',
  });

  // При открытии диалога заполняем форму текущими данными пользователя
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        login: user.login || '',
      });
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 1. Формируем объект только с измененными полями
      const updates: UserUpdateData = {};

      if (formData.name !== user.name) updates.name = formData.name;
      if (formData.login !== user.login) updates.login = formData.login;

      // 2. Если изменений нет, просто закрываем окно
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      // 3. Отправляем запрос
      const updatedUser = await ApiUser.updateUser(updates);
      
      if (updatedUser) {
        onSuccess(updatedUser);
        onClose();
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      // Здесь можно добавить toast notification об ошибке
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактирование профиля</DialogTitle>
          <DialogDescription>
            Внесите изменения в профиль. Нажмите сохранить, когда закончите.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Поле Имя */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Имя
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          
          {/* Поле Логин */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="login" className="text-right">
              Логин
            </Label>
            <Input
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}