import express from "express";
import { getNotas } from "../controllers/notasController.js";

const router = express.Router();

router.get("/", getNotas);

export default router;
