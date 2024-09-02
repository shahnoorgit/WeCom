import { generateToken, storeRefreshToken } from "../lib/lib.js";
import { redis } from "../lib/redis.js";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";

const setCookie = (res, refreshToken, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevent cross-site scripting attacks
    secure: process.env.NODE_ENV === "production", // use secure cookies in production
    sameSite: "strict", // prevent cross-site forgery attacks
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevent cross-site scripting attacks
    secure: process.env.NODE_ENV === "production", // use secure cookies in production
    sameSite: "strict", // prevent cross-site forgery attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signupController = async (req, res) => {
  const { email, password, name } = await req.body;
  try {
    const isUser = await User.findOne({ email: email });
    if (isUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const newUser = await User.create({
      email,
      password,
      name,
      cartcartItems: [],
    });

    const { refreshToken, accessToken } = await generateToken(newUser._id);
    await storeRefreshToken(newUser._id, accessToken);
    setCookie(res, refreshToken, accessToken);
    res.status(201).json({
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message });
  }
};

export const signinController = async () => {};

export const logoutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = await jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message });
  }
};
