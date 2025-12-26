import express from "express";
import authUser from "../middlewares/authUser.js";
import authSeller from "../middlewares/authSeller.js";
import {
  getAllOrders,
  getUserOrders,
  placeOrderCOD,
  placeOrderStripe,
  stripeWebhooks, // <-- make sure orderController exports this EXACTLY
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// NOTE: Do NOT protect the webhook with auth middleware — Stripe will POST here.
orderRouter.post("/webhook", express.raw({ type: "application/json" }), stripeWebhooks);

// Regular routes (these can use JSON body parser)
orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.get("/user", authUser, getUserOrders);
orderRouter.get("/seller", authSeller, getAllOrders);
orderRouter.post("/stripe", authUser, placeOrderStripe);

export default orderRouter;
