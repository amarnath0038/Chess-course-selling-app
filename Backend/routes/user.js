const jwt = require("jsonwebtoken");
const { Router } = require("express");
const userRouter = Router();

const bcrypt = require("bcrypt");
const zod = require("zod");

const { JWT_USER_PASSWORD } = require("../config");

const { userModel, purchaseModel, courseModel } = require("../db");
const { userMiddleware } = require("../middlewares/user");


async function userSignup (req,res) {
  const requiredBody = zod.object({
    name : zod.string().min(1),
    email : zod.string().min(5).email(),
    password : zod.string().min(4).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*?]).*$/, 
    { message: "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character",
   })
  });

  const parseDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parseDataWithSuccess.success) {
    const whatIsWrong = parseDataWithSuccess.error.issues.map(issue => (`${issue.path[0]} is invalid : ${issue.message}`));
    res.status(401).json({message: "Incorrect data format", errors : whatIsWrong});
    return
  }

  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 5);

  try {
    await userModel.create({ name, email, password : hashedPassword });
  } catch(error){
    res.status(401).json({ message : "An account with this email already exists. Try with a different one"});
    return 
  }
  res.json({ message : "You are successfully signed up!" });
}

async function userSignin (req,res) {
  const requiredBody = zod.object({
    email : zod.string().min(5).email(),
    password : zod.string().min(4).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*?]).*$/, 
    { message: "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character",
   })
  });

  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    res.status(401).json({ message : "Invalid credentials" });
    return
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (passwordMatch) {
    const token = jwt.sign({id : user._id}, JWT_USER_PASSWORD);
    res.json({ message : "You are successfully signed in" , token : token});
  } else {
    res.status(401).json({ message : "Invalid credentials" });
  }
}

async function purchasedCourses (req, res) {
  const userId = req.userId;
  const purchases = await purchaseModel.find({ userId });
  if (purchases.length === 0) {
    res.status(404).json({ message : "No purchases found" });
    return
  }

  const purchasedCourseIds = purchases.map(purchase => purchase.courseId);
  const coursesData = await courseModel.find({
    _id : { $in : purchasedCourseIds }
  });

  res.status(200).json({ coursesData });
}


// User route to signup
userRouter.post("/signup", userSignup);


// User route to signin
userRouter.post("/signin", userSignin);


// User route to get their purchased courses and their details
userRouter.get("/purchases", userMiddleware, purchasedCourses);


module.exports = { userRouter };

