import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  listColors,
  addColor,
  updateColor,
  deleteColor,
  seedColors,
} from "../controllers/colorController.js";

const colorRouter = express.Router();

colorRouter.get("/list", listColors);
colorRouter.post("/add", adminAuth, addColor);
colorRouter.post("/update", adminAuth, updateColor);
colorRouter.post("/delete", adminAuth, deleteColor);
colorRouter.post("/seed", adminAuth, seedColors);

export default colorRouter;
