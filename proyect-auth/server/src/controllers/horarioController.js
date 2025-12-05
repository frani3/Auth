import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mapaFile = path.join(__dirname, "../data/mapa_coordenadas.json");

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

// Obtener sala por ID
const obtenerSalaPorId = (salaId) => {
    const mapa = leerMapa();
    if (!mapa) return null;
    
    for (const edificio of mapa.elementos.edificios_y_complejos) {
        const sala = edificio.salas.find(s => s.id === salaId);
        if (sala) {
            return {
                ...sala,
                edificio_id: edificio.id,
                edificio_nombre: edificio.nombre
            };
        }
    }
    return null;
};

export const getHorario = (req, res) => {
    const horario = [
        // LUNES
        { 
            dia: "Lunes", 
            inicio: "08:30", 
            fin: "10:00", 
            ramo: "Cálculo I",
            profesor: "Dr. Martín González",
            sala_id: "sur_lab_a",
            sala: obtenerSalaPorId("sur_lab_a")
        },
        { 
            dia: "Lunes", 
            inicio: "10:15", 
            fin: "11:45", 
            ramo: "Física General",
            profesor: "Dra. Carolina Muñoz",
            sala_id: "cen_am",
            sala: obtenerSalaPorId("cen_am")
        },
        { 
            dia: "Lunes", 
            inicio: "14:00", 
            fin: "15:30", 
            ramo: "Programación",
            profesor: "Prof. Andrés Silva",
            sala_id: "nor_lab_red",
            sala: obtenerSalaPorId("nor_lab_red")
        },
        // MARTES
        { 
            dia: "Martes", 
            inicio: "08:30", 
            fin: "10:00", 
            ramo: "Álgebra Lineal",
            profesor: "Dr. Felipe Rojas",
            sala_id: "sur_estudio",
            sala: obtenerSalaPorId("sur_estudio")
        },
        { 
            dia: "Martes", 
            inicio: "10:15", 
            fin: "11:45", 
            ramo: "Introducción a la Ingeniería",
            profesor: "Prof. María Paz Contreras",
            sala_id: "nor_dec_ing",
            sala: obtenerSalaPorId("nor_dec_ing")
        },
        { 
            dia: "Martes", 
            inicio: "15:00", 
            fin: "16:30", 
            ramo: "Taller de Comunicación",
            profesor: "Prof. Javiera López",
            sala_id: "preu_101",
            sala: obtenerSalaPorId("preu_101")
        },
        // MIÉRCOLES
        { 
            dia: "Miércoles", 
            inicio: "08:30", 
            fin: "10:00", 
            ramo: "Cálculo I",
            profesor: "Dr. Martín González",
            sala_id: "sur_lab_a",
            sala: obtenerSalaPorId("sur_lab_a")
        },
        { 
            dia: "Miércoles", 
            inicio: "10:15", 
            fin: "11:45", 
            ramo: "Química General",
            profesor: "Dra. Valentina Herrera",
            sala_id: "cm_lab_01",
            sala: obtenerSalaPorId("cm_lab_01")
        },
        { 
            dia: "Miércoles", 
            inicio: "14:00", 
            fin: "15:30", 
            ramo: "Programación",
            profesor: "Prof. Andrés Silva",
            sala_id: "nor_lab_red",
            sala: obtenerSalaPorId("nor_lab_red")
        },
        // JUEVES
        { 
            dia: "Jueves", 
            inicio: "08:30", 
            fin: "10:00", 
            ramo: "Física General",
            profesor: "Dra. Carolina Muñoz",
            sala_id: "cen_am",
            sala: obtenerSalaPorId("cen_am")
        },
        { 
            dia: "Jueves", 
            inicio: "10:15", 
            fin: "11:45", 
            ramo: "Álgebra Lineal",
            profesor: "Dr. Felipe Rojas",
            sala_id: "sur_estudio",
            sala: obtenerSalaPorId("sur_estudio")
        },
        { 
            dia: "Jueves", 
            inicio: "14:00", 
            fin: "16:30", 
            ramo: "Laboratorio de Física",
            profesor: "Dra. Carolina Muñoz",
            sala_id: "sur_aud",
            sala: obtenerSalaPorId("sur_aud")
        },
        // VIERNES
        { 
            dia: "Viernes", 
            inicio: "08:30", 
            fin: "10:00", 
            ramo: "Cálculo I",
            profesor: "Dr. Martín González",
            sala_id: "preu_102",
            sala: obtenerSalaPorId("preu_102")
        },
        { 
            dia: "Viernes", 
            inicio: "10:15", 
            fin: "11:45", 
            ramo: "Introducción a la Ingeniería",
            profesor: "Prof. María Paz Contreras",
            sala_id: "nor_grados",
            sala: obtenerSalaPorId("nor_grados")
        },
        { 
            dia: "Viernes", 
            inicio: "12:00", 
            fin: "13:30", 
            ramo: "Electivo: Inteligencia Artificial",
            profesor: "Dr. Pablo Mendoza",
            sala_id: "nor_lab_red",
            sala: obtenerSalaPorId("nor_lab_red")
        }
    ];

    res.json(horario);
};
