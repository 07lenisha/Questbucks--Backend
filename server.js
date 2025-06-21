import dotenv from"dotenv"
dotenv.config()
import express from"express"
import cors from "cors"
import usercltr from "./controllers/usercltr.js"
import quizCltr from "./controllers/quizcltr.js"
import uploads from "./config/multer.js"
import { checkSchema } from "express-validator";
import { userloginSchema,userregisterSchema } from "./vallidators/uservallidator.js"
import redemptionCltr from './controllers/redeemcltr.js';
import configureDb from "./config/db.js"
import { runReminderJob} from './reminderCron.js';
import { quizSchemaValidation ,quizUpdateValidation} from "./vallidators/quizSchemaValidation.js";
import authenticateUser from "./middlewares/authenticate.js"
import authorizeUser from "./middlewares/authorize.js"
import subscriptionCtrl from "./controllers/subcriptioncltr.js"

const app=express();
const port=3077;
app.use(express.json());
app.get("/", (req, res) => {
  res.send("QuestBucks Backend is running 🚀");
});

app.use(cors());
app.use('/uploads', express.static('uploads'));
configureDb();
runReminderJob()

app.post('/register',checkSchema(userregisterSchema), usercltr.register);
app.post('/login',checkSchema(userloginSchema),usercltr.login);
app.get('/profile' ,uploads.single('image'), authenticateUser,usercltr.profile);
app.put('/update-profile', uploads.single('image'), authenticateUser,authorizeUser (['company']), usercltr.updateProfile);
app.put('/activateUser/:id',authenticateUser,authorizeUser (['admin']),usercltr.activateUser);
app.post('/forgotpassword', usercltr.forgotPassword);
app.post('/resetpassword', usercltr.resetPassword);
app.get('/users',authenticateUser,usercltr.list)

app.post("/quiz", authenticateUser ,checkSchema(quizSchemaValidation), authorizeUser (['company']),quizCltr.create);
app.put("/quiz/:id", authenticateUser, checkSchema(quizUpdateValidation ),authorizeUser (['company']), quizCltr.update);
app.delete("/quiz/:id",authenticateUser,authorizeUser (['company']), quizCltr.remove);
app.put("/quiz/:id/totalpoints", quizCltr.addTotalPoints);
app.post("/quiz/submit/:id", authenticateUser, quizCltr.submitQuiz);
app.post("/quiz/attempts", authenticateUser, quizCltr.addQuizAttempt);
app.get('/quiz/:quizId', quizCltr.getById);
app.post("/quiz/:quiId", authenticateUser, quizCltr.addUserQuizHistory);
app.get('/quiz-history', authenticateUser, quizCltr.UserQuizHistory);
app.get('/quiz', authenticateUser, quizCltr.getAll);

app.post('/redemptions/create',authenticateUser, redemptionCltr.create);
app.get('/list', authenticateUser,authorizeUser (['company',"user","admin"]),redemptionCltr.list);
app.post('/redeem',authenticateUser, redemptionCltr.redeem);
app.put('/check-expired', redemptionCltr.checkExpired);

app.post('/subscriptions',authenticateUser, subscriptionCtrl.createSubscription);
app.get('/subscriptions', authenticateUser, subscriptionCtrl.listSubscriptions);
app.post('/verify-payment', authenticateUser, subscriptionCtrl.verifyPayment);


app.listen(port,()=>{
    console.log(`server is running on port ,${port}`)
})
