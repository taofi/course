const express = require("express");
const router = express.Router();

import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import lobbyRouter from "./lobby.routes";
import gameRouter from "./games.routes";
import cardRouter from "./card.routes";
import resultRouter from "./result.routes";
import adminRouter from "./admin.routes";




router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/games", gameRouter)
router.use("/lobbies", lobbyRouter)
router.use("/cards", cardRouter)
router.use("/results", resultRouter)
router.use("/admin", adminRouter)





export default router;
