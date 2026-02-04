import { Request, Response, NextFunction } from "express";
import logger from "../../utils/logger";
import { cardLibraryService } from "../../services";
import { CardNotFoundError, ValidationError } from "../../utils/CustomErrors";

export class CardController {
  private static parseFormData(data: any) {
    const fieldsToParse = ['action', 'params', 'race', 'class']; // Поля, которые могут быть JSON-строками

    fieldsToParse.forEach(field => {
      if (typeof data[field] === 'string') {
        try {
          data[field] = JSON.parse(data[field]);
        } catch (e) {
          // Если это не JSON (например, обычная строка 'any'), оставляем как есть
        }
      }
    });
    return data;
  }


  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const uploadedFile = req.file;

      if (!uploadedFile) {
        throw new ValidationError("Файл изображения не был предоставлен. Убедитесь, что поле в FormData называется 'image'.");
      }

      const imageUrl = `public/cards/img/${uploadedFile.filename}`;

      return res.json({
        message: "Изображение успешно загружено",
        imageUrl: imageUrl
      });
    } catch (err) {
      next(err);
    }
  }

  static async addTreasure(req: Request, res: Response, next: NextFunction) {
    try {
      let cardData = CardController.parseFormData(req.body);

      if (!cardData.name) {
        throw new ValidationError("Название карточки сокровища обязательно");
      }
      if (!cardData.description) {
        throw new ValidationError("Описание карточки сокровища обязательно");
      }

      const card = await cardLibraryService.addTreasure(cardData);
      return res.status(201).json(card);
    } catch (err) {
      next(err);
    }
  }

  static async updateTreasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cardData = req.body;

      if (!id) {
        throw new ValidationError("ID карточки обязателен для обновления");
      }

      const updatedCard = await cardLibraryService.updateTreasure(id, cardData);

      logger.debug(`Обновлена карта сокровища с ID: ${id}`);
      return res.json(updatedCard);
    } catch (err) {
      next(err);
    }
  }

  static async deleteTreasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("ID карточки обязателен для удаления");
      }

      await cardLibraryService.deleteTreasure(id);

      logger.debug(`Удалена карта сокровища с ID: ${id}`);
      return res.json({ message: "Карта сокровища успешно удалена" });
    } catch (err) {
      next(err);
    }
  }

  // --- МЕТОДЫ ДЛЯ ДВЕРЕЙ (DOORS) ---


  static async addDoor(req: Request, res: Response, next: NextFunction) {
    try {
      const doorData = req.body;

      if (!doorData.name) {
        throw new ValidationError("Название карточки двери обязательно");
      }

      if (!doorData.description) {
        throw new ValidationError("Описание карточки двери обязательно");
      }

      const door = await cardLibraryService.addDoor(doorData);
      return res.status(201).json(door);
    } catch (err) {
      next(err);
    }
  }

  static async updateDoor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doorData = req.body; // Ожидаем JSON

      if (!id) {
        throw new ValidationError("ID двери обязателен для обновления");
      }

      const updatedDoor = await cardLibraryService.updateDoor(id, doorData);
      return res.json(updatedDoor);
    } catch (err) {
      next(err);
    }
  }

  static async deleteDoor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("ID двери обязателен для удаления");
      }

      await cardLibraryService.deleteDoor(id);

      logger.debug(`Удалена карта двери с ID: ${id}`);
      return res.json({ message: "Карта двери успешно удалена" });
    } catch (err) {
      next(err);
    }
  }


  static async getAllDoors(req: Request, res: Response, next: NextFunction) {
    try {
      const doors = await cardLibraryService.getAllDoors();
      return res.json(doors);
    } catch (err) {
      next(err);
    }
  }

  // Получение одной двери по ID
  static async getDoorById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Необходимо id");
      }
      const door = await cardLibraryService.getDoorById(id);
      if (!door) throw new CardNotFoundError("Карточка двери не найдена");
      return res.json(door);
    } catch (err) {
      next(err);
    }
  }

  // Аналогично для сокровищ (Treasures)
  static async getAllTreasures(req: Request, res: Response, next: NextFunction) {
    try {
      const treasures = await cardLibraryService.getAllTreasures();
      return res.json(treasures);
    } catch (err) {
      next(err);
    }
  }

  static async getTreasureById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ValidationError("Необходимо id");
      }
      const treasure = await cardLibraryService.getTreasureById(id);
      if (!treasure) throw new ValidationError("Карточка сокровища не найдена");
      return res.json(treasure);
    } catch (err) {
      next(err);
    }
  }
}