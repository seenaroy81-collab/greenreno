import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stripe from "stripe";
import User from "../models/User.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

// Place Order (Cash on Delivery)
export const placeOrderCOD = async (req, res) => {
  try {
    const { items, addressId } = req.body;
    const userId = req.user.id;

    let totalAmount = 0;
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product with ID ${item.product} not found`);
        }
        totalAmount += product.price * item.quantity;
        return { product: item.product, quantity: item.quantity };
      })
    );

    const newOrder = new Order({
      userId,
      items: orderItems,
      amount: totalAmount,
      address: addressId,
      paymentType: "COD",
      status: "Order Placed",
      isPaid: false,
    });

    await newOrder.save();
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    res.json({ success: true, message: "Order placed successfully (COD)" });
  } catch (error) {
    console.error("Error placing COD order:", error);
    res.json({ success: false, message: `Error: ${error.message}` });
  }
};

// Place Order (Stripe)
export const placeOrderStripe = async (req, res) => {
  try {
    const { items, addressId } = req.body;
    const userId = req.user.id;
    const frontend_url = "http://localhost:5173";

    const line_items = await Promise.all(
        items.map(async (item) => {
            const product = await Product.findById(item.product);
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                    },
                    unit_amount: product.price * 100, // Amount in cents
                },
                quantity: item.quantity,
            };
        })
    );
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
        const product = await Product.findById(item.product);
        totalAmount += product.price * item.quantity;
    }


    const newOrder = new Order({
        userId,
        items,
        amount: totalAmount,
        address: addressId,
        paymentType: "Stripe",
        status: "Pending Payment",
        isPaid: false,
    });

    await newOrder.save();
    
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/myorders`,
      cancel_url: `${frontend_url}/cart`,
      metadata: {
        orderId: newOrder._id.toString(),
        userId,
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error placing Stripe order:", error);
    res.json({ success: false, message: `Error: ${error.message}` });
  }
};

// Get all orders for a specific user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId })
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.json({ success: false, message: `Error: ${error.message}` });
  }
};

// Get all orders (for seller)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("items.product")
      .populate("userId", "name email")
      .populate("address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.json({ success: false, message: `Error: ${error.message}` });
  }
};


//Stripe Webhook
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        if (session.payment_status === "paid" && session.metadata) {
          const { orderId, userId } = session.metadata;
          if (orderId) {
            await Order.findByIdAndUpdate(orderId, { isPaid: true, status: "Paid" });
          }
          if (userId) {
            await User.findByIdAndUpdate(userId, { cartItems: {} });
          }
        }
        break;
      }

      default:
        console.warn(`Unhandled event type ${event.type}`);
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook event:", err);
    return res.status(500).send("Internal Server Error");
  }
};