import mongoose from "mongoose";

// Un documento por local y por día: { _id: "<localId>:<YYYY-MM-DD>", seq: 12 }
const contadorSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Contador = mongoose.model("Contador", contadorSchema);
export default Contador;
