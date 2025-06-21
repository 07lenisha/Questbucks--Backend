import { Schema, model } from "mongoose";
import User from "./usermodel.js";
const quizSchema = new Schema({
 
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  questions: [
    {
      
      question_text: {
        type: String,
        required: true,
      },
      options: [
        {
        
          option_text: {
            type: String,
            required: true,
          },
          is_correct: {
            type: Boolean,
            default: false,
          },
        },
      ],
      points: {
        type: Number,
        default: 10,
      },
    },
  ],
  quiz_type: {
    type: String,
    enum: ["multiple_choice", "true_false"],
    default: "multiple_choice",
  },
  total_points: {
    type: Number,
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
attempts: [
    {

      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      answers: {
        type: [Number],  
        required: true,
      },
      
      score: {
        type: Number,
        required: true,
      },
      attempted_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

quizSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Quiz = model("Quiz", quizSchema);

export default Quiz;
