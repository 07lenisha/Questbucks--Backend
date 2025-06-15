import Quiz from "../models/quizmodel.js";
import Subscription from "../models/subcriptionmodel.js";
import { validationResult } from "express-validator";
import User from "../models/usermodel.js";
import _ from "lodash";

const quizCltr = {};
quizCltr.create = async (req, res) => {
  if (req.role !== "company" && req.role !== "admin") {
    return res.status(403).json({ error: "Only companies and admins can create quizzes" });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return res.status(400).json({ errors: errors.array() });

  const { title, description, questions, quiz_type } = req.body;
  const total_points = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  try {
    const subscription = await Subscription.findOne({
      user_id: req.userId,
      status: "active",
      subscription_end: { $gte: new Date() },
    });

    if (!subscription) {
      return res.status(403).json({ error: "No active subscription found. Please subscribe first." });
    }

    if (subscription.quiz_limit <= 0) {
      return res.status(403).json({ error: "Quiz creation limit reached. Please upgrade your subscription." });
    }

    const quiz = new Quiz({
      user_id: req.userId,
      title,
      description,
      questions,
      quiz_type,
      total_points,
    });

    await quiz.save();

    subscription.quiz_limit -= 1;
    subscription.updated_at = new Date();
    await subscription.save();

    res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while creating quiz" });
  }
};

quizCltr.update = async (req, res) => {
  if (req.role !== "company" && req.role !== "admin") {
    return res.status(403).json({ error: "Only companies and admins can update quizzes" });
  }

  const { id } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, quiz_type, questions } = req.body;

    let total_points = 0;
    if (Array.isArray(questions)) {
      total_points = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      {
        title,
        description,
        quiz_type,
        questions,
        total_points,
      },
      { new: true }
    );

    if (!updatedQuiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(updatedQuiz);
  } catch (err) {
    console.error("Error updating quiz:", err);
    res.status(500).json({ error: "Something went wrong while updating quiz" });
  }
};

quizCltr.remove = async (req, res) => {
  if (req.role !== "company" && req.role !== "admin") {
    return res.status(403).json({ error: "Only companies and admins can delete quizzes" });
  }

  const { id } = req.params;

  try {
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz)
      return res.status(404).json({ error: "Quiz not found" });
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while deleting quiz" });
  }
};

quizCltr.addTotalPoints = async (req, res) => {
  const { id } = req.params;

  try {
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const total_points = quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    quiz.total_points = total_points;

    await quiz.save();

    res.json({
      message: "Total points updated successfully",
      quiz,
    });
  } catch (err) {
    console.error("Add Total Points Error:", err);
    res.status(500).json({ error: "Failed to update total points" });
  }
};

quizCltr.getAll = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.role;

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let query = {};

    if (userRole === "company") {
      query = { user_id: userId };
    } else if (userRole === "admin") {
      query = {};
    } else {
      query = {};
    }

    const totalQuizzes = await Quiz.countDocuments(query);
    const totalPages = Math.ceil(totalQuizzes / limit);

    const quizzes = await Quiz.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user_id", "name email")
     . populate("attempts.user_id", "name")
      .sort({ created_at: -1 });

    res.json({
      page,
      limit,
      totalPages,
      totalQuizzes,
      quizzes,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

quizCltr.getById = async (req, res) => {
  const { quizId } = req.params;

  try {
    const quiz = await Quiz.findById(quizId).select('-correct_answers').populate({
  path: 'attempts.user_id',
  model: 'User',
  select: 'name email',
});
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
    console.log("Quiz attempts with populated users:", quiz.attempts);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
};

quizCltr.submitQuiz = async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const userId = req.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!Array.isArray(answers)) return res.status(400).json({ error: "Answers must be an array" });

  try {
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let score = 0;
    quiz.questions.forEach((question, i) => {
      const selected = question.options[answers[i]];
      if (selected?.is_correct) score += question.points || 1;
    });

    return res.status(200).json({
      message: "Submitted and scored",
      quizId: id,
      score,
      attemptedAt: new Date(),
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};



quizCltr.addQuizAttempt = async (req, res) => {
  const { quizId, score, answers, attemptedAt } = req.body;
  const userId = req.userId;
  const userRole = req.role;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (userRole !== "user") {
    return res.status(403).json({ error: "Only users can attempt quizzes" });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const hasAttempted = quiz.attempts.some(
      (attempt) => attempt.user_id.toString() === userId.toString()
    );

    if (hasAttempted) {
      return res.status(400).json({ error: "You have already attempted this quiz." });
    }

    quiz.attempts.push({
      user_id: userId,
      quizId,
      answers,
      score,
      attempted_at: attemptedAt || new Date(),
    });

    await quiz.save();

    const user = await User.findById(userId).populate("name email");

    return res.status(200).json({
      message: "Quiz attempt recorded successfully",
      user_id: userId,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("Add Quiz Attempt Error:", err);
    return res.status(500).json({ error: "Failed to add quiz attempt" });
  }
};


quizCltr.addUserQuizHistory = async (req, res) => {
  const userId = req.userId;
  const { quizId, quizTitle, score, attemptedAt } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const quiz = await Quiz.findById(quizId).populate("user_id", "name").populate("attempts.user_id", "name");
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const quizHistoryEntry = {
      quizId,
      company_name: quiz.user_id.name,
      
      quizTitle,
      score,
      attempted_at: attemptedAt,
    };

    user.quizHistory.push(quizHistoryEntry);
    user.points += score;

    await user.save();

    return res.status(200).json({
      message: "User history updated",
      totalPoints: user.points,
    });
    
  } catch (err) {
    console.error("Add Quiz History Error:", err);
    return res.status(500).json({ error: "Failed to update quiz history" });
  }
};

quizCltr.UserQuizHistory = async (req, res) => {
  const userId = req.userId;
  const userRole = req.role;

  try {
    const user = await User.findById(userId).select("quizHistory");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user.quizHistory)
   
  } catch (err) {
    console.error("Fetch Quiz History Error:", err);
    res.status(500).json({ error: "Failed to fetch quiz history" });
  }
};

export default quizCltr;
