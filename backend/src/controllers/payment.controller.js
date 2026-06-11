import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { instance }  from "../app.js"
import crypto from "crypto"
import { ID } from "node-appwrite";
import { databases, databaseId, paymentsColId, usersColId } from "../database/appwrite.js";

const coursePayment = asyncHandler(async(req,res)=>{
    const {fees} = req.body

    if(!fees){
      throw new ApiError(400,"fees is required")
    }

    const options = {
        amount: fees,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
      };
      const order = await instance.orders.create(options)

      return res
      .status(200)
      .json( new ApiResponse(200, order,"order fetched"))
})

const getkey = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,{key:process.env.KEY_ID}, "razor key fetched"))
})

const coursePaymentConfirmation = asyncHandler(async(req,res)=>{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const studentID = req.Student._id
  const courseID = req.params.courseID

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.KEY_SECRET || "placeholder_key_secret")
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    let orderDetails;
    if (global.isAppwriteConnected) {
        orderDetails = await databases.createDocument(databaseId, paymentsColId, ID.unique(), {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          courseID, 
          studentID,
        });
    } else {
        orderDetails = {
          _id: "mock_payment_" + Math.random().toString(36).substr(2, 9),
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          courseID, 
          studentID,
        };
    }

    return res
      .status(200)
      .json(new ApiResponse(200,{orderDetails}, "payment confirmed" ))
  } else {
    throw new ApiError(400, "payment failed")
  }
})

const teacherAmount = asyncHandler(async(req,res)=>{
  const teacher = req.teacher

  if (!global.isAppwriteConnected) {
      // Mock teacher balance update
      const mockTeacher = {
          ...teacher,
          Balance: (teacher.Balance || 0) + 500
      };
      return res.status(200).json(new ApiResponse(200, { newTeacher: mockTeacher }, "balance (Mock Mode)"));
  }

  const teacherUser = await databases.getDocument(databaseId, usersColId, teacher._id);
  
  let teacherStudents = [];
  try {
      teacherStudents = teacherUser.enrolledStudent ? (typeof teacherUser.enrolledStudent === 'string' ? JSON.parse(teacherUser.enrolledStudent) : teacherUser.enrolledStudent) : [];
  } catch (e) {
      teacherStudents = [];
  }

  // Count new enrolled students
  let count = 0;
  teacherStudents.forEach(item => {
      if (item.isNewEnrolled === true) {
          count++;
          item.isNewEnrolled = false; // set to false for future checks
      }
  });

  const currentBalance = teacherUser.Balance || teacherUser.balance || 0;
  const newBalance = currentBalance + (count * 500);

  const newTeacher = await databases.updateDocument(databaseId, usersColId, teacher._id, {
      Balance: newBalance,
      enrolledStudent: JSON.stringify(teacherStudents)
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {newTeacher}, "balance"))
})

const withdrawAmount = asyncHandler(async(req,res)=>{
  const teacherId = req.teacher._id
  const amount = req.body.amount

  if (!global.isAppwriteConnected) {
      // Mock withdrawal
      const mockTeacher = {
          ...req.teacher,
          Balance: Math.max(0, (req.teacher.Balance || 1400) - amount)
      };
      return res.status(200).json(new ApiResponse(200, { newTeacher: mockTeacher }, "balance (Mock Mode)"));
  }

  const teacher = await databases.getDocument(databaseId, usersColId, teacherId);

  const currentBalance = teacher.Balance || teacher.balance || 0;

  if (currentBalance < amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  let withdrawalHistory = [];
  try {
      withdrawalHistory = teacher.WithdrawalHistory ? (typeof teacher.WithdrawalHistory === 'string' ? JSON.parse(teacher.WithdrawalHistory) : teacher.WithdrawalHistory) : [];
  } catch (e) {
      withdrawalHistory = [];
  }

  withdrawalHistory.push({ amount, date: new Date().toISOString() });

  const newTeacher = await databases.updateDocument(databaseId, usersColId, teacherId, {
      Balance: currentBalance - amount,
      WithdrawalHistory: JSON.stringify(withdrawalHistory)
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {newTeacher}, "balance"))
})

export {coursePayment, getkey, coursePaymentConfirmation, teacherAmount, withdrawAmount}