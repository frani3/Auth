import express from "express";
import cors from "cors";

import horarioRoutes from "./routes/horario.js";
import notasRoutes from "./routes/notas.js";
import eventosRoutes from "./routes/eventos.js";
import ubicacionesRoutes from "./routes/ubicaciones.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/horario", horarioRoutes);
app.use("/notas", notasRoutes);
app.use("/evento", eventosRoutes);
app.use("/ubicaciones", ubicacionesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));
