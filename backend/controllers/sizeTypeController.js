import sizeTypeModel from "../models/sizeTypeModel.js";

// GET /api/sizeType/list
export const listSizeTypes = async (req, res) => {
  try {
    const types = await sizeTypeModel.find().sort({ date: 1 });
    res.json({ success: true, sizeTypes: types });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// POST /api/sizeType/add
export const addSizeType = async (req, res) => {
  try {
    const { name, kind, values } = req.body;
    if (!name) return res.json({ success: false, message: "Name is required." });

    const existing = await sizeTypeModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing)
      return res.json({ success: false, message: "A size type with this name already exists." });

    const sizeType = new sizeTypeModel({
      name: name.trim(),
      kind: kind || "text",
      values: Array.isArray(values) ? values.map((v) => v.trim()).filter(Boolean) : [],
    });
    await sizeType.save();
    res.json({ success: true, sizeType });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// PUT /api/sizeType/update/:id
export const updateSizeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, kind } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (kind) update.kind = kind;

    const updated = await sizeTypeModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.json({ success: false, message: "Size type not found." });
    res.json({ success: true, sizeType: updated });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// POST /api/sizeType/addValue/:id  – push a single value into the values array
export const addValueToSizeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    if (!value) return res.json({ success: false, message: "Value is required." });

    const sizeType = await sizeTypeModel.findById(id);
    if (!sizeType) return res.json({ success: false, message: "Size type not found." });

    const trimmed = value.trim();
    if (sizeType.values.includes(trimmed))
      return res.json({ success: false, message: "Value already exists." });

    sizeType.values.push(trimmed);
    await sizeType.save();
    res.json({ success: true, sizeType });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// DELETE /api/sizeType/removeValue/:id  – remove a single value
export const removeValueFromSizeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    if (!value) return res.json({ success: false, message: "Value is required." });

    const sizeType = await sizeTypeModel.findById(id);
    if (!sizeType) return res.json({ success: false, message: "Size type not found." });

    sizeType.values = sizeType.values.filter((v) => v !== value);
    await sizeType.save();
    res.json({ success: true, sizeType });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// DELETE /api/sizeType/delete/:id
export const deleteSizeType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await sizeTypeModel.findByIdAndDelete(id);
    if (!deleted) return res.json({ success: false, message: "Size type not found." });
    res.json({ success: true, message: "Size type deleted." });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
