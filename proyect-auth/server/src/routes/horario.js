import express from "express";
import { getHorario } from "../controllers/horarioController.js";

const router = express.Router();

router.get("/", getHorario);

export default router;
