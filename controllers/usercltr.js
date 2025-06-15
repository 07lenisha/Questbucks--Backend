import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import path from "path";
import fs from "fs";
import _ from "lodash";
import User from "../models/usermodel.js";
import { validationResult } from "express-validator";
import sendResetEmail from "../utils/sendResetEmail.js";

const usercltr = {};

usercltr.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const body = _.pick(req.body, ["name", "email", "password", "role"]);
  try {
    const salt = await bcryptjs.genSalt();
    const hash = await bcryptjs.hash(body.password, salt);
    const totalUsers = await User.countDocuments();
    const user = new User(body);
    user.password = hash;
    if (totalUsers == 0) {
      user.role = "admin";
    } else {
      if (user.role == "user" || user.role == "company") {
        user.role = body.role;
      } else {
        return res.status(400).json({ errors: [{ msg: "role is required " }] });
      }
    }
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something went wrong!!!" });
  }
};

usercltr.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ errors: [{ msg: "Invalid email or password" }] });
    }
    const isVerified = await bcryptjs.compare(password, user.password);
    if (!isVerified) {
      return res.status(404).json({ errors: [{ msg: "Invalid email or password" }] });
    }
    const tokenData = { userId: user._id, role: user.role };
    const token = jwt.sign(tokenData, process.env.SECRET, { expiresIn: "7d" });
    res.json({
      token,
      role: user.role,
      subscription_status: user.subscription_status,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ errors: [{ msg: "Something went wrong" }] });
  }
};

usercltr.profile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.file) {
      if (user.image) {
        const oldPath = path.join(process.cwd(), "uploads", user.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.image = req.file.path;
    }
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: "Something went wrong" });
  }
};

usercltr.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (req.body.name) user.name = req.body.name;
    if (req.body.password) {
      const salt = await bcryptjs.genSalt(10);
      user.password = await bcryptjs.hash(req.body.password, salt);
    }
    if (req.file) {
      user.image = req.file.path;
    }
    await user.save();
    res.json(user);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

usercltr.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });
    const resetToken = jwt.sign({ userId: user._id }, process.env.SECRET, {
      expiresIn: "15m",
    });
    await sendResetEmail(email, resetToken);
    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: "Something went wrong" });
  }
};

usercltr.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const hash = await bcryptjs.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ errors: "Invalid or expired token" });
  }
};

usercltr.activateUser = async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { isActive } = req.body;
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.isActive = isActive;
    await user.save();
    res.json({ message: `User ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

usercltr.list = async (req, res) => {
  try {
    const user = await User.find();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong!!!" });
  }
};

export default usercltr;
