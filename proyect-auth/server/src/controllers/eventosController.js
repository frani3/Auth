import Evento from "../models/Evento.js";

export const crearEvento = async (req, res) => {
    try {
        const nuevoEvento = await Evento.create(req.body);
        res.status(201).json(nuevoEvento);
    } catch (error) {
        res.status(500).json({ error: "No se pudo crear el evento" });
    }
};

export const obtenerEventos = async (req, res) => {
    const eventos = await Evento.find();
    res.json(eventos);
};
