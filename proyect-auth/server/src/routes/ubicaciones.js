import express from "express";
import { 
    obtenerMapa, 
    obtenerEdificios, 
    obtenerEdificioPorId,
    obtenerSalas,
    obtenerSalaPorId,
    obtenerPuntosInteres
} from "../controllers/ubicacionesController.js";

const router = express.Router();

// GET /ubicaciones - Mapa completo
router.get("/", obtenerMapa);

// GET /ubicaciones/edificios - Solo edificios
router.get("/edificios", obtenerEdificios);

// GET /ubicaciones/edificios/:id - Edificio por ID
router.get("/edificios/:id", obtenerEdificioPorId);

// GET /ubicaciones/salas - Todas las salas
router.get("/salas", obtenerSalas);

// GET /ubicaciones/salas/:id - Sala por ID
router.get("/salas/:id", obtenerSalaPorId);

// GET /ubicaciones/puntos-interes - Puntos de interés
router.get("/puntos-interes", obtenerPuntosInteres);

export default router;
