import Redemption from "../models/redeemmodel.js";
import User from "../models/usermodel.js";
import Quiz from "../models/quizmodel.js";
import crypto from "crypto";

const redemptionCltr = {};

function generateRedemptionCode(points) {
  const randomPart = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `RWDS${points}-${randomPart}`;
}

redemptionCltr.create = async (req, res) => {
  try {
    const userId = req.userId;
    const { quizId, score } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!quizId) return res.status(400).json({ error: 'Quiz ID is required' });

    const userScore = typeof score === 'object' && score !== null ? score.score : score;
    if (!userScore || typeof userScore !== 'number' || userScore <= 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const quiz = await Quiz.findById(quizId).populate('user_id', 'name email');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    user.points = (user.points || 0) + userScore;
    await user.save();

    const redemption_code = generateRedemptionCode(userScore);
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const redemption = new Redemption({
      user_id: userId,
      username: user.name,
      quizId: quizId,
      company_name: quiz.user_id.name,
      points_earned: userScore,
      redemption_code,
      status: 'pending',
      expires_at,
    });

    await redemption.save();

    return res.status(201).json({
      message: `Redemption code created for ${userScore} points`,
      redemption_code,
      expires_at,
      redemption,
    });

  } catch (error) {
    console.error('Redemption creation error:', error);
    return res.status(500).json({ error: 'Failed to create redemption' });
  }
};

redemptionCltr.list = async (req, res) => {
  const userId = req.userId;
  const role = req.role;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let filter = {};

    if (role === "admin") {
      // no filter
    } else if (role === "company") {
      const quizzes = await Quiz.find({ user_id: userId }, { _id: 1 });
      const quizIds = quizzes.map(q => q._id);
      filter.quizId = { $in: quizIds };
    } else {
      filter.user_id = userId;
    }

    const redemptions = await Redemption.find(filter)
      .populate({
        path: "quizId",
        select: "title user_id",
        populate: {
          path: "user_id",
          select: "name email",
        },
      })
      .populate("user_id", "name email")
      .sort({ created_at: -1 });

    return res.status(200).json({ redemptions });
  } catch (error) {
    console.error("List Redemption Error:", error);
    res.status(500).json({ error: "Failed to list redemption codes" });
  }
};

redemptionCltr.checkExpired = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const now = new Date();
    await Redemption.updateMany(
      { user_id: userId, status: "pending", expires_at: { $lt: now } },
      { $set: { status: "expired" } }
    );

    res.status(200).json({ message: "Expired redemptions updated." });
  } catch (error) {
    console.error("Expire Check Error:", error);
    res.status(500).json({ error: "Failed to update expired redemptions" });
  }
};

redemptionCltr.redeem = async (req, res) => {
  const userId = req.userId;
  const { redemption_code } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!redemption_code) return res.status(400).json({ error: "Redemption code is required" });

  try {
    const redemption = await Redemption.findOne({ redemption_code, user_id: userId });
    if (!redemption) return res.status(404).json({ error: "Redemption code not found" });

    if (redemption.status === "redeemed") {
      return res.status(400).json({ error: "Redemption code already used" });
    }

    if (redemption.expires_at < new Date()) {
      redemption.status = "expired";
      await redemption.save();
      return res.status(400).json({ error: "Redemption code expired" });
    }

    redemption.status = "redeemed";
    redemption.updated_at = new Date();
    await redemption.save();

    res.status(200).json({ message: "Redemption code redeemed successfully", redemption });
  } catch (error) {
    console.error("Redeem Code Error:", error);
    res.status(500).json({ error: "Failed to redeem code" });
  }
};

export default redemptionCltr;
