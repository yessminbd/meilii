import colorModel from "../models/colorModel.js";

// GET /api/color/list
export const listColors = async (req, res) => {
  try {
    const colors = await colorModel.find().sort({ name: 1 });
    res.json({ success: true, colors });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// POST /api/color/add
export const addColor = async (req, res) => {
  try {
    const { name, hex } = req.body;
    if (!name) return res.json({ success: false, message: "Name is required." });

    const existing = await colorModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing)
      return res.json({ success: false, message: "A color with this name already exists." });

    const color = new colorModel({
      name: name.trim(),
      hex: (hex || "#9ca3af").trim(),
    });
    await color.save();
    res.json({ success: true, color });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// POST /api/color/update
export const updateColor = async (req, res) => {
  try {
    const { id, name, hex } = req.body;
    if (!id) return res.json({ success: false, message: "Color ID is required." });

    const update = {};
    if (name) update.name = name.trim();
    if (hex) update.hex = hex.trim();

    const updated = await colorModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.json({ success: false, message: "Color not found." });
    res.json({ success: true, color: updated });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// POST /api/color/delete
export const deleteColor = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "Color ID is required." });

    const deleted = await colorModel.findByIdAndDelete(id);
    if (!deleted) return res.json({ success: false, message: "Color not found." });
    res.json({ success: true, message: "Color deleted." });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// POST /api/color/seed — seed default colors if none exist
export const seedColors = async (req, res) => {
  try {
    const count = await colorModel.countDocuments();
    if (count > 0) {
      return res.json({ success: false, message: "Colors already exist. Seed skipped." });
    }

    const defaults = [
      { name: "Black", hex: "#1a1a1a" },
      { name: "White", hex: "#f5f5f5" },
      { name: "Red", hex: "#ef4444" },
      { name: "Blue", hex: "#3b82f6" },
      { name: "Green", hex: "#22c55e" },
      { name: "Yellow", hex: "#eab308" },
      { name: "Grey", hex: "#9ca3af" },
      { name: "Orange", hex: "#f97316" },
      { name: "Pink", hex: "#ec4899" },
      { name: "Brown", hex: "#a16207" },
      { name: "Navy", hex: "#1e3a5f" },
      { name: "Beige", hex: "#d4c5a9" },
    ];

    await colorModel.insertMany(defaults);
    const colors = await colorModel.find().sort({ name: 1 });
    res.json({ success: true, colors, message: "Default colors seeded." });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
