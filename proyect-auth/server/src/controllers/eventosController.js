import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "../data/eventos.json");

// Leer eventos del archivo JSON
const leerEventos = () => {
    try {
        if (fs.existsSync(dataFile)) {
            const data = fs.readFileSync(dataFile, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error leyendo eventos:", error);
    }
    return [];
};

// Guardar eventos en el archivo JSON
const guardarEventos = (eventos) => {
    try {
        const dir = path.dirname(dataFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dataFile, JSON.stringify(eventos, null, 2));
    } catch (error) {
        console.error("Error guardando eventos:", error);
    }
};

export const crearEvento = (req, res) => {
    const eventos = leerEventos();
    const nuevoEvento = {
        id: eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1,
        ...req.body
    };
    eventos.push(nuevoEvento);
    guardarEventos(eventos);
    res.status(201).json(nuevoEvento);
};

export const obtenerEventos = (req, res) => {
    const eventos = leerEventos();
    res.json(eventos);
};
