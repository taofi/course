import { RedisService } from "@src/services/redis.service";
import redis from "@src/config/redis";

jest.mock("../config/redis");

describe("RedisService", () => {
  let service: RedisService;

  beforeEach(() => {
    service = new RedisService();
  });

  it("should set a key with TTL", async () => {
    const setMock = redis.set as jest.Mock;
    setMock.mockResolvedValue("OK");

    await service.set("testKey", "value", 10);

    expect(setMock).toHaveBeenCalledWith("testKey", "value", "EX", 10);
  });

  it("should get a key", async () => {
    const getMock = redis.get as jest.Mock;
    getMock.mockResolvedValue("value");

    const result = await service.get("testKey");
    expect(result).toBe("value");
    expect(getMock).toHaveBeenCalledWith("testKey");
  });

  it("should delete a key", async () => {
    const delMock = redis.del as jest.Mock;
    delMock.mockResolvedValue(1);

    await service.del("testKey");
    expect(delMock).toHaveBeenCalledWith("testKey");
  });

  it("should check if key exists", async () => {
    const existsMock = redis.exists as jest.Mock;
    existsMock.mockResolvedValue(1);

    const result = await service.exists("testKey");
    expect(result).toBe(true);
  });
});
