// src/tests/auth.service.spec.ts
import { AuthService } from "@src/services/auth.service";
import { IUser } from "@src/db/models/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Моки репозитория и Redis
const userRepoMock = {
  findByLogin: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const redisServiceMock = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(userRepoMock as any, redisServiceMock as any);
  });

  it("register should create new user and generate tokens", async () => {
    userRepoMock.findByLogin.mockResolvedValue(null);
    userRepoMock.create.mockImplementation(async (data) => ({ ...data, _id: "1" }));

    const result = await authService.register({ name: "Test", login: "test", password: "123" });

    expect(result.user.login).toBe("test");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      "refresh:1",
      result.refreshToken,
      expect.any(Number)
    );
  });

  it("register should throw if user exists", async () => {
    userRepoMock.findByLogin.mockResolvedValue({ login: "test" });

    await expect(authService.register({ name: "Test", login: "test", password: "123" }))
      .rejects.toThrow("Пользователь с таким логином уже существует");
  });

  it("login should return tokens if password correct", async () => {
    const hashed = await bcrypt.hash("123", 10);
    userRepoMock.findByLogin.mockResolvedValue({ login: "test", password: hashed, _id: "1" });

    const result = await authService.login("test", "123");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("login should throw if password incorrect", async () => {
    const hashed = await bcrypt.hash("123", 10);
    userRepoMock.findByLogin.mockResolvedValue({ login: "test", password: hashed, _id: "1" });

    await expect(authService.login("test", "wrong")).rejects.toThrow("Неверный пароль");
  });

  it("logout should delete refresh token", async () => {
    redisServiceMock.del.mockResolvedValue(undefined);
    await authService.logout("1");
    expect(redisServiceMock.del).toHaveBeenCalledWith("refresh:1");
  });

  it("refreshTokens should generate new tokens if valid", async () => {
    const fakeToken = jwt.sign({ id: "1" }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });
    redisServiceMock.get.mockResolvedValue(fakeToken);
    userRepoMock.findById.mockResolvedValue({ login: "test", _id: "1" });

    const result = await authService.refreshTokens(fakeToken);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("refreshTokens should throw if token invalid or not in redis", async () => {
    const fakeToken = jwt.sign({ id: "1" }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });
    redisServiceMock.get.mockResolvedValue(null);

    await expect(authService.refreshTokens(fakeToken)).rejects.toThrow("Недействительный refresh токен");
  });
});
