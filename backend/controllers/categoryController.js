import categoryModel from "../models/categoryModel.js";

// List all categories
export const listCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find({}).sort({ name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        console.error("Error in listCategories:", error);
        res.json({ success: false, message: error.message });
    }
};

// Add a category
export const addCategory = async (req, res) => {
    try {
        const { name, subCategories } = req.body;
        if (!name || !name.trim()) {
            return res.json({ success: false, message: "Category name is required" });
        }

        const trimmedName = name.trim();
        const existing = await categoryModel.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (existing) {
            return res.json({ success: false, message: "A category with this name already exists" });
        }

        let parsedSubCategories = [];
        if (subCategories) {
            if (Array.isArray(subCategories)) {
                parsedSubCategories = subCategories;
            } else if (typeof subCategories === 'string') {
                try {
                    parsedSubCategories = JSON.parse(subCategories);
                } catch {
                    parsedSubCategories = subCategories.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
        }

        parsedSubCategories = [...new Set(parsedSubCategories.map(s => String(s).trim()).filter(Boolean))];

        const newCategory = new categoryModel({
            name: trimmedName,
            subCategories: parsedSubCategories,
            date: Date.now()
        });

        await newCategory.save();
        res.json({ success: true, message: "Category added successfully", category: newCategory });
    } catch (error) {
        console.error("Error in addCategory:", error);
        res.json({ success: false, message: error.message });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const { id, name, subCategories } = req.body;
        if (!id) {
            return res.json({ success: false, message: "Category ID is required" });
        }

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        if (name && name.trim()) {
            const trimmedName = name.trim();
            const existing = await categoryModel.findOne({
                _id: { $ne: id },
                name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
            });
            if (existing) {
                return res.json({ success: false, message: "Another category already has this name" });
            }
            category.name = trimmedName;
        }

        if (subCategories !== undefined) {
            let parsedSubCategories = [];
            if (Array.isArray(subCategories)) {
                parsedSubCategories = subCategories;
            } else if (typeof subCategories === 'string') {
                try {
                    parsedSubCategories = JSON.parse(subCategories);
                } catch {
                    parsedSubCategories = subCategories.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
            category.subCategories = [...new Set(parsedSubCategories.map(s => String(s).trim()).filter(Boolean))];
        }

        await category.save();
        res.json({ success: true, message: "Category updated successfully", category });
    } catch (error) {
        console.error("Error in updateCategory:", error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.json({ success: false, message: "Category ID is required" });
        }

        const category = await categoryModel.findByIdAndDelete(id);
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error in deleteCategory:", error);
        res.json({ success: false, message: error.message });
    }
};

// Add a subcategory to an existing category
export const addSubCategory = async (req, res) => {
    try {
        const { id, subCategory } = req.body;
        if (!id || !subCategory || !subCategory.trim()) {
            return res.json({ success: false, message: "Category ID and SubCategory name are required" });
        }

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        const trimmedSub = subCategory.trim();
        const exists = category.subCategories.some(
            s => s.toLowerCase() === trimmedSub.toLowerCase()
        );

        if (exists) {
            return res.json({ success: false, message: "Subcategory already exists in this category" });
        }

        category.subCategories.push(trimmedSub);
        await category.save();

        res.json({ success: true, message: "Subcategory added successfully", category });
    } catch (error) {
        console.error("Error in addSubCategory:", error);
        res.json({ success: false, message: error.message });
    }
};

// Remove a subcategory from an existing category
export const removeSubCategory = async (req, res) => {
    try {
        const { id, subCategory } = req.body;
        if (!id || !subCategory) {
            return res.json({ success: false, message: "Category ID and SubCategory are required" });
        }

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        const trimmedSub = subCategory.trim();
        category.subCategories = category.subCategories.filter(
            s => s.toLowerCase() !== trimmedSub.toLowerCase()
        );

        await category.save();
        res.json({ success: true, message: "Subcategory removed successfully", category });
    } catch (error) {
        console.error("Error in removeSubCategory:", error);
        res.json({ success: false, message: error.message });
    }
};
