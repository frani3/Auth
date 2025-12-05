import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "../data/eventos.json");
const mapaFile = path.join(__dirname, "../data/mapa_coordenadas.json");

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

// Leer mapa para obtener info de salas
const leerMapa = () => {
    try {
        if (fs.existsSync(mapaFile)) {
            const data = fs.readFileSync(mapaFile, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error leyendo mapa:", error);
    }
    return null;
};

// Obtener ubicación (sala o punto de interés) por ID
const obtenerUbicacionPorId = (ubicacionId) => {
    const mapa = leerMapa();
    if (!mapa) return null;
    
    // Buscar en salas de edificios
    for (const edificio of mapa.elementos.edificios_y_complejos) {
        const sala = edificio.salas.find(s => s.id === ubicacionId);
        if (sala) {
            return {
                tipo: "sala",
                ...sala,
                edificio_id: edificio.id,
                edificio_nombre: edificio.nombre
            };
        }
    }
    
    // Buscar en puntos de interés
    const punto = mapa.elementos.puntos_de_interes_y_areas.find(p => p.nombre === ubicacionId);
    if (punto) {
        return {
            tipo: "punto_interes",
            ...punto
        };
    }
    
    return null;
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
    const { ubicacion_id, ...resto } = req.body;
    
    // Obtener info de ubicación si se proporciona ubicacion_id
    let ubicacion = null;
    if (ubicacion_id) {
        ubicacion = obtenerUbicacionPorId(ubicacion_id);
    }
    
    const nuevoEvento = {
        id: eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1,
        ...resto,
        ubicacion_id: ubicacion_id || null,
        ubicacion: ubicacion
    };
    
    eventos.push(nuevoEvento);
    guardarEventos(eventos);
    res.status(201).json(nuevoEvento);
};

export const obtenerEventos = (req, res) => {
    const eventos = leerEventos();
    
    // Enriquecer eventos con info de ubicación actualizada
    const eventosConUbicacion = eventos.map(evento => {
        if (evento.ubicacion_id) {
            return {
                ...evento,
                ubicacion: obtenerUbicacionPorId(evento.ubicacion_id)
            };
        }
        return evento;
    });
    
    res.json(eventosConUbicacion);
};
