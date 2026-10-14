import mongoose from "mongoose";

const sizeTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  // 'numeric' = shoe sizes (parsed as float), 'text' = clothing labels (S/M/L)
  kind: { type: String, enum: ["numeric", "text"], default: "text" },
  values: [{ type: String, trim: true }],
  date: { type: Number, default: () => Date.now() },
});

const sizeTypeModel =
  mongoose.models.sizeType || mongoose.model("sizeType", sizeTypeSchema);
export default sizeTypeModel;
