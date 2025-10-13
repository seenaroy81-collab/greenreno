import User from "../models/User.js";

export const updateCart = async (req, res) => {
  try {
    const userId = req.userId;  // Assuming you use auth middleware that sets req.userId
    const { cartItems } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    if (!cartItems || typeof cartItems !== 'object') {
      return res.status(400).json({ success: false, message: "Invalid cartItems" });
    }

    await User.findByIdAndUpdate(userId, { cartItems });

    return res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
