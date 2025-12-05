import express from "express";
import cors from "cors";

import horarioRoutes from "./routes/horario.js";
import notasRoutes from "./routes/notas.js";
import eventosRoutes from "./routes/eventos.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/horario", horarioRoutes);
app.use("/notas", notasRoutes);
app.use("/evento", eventosRoutes);

app.listen(3000, () => console.log("API corriendo en puerto 3000"));
