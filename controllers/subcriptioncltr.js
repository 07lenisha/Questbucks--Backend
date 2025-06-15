import { validationResult } from "express-validator";
import Subscription from "../models/subcriptionmodel.js";
import User from "../models/usermodel.js";
import razorpayInstance from "../config/razorpayInstance.js";
import crypto from "crypto";

const subscriptionCtrl = {};

subscriptionCtrl.createSubscription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { subscription_type, price, quiz_limit, billingCycle } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || (user.role !== "company" && user.role !== "admin")) {
      return res.status(403).json({ message: "Not authorized to create subscription" });
    }

    const subscription_start = new Date();
    const subscription_end = new Date(subscription_start);

    const durationMonths = {
      silver: 1,
      gold: 3,
      enterprise: 6,
    };

    const baseMonths = durationMonths[subscription_type.toLowerCase()] || 1;

    if (billingCycle === "yearly") {
      subscription_end.setMonth(subscription_end.getMonth() + baseMonths * 12);
    } else {
      subscription_end.setMonth(subscription_end.getMonth() + baseMonths);
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `receipt_sub_${Date.now()}`,
    });

    const subscription = new Subscription({
      user_id: userId,
      subscription_type,
      price,
      quiz_limit,
      billingCycle,
      subscription_start,
      subscription_end,
      status: "expired",
      razorpay_order_id: razorpayOrder.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await subscription.save();

    res.status(201).json({
      message: "Subscription created and Razorpay order initialized",
      order: razorpayOrder,
      subscriptionId: subscription._id,
    });
  } catch (err) {
    console.error("Subscription create error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

subscriptionCtrl.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const subscription = await Subscription.findOne({ razorpay_order_id });
    if (!subscription) return res.status(404).json({ message: "Subscription not found" });

    subscription.status = "active";
    subscription.updated_at = new Date();
    await subscription.save();

    await User.findByIdAndUpdate(subscription.user_id, {
      subscription_status: "active",
    });

    res.status(200).json({ message: "Payment verified and subscription activated" });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

subscriptionCtrl.listSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    let subscriptions;

    if (user.role === "admin") {
      subscriptions = await Subscription.find().populate("user_id", "name email role");
    } else if (user.role === "company") {
      subscriptions = await Subscription.find({ user_id: userId });
    } else {
      return res.status(403).json({ message: "Users do not have subscriptions" });
    }

    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error("List Subscriptions Error:", error);
    res.status(500).json({ message: "Server error while fetching subscriptions" });
  }
};

export default subscriptionCtrl;
