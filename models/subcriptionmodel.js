

import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription_type: {
    type: String,
    enum: [ "silver", "gold", "enterprise"],
    default: "free",
  },
  subscription_start: {
    type: Date,
    required: true,
    default: Date.now,
  },
  subscription_end: {
    type: Date,
    
  },
  status: {
    type: String,
    enum: ["active", "expired"],
    default: "active",
  },
  razorpay_order_id:
   { type: String },
  razorpay_payment_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  quiz_limit: {
    type: Number,
    required: true,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});


subscriptionSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
