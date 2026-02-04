import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { UserController } from "../controllers/user.controller";
import { uploadAvatar } from "../middlewares/uploadMiddleware";
import { authMiddleware } from "@express/middlewares/AuthMiddleware";
import { attachUserMiddleware } from "../middlewares/attachUserMiddleware";

const router = Router();

router.get("/", attachUserMiddleware, AuthController.getUser);

router.put(
    '/', 
    authMiddleware(),
    UserController.updateUser
);
router.get("/:id", UserController.getUserById);
router.post(
    '/avatar', 
    authMiddleware(),            
    uploadAvatar.single('avatar'), 
    UserController.changeAvatar 
);
router.post("/avatar/select", authMiddleware(), UserController.selectDefaultAvatar);

router.get("/avatars/list", UserController.getAvatarList);


export default router;
