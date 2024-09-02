import express from "express";
import {
  logoutController,
  signinController,
  signupController,
} from "../controllers/Auth.controller.js";

const router = express.Router();

router.post("/signup", signupController);
router.post("/signin", signinController);
router.post("/logout", logoutController);

export default router;
