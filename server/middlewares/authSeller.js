import jwt from "jsonwebtoken";

const authSeller = async (req, res, next) => {
  const { sellerToken } = req.cookies;

  // Check if the sellerToken exists in cookies
  if (!sellerToken) {
    return res.status(403).json({ success: false, message: "Not Authorized" });
  }

  try {
    // Verify the token using your JWT secret
    const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);

    // Check if the token's email matches the seller email (process.env.SELLER_EMAIL)
    if (tokenDecode.email === process.env.SELLER_EMAIL) {
      return next(); // Continue to the next middleware or route handler
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Not Authorized" });
    }
  } catch (error) {
    // Handle token verification errors
    return res.status(403).json({ success: false, message: "Not Authorized" });
  }
};

export default authSeller;