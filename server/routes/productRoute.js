import express from "express";
import authSeller from "../middlewares/authSeller.js";
import {
  addProduct,
  changeStock,
  productById,
  productList,
} from "../controllers/productController.js";
import { upload } from "../configs/multer.js";

const productRouter = express.Router();

// Route to add product
productRouter.post("/add", upload.array(["images"]), authSeller, addProduct);

// Route to list products
productRouter.get("/list", productList);

// Route to get product by ID
productRouter.get("/:id", productById); // Fix: Added ":" to define a dynamic product ID in the URL

// Route to change product stock
productRouter.post("/stock", authSeller, changeStock); // Fix: Changed GET to POST and added correct route path

export default productRouter;