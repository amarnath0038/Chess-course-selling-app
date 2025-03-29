const { Router } = require("express");
const courseRouter = Router();

const { userModel, courseModel, purchaseModel } = require("../db")
const { userMiddleware } = require("../middlewares/user");


async function purchaseCourse  (req, res) {
  const userId = req.userId;
  const { courseId } = req.body;
  
  if (!courseId) {
    res.status(400).json({ message : "Provide a courseId" });
    return
  }
  
  const existingPurchase = await purchaseModel.findOne({ userId, courseId });
  
  if (existingPurchase) {
    res.status(400).json({ message : "You have already purchased this course" });
    return
  }

  await purchaseModel.create({ userId, courseId });
  res.status(200).json({ message : "Course purchase successful" });
}

async function previewCourses (req,res) {
  const courses = await courseModel.find({});
  res.status(200).json({ courses });
}


// POST route for purchasing a course
courseRouter.post("/purchase", userMiddleware, purchaseCourse);


// Route to preview courses (no auth required)
courseRouter.get("/preview", previewCourses);


module.exports = { courseRouter };