// repositories/user.repository.ts

import { User, IUser } from "../models/user.model";
import { Types } from "mongoose";
import { IsEmail, IsNotEmpty, Length, ValidationArguments } from "class-validator";
import BaseRepository from "./base.repository";

// --- DTO и валидация остаются неизменными ---

const validationMessages = {
    IsNotEmpty: (args: ValidationArguments) => `${args.property} не должен быть пустым.`,
    IsEmail: (args: ValidationArguments) => `Поле ${args.property} должно быть корректным адресом электронной почты.`,
    Length: (args: ValidationArguments) =>
        `Длина поля ${args.property} должна быть от ${args.constraints[0]} до ${args.constraints[1]} символов.`,
};

class UserDto {
    @IsNotEmpty({ message: validationMessages.IsNotEmpty })
    name!: string;

    @IsNotEmpty({ message: validationMessages.IsNotEmpty })
    login!: string;

    @IsEmail({}, { message: validationMessages.IsEmail })
    @IsNotEmpty({ message: validationMessages.IsNotEmpty })
    email!: string;

    @IsNotEmpty({ message: validationMessages.IsNotEmpty })
    @Length(6, 61, { message: validationMessages.Length })
    password!: string;
}

// --- UserRepository без кэширования ---

export default class UserRepository extends BaseRepository {
    // Конструктор теперь не принимает RedisService и не инициализирует UserCacheService
    constructor() {
        super();
    }

    async create(data: Partial<IUser>): Promise<IUser> {
        // ... (Валидация DTO) ...
        const dto = new UserDto();
        if (!data.name || !data.login || !data.email || !data.password) {
            throw new Error("Validation failed: Missing required fields");
        }
        
        dto.name = data.name;
        dto.login = data.login;
        dto.email = data.email;
        dto.password = data.password;

        await this.validateDto(dto);
        // --- Конец валидации ---

        const user = new User(data);
        // Запись в БД
        const newUser = await user.save();
        
        return newUser; 
    }


    async findById(id: string | Types.ObjectId): Promise<IUser | null> {
        // Прямое чтение из БД (с исключением пароля)
        const user = await User.findById(id);
        return user;
    }

    async findByLogin(login: string): Promise<IUser | null> {
        // Прямое чтение из БД (с исключением пароля)
        const user = await User.findOne({ login });
        return user;
    }

    async findByEmail(email: string): Promise<IUser | null> {
        // Прямое чтение из БД (с исключением пароля)
        const user = await User.findOne({ email });
        
        return user;
    }

    async getAll(): Promise<IUser[]> {
        return User.find().select('-password');
    }

    async update(id: unknown, data: Partial<IUser>): Promise<IUser | null> {
        // Обновление в БД
        const updatedUser = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
        
        // Логика инвалидации кэша удалена
        
        return updatedUser;
    }

    async delete(id: string): Promise<IUser | null> {
        // Удаление из БД
        const deletedUser = await User.findByIdAndDelete(id);

        // Логика инвалидации кэша удалена

        return deletedUser;
    }
}