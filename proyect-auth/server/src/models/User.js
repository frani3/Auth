import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: String,
    nombre: String,
    rol: { type: String, enum: ["estudiante", "profesor", "externo"] },
});

export default mongoose.model("User", UserSchema);
