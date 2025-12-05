import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "../data/mapa_coordenadas.json");

// Leer datos del mapa
const leerMapa = () => {
    try {
        if (fs.existsSync(dataFile)) {
            const data = fs.readFileSync(dataFile, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error leyendo mapa:", error);
    }
    return null;
};

// Obtener todo el mapa con edificios, salas y puntos de interés
export const obtenerMapa = (req, res) => {
    const mapa = leerMapa();
    if (!mapa) {
        return res.status(500).json({ error: "No se pudo cargar el mapa" });
    }
    res.json(mapa);
};

// Obtener solo los edificios
export const obtenerEdificios = (req, res) => {
    const mapa = leerMapa();
    if (!mapa) {
        return res.status(500).json({ error: "No se pudo cargar el mapa" });
    }
    res.json(mapa.elementos.edificios_y_complejos);
};

// Obtener un edificio por ID
export const obtenerEdificioPorId = (req, res) => {
    const { id } = req.params;
    const mapa = leerMapa();
    if (!mapa) {
        return res.status(500).json({ error: "No se pudo cargar el mapa" });
    }
    
    const edificio = mapa.elementos.edificios_y_complejos.find(e => e.id === id);
    if (!edificio) {
        return res.status(404).json({ error: "Edificio no encontrado" });
    }
    res.json(edificio);
};

// Obtener todas las salas de todos los edificios
export const obtenerSalas = (req, res) => {
    const mapa = leerMapa();
    if (!mapa) {
        return res.status(500).json({ error: "No se pudo cargar el mapa" });
    }
    
    const salas = [];
    mapa.elementos.edificios_y_complejos.forEach(edificio => {
        edificio.salas.forEach(sala => {
            salas.push({
                ...sala,
                edificio_id: edificio.id,
                edificio_nombre: edificio.nombre
            });
        });
    });
    res.json(salas);
};

// Buscar sala por ID
export const obtenerSalaPorId = (req, res) => {
    const { id } = req.params;
    const mapa = leerMapa();
    if (!mapa) {
        return res.status(500).json({ error: "No se pudo cargar el mapa" });
    }
    
    for (const edificio of mapa.elementos.edificios_y_complejos) {
        const sala = edificio.salas.find(s => s.id === id);
        if (sala) {
            return res.json({
                ...sala,
                edificio_id: edificio.id,
                edificio_nombre: edificio.nombre
            });
        }
    }
    res.status(404).json({ error: "Sala no encontrada" });
};

// Obtener puntos de interés
export const obtenerPuntosInteres = (req, res) => {
    const mapa = leerMapa();
    if (!mapa) {
        return res.status(500).json({ error: "No se pudo cargar el mapa" });
    }
    res.json(mapa.elementos.puntos_de_interes_y_areas);
};
