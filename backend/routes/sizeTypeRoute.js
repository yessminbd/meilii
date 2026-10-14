import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  listSizeTypes,
  addSizeType,
  updateSizeType,
  addValueToSizeType,
  removeValueFromSizeType,
  deleteSizeType,
} from "../controllers/sizeTypeController.js";

const sizeTypeRouter = express.Router();

sizeTypeRouter.get("/list", listSizeTypes);
sizeTypeRouter.post("/add", adminAuth, addSizeType);
sizeTypeRouter.put("/update/:id", adminAuth, updateSizeType);
sizeTypeRouter.post("/addValue/:id", adminAuth, addValueToSizeType);
sizeTypeRouter.delete("/removeValue/:id", adminAuth, removeValueFromSizeType);
sizeTypeRouter.delete("/delete/:id", adminAuth, deleteSizeType);

export default sizeTypeRouter;
