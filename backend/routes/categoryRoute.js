import express from "express";
import {
    listCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    removeSubCategory
} from "../controllers/categoryController.js";
import adminAuth from "../middleware/adminAuth.js";

const categoryRouter = express.Router();

categoryRouter.get('/list', listCategories);
categoryRouter.post('/add', adminAuth, addCategory);
categoryRouter.post('/update', adminAuth, updateCategory);
categoryRouter.post('/delete', adminAuth, deleteCategory);
categoryRouter.post('/subcategory/add', adminAuth, addSubCategory);
categoryRouter.post('/subcategory/remove', adminAuth, removeSubCategory);

export default categoryRouter;
