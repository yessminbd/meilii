import mongoose from "mongoose";

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  hex: { type: String, required: true, trim: true, default: "#9ca3af" },
  date: { type: Number, default: () => Date.now() },
});

const colorModel =
  mongoose.models.color || mongoose.model("color", colorSchema);
export default colorModel;
