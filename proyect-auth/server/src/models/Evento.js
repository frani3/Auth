import mongoose from "mongoose";

const EventoSchema = new mongoose.Schema({
    titulo: String,
    descripcion: String,
    latitud: Number,
    longitud: Number,
    fecha: String,
    hora: String,
    creador: String
});

export default mongoose.model("Evento", EventoSchema);
