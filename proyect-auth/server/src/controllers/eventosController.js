// Mock de eventos en memoria
let eventos = [
    {
        id: 1,
        titulo: "Hackathon 2025",
        descripcion: "Evento de programación",
        latitud: -33.45,
        longitud: -70.66,
        fecha: "2025-12-10",
        hora: "10:00",
        creador: "admin@mail.com"
    }
];

export const crearEvento = (req, res) => {
    const nuevoEvento = {
        id: eventos.length + 1,
        ...req.body
    };
    eventos.push(nuevoEvento);
    res.status(201).json(nuevoEvento);
};

export const obtenerEventos = (req, res) => {
    res.json(eventos);
};
