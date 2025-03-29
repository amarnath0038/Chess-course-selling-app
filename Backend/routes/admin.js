const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const zod = require("zod");

const { JWT_ADMIN_PASSWORD } = require("../config");

const { Router } = require("express");
const adminRouter = Router();

const { adminModel, courseModel } = require("../db")
const { adminMiddleware } = require("../middlewares/admin");



async function adminSignup (req,res) {
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
    res.status(400).json({message: "Incorrect data format", errors : whatIsWrong});
    return
  }

  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 5);

  try {
    await adminModel.create({ name, email, password : hashedPassword });
  } catch(error){
    res.status(400).json({ message : "An account with this email already exists. Try with a different one"});
    return 
  }
  res.json({ message : "You are successfully signed up!" });
}

async function adminSignin (req,res) {
  const requiredBody = zod.object({
    email : zod.string().min(5).email(),
    password : zod.string().min(4).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*?]).*$/, 
    { message: "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character",
   })
  });

  const { email, password } = req.body;
  const admin = await adminModel.findOne({ email });
  if (!admin) {
    res.status(400).json({ message : "Invalid credentials" });
    return
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (passwordMatch) {
    const token = jwt.sign({id : admin._id}, JWT_ADMIN_PASSWORD);
    res.json({message : "Your are successfully signed in", token : token});
  } else {
    res.status(400).jaosn({ message : "Invalid credentials" });
  }
}

async function adminCreateCourse (req,res) {
  const adminId = req.adminId;

  const requiredBody = zod.object({
    title : zod.string(),
    description : zod.string(),
    price : zod.number(),
    imageUrl : zod.string().url()
  });
  const parseDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parseDataWithSuccess.success) {
    res.status(401).json({ message : "Incorrect data format", error : parseDataWithSuccess.error });
    return
  }
  const { title, description, price, imageUrl } = req.body;
  const course = await courseModel.create({
    title,
    description,
    price,
    imageUrl,
    creatorId : adminId
  });
  
  res.status(200).json({ message : "Course created", courseId : course._id });
}

async function adminUpdateCourse(req,res) {
  const adminId = req.adminId;

  const requiredBody = zod.object({
    title : zod.string(),
    description : zod.string(),
    price : zod.number(),
    imageUrl : zod.string().url(),
    courseId : zod.string().min(5)
  });
  const parseDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parseDataWithSuccess.success) {
    res.status(401).json({ message : "Incorrect data format", error : parseDataWithSuccess.error });
    return
  }
  const { title, description, price, imageUrl, courseId } = req.body;
  const course = await courseModel.findOne({
    _id : courseId,
    creatorId : adminId
  });
  if (!course) {
    res.status(401).json({ message : "Course not found" });
    return
  }
  
  await courseModel.updateOne(
    { _id : courseId, creatorId : adminId },
    { title : title || course.title,
      description : description || course.description,
      price : price || course.price,
      imageUrl : imageUrl || course.imageUrl});

  res.status(200).json({ message : "Course updated" });
}

async function adminDeleteCourse (req, res) {
  const adminId = req.adminId;
  const requiredBody = zod.object({
    courseId : zod.string().min(5)
  });
  const parseDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parseDataWithSuccess.success) {
    res.status(401).json({ message: "Incorrect data format", error : parseDataWithSuccess.error });
    return
  }

  const { courseId } = req.body;
  const course = await courseModel.findOne({ _id : courseId, creatorId : adminId });
  
  if (!course) {
    res.status(401).json({ message : "Course not found"});
    return
  }

  await courseModel.deleteOne({ _id : courseId, creatorId : adminId });
  res.json({ message : "Course deleted" });
}

async function adminGetCourses (req, res) {
  const adminId = req.adminId;
  const courses = await courseModel.find({ creatorId : adminId }).lean();
  res.status(200).json({ courses });
}


// Admin route to signup
adminRouter.post("/signup", adminSignup);


// Admin route to signin
adminRouter.post("/signin", adminSignin);


// Admin route to create a course
adminRouter.post("/course", adminMiddleware, adminCreateCourse);


// Admin route to update a course
adminRouter.put("/course", adminMiddleware, adminUpdateCourse);


// Admin route to delete a course
adminRouter.delete("/course", adminMiddleware, adminDeleteCourse);


//Admin route to get all courses they created
adminRouter.get("/course/bulk", adminMiddleware, adminGetCourses);


module.exports = { adminRouter };