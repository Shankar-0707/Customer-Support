import { type Router as RouterType, Router } from "express";
import * as userController from "../controllers/user.controller.js";

const router: RouterType = Router();

router.get("/", userController.list);
router.get("/:id", userController.getById);
router.post("/identify", userController.identify);

export default router;
