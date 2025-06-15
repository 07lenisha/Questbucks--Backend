import { Schema, model } from "mongoose";
import Quiz from "./quizmodel.js";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image:{
    type:String
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'company'],
    default: 'user',
  },
  points: {
    type: Number,
    default: 0,
  },
   quizHistory: [
  {
    quizId: { 
      type: Schema.Types.ObjectId,
        ref: "Quiz",
        required: true, },
    score: { type: Number },
    company_name: { type: String },
    quizTitle: {
      type:String},

    attempted_at: { type: Date, default: Date.now }
  },
],
  subscription_status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  },
 isActive: {
   type: Boolean, 
   default: true },

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },

  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiration: {
    type: Date,
    default: null,
  },
});

userSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const User = model("User", userSchema);

export default User;
