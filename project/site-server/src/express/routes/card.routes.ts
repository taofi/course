import { Router } from "express";
import { authMiddleware } from "@express/middlewares/AuthMiddleware";
import { CardController } from "../controllers/card.controller";
import { UserRole } from "@src/db/models/user.model";
import { uploadCardImage } from "../middlewares/uploadMiddleware";
import logger from "@src/utils/logger";
import { handleMulterError } from "../middlewares/handleMulterError";



const router = Router();



router.get("/doors", CardController.getAllDoors);
router.get("/doors/:id",  CardController.getDoorById);

router.post("/doors", authMiddleware(UserRole.ADMIN), CardController.addDoor);
router.put("/doors/:id", authMiddleware(UserRole.ADMIN), CardController.updateDoor);
router.delete("/doors/:id", authMiddleware(UserRole.ADMIN), CardController.deleteDoor);


router.get("/treasures", CardController.getAllTreasures);
router.get("/treasures/:id", CardController.getTreasureById);

router.post("/treasures", authMiddleware(UserRole.ADMIN), CardController.addTreasure);
router.put("/treasures/:id", authMiddleware(UserRole.ADMIN), CardController.updateTreasure);
router.delete("/treasures/:id", authMiddleware(UserRole.ADMIN), CardController.deleteTreasure);

router.post(
    "/upload-image", 
    authMiddleware(UserRole.ADMIN), 
    handleMulterError(uploadCardImage.single('image')),
    CardController.uploadImage
);
export default router;