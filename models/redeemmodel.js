import { Schema, model } from "mongoose";

const redemptionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
 quizId: {
   type: 
 Schema.Types.ObjectId, 
 ref: "Quiz"
  },
  
  points_earned: {
    type: Number,
    required: true,
  },
  redemption_code: {
    type: String,
    required: true,
  },
  company_name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "redeemed", "expired"],
    default: "pending",
  },
  expires_at: {
    type: Date,
    required: true,
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

redemptionSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Redemption = model("Redemption", redemptionSchema);

export default Redemption;
