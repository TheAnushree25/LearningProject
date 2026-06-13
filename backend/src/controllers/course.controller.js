import {course} from "../models/course.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"; 
import {ApiResponse} from "../utils/ApiResponse.js";
import { Teacher } from "../models/teacher.model.js";
import {Sendmail} from "../utils/Nodemailer.js"
import mongoose from "mongoose";

// In-memory mock database of courses
const MOCK_COURSES = [
    {
        _id: "660c6d2d46e01a4e14f8ab55",
        coursename: "physics",
        description: "Master the fundamental concepts of physics, from Classical Mechanics to electromagnetism.",
        isapproved: true,
        enrolledteacher: {
            _id: "660c6d2d46e01a4e14f8ab22",
            Firstname: "Parag",
            Lastname: "Kadyan",
            Email: "teacher@test.com",
            role: "instructor"
        },
        enrolledStudent: ["660c6d2d46e01a4e14f8ab11"],
        schedule: [
            { day: 1, starttime: 600, endtime: 720 }, // Mon 10:00 - 12:00
            { day: 3, starttime: 600, endtime: 720 }  // Wed 10:00 - 12:00
        ],
        liveClasses: [
            {
                title: "Live Q&A Session",
                timing: 600,
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                link: "https://zoom.us/mocklink",
                status: "upcoming"
            }
        ],
        lectures: [
            {
                _id: "660c6d2d46e01a4e14f8ab77",
                title: "Lecture 1: Kinematics & One-Dimensional Motion",
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                description: "An introduction to speed, velocity, acceleration, and reference frames in physics."
            },
            {
                _id: "660c6d2d46e01a4e14f8ab88",
                title: "Lecture 2: Newton's Laws of Motion",
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                description: "Detailed study of Newton's three laws of motion with real-world applications."
            },
            {
                _id: "660c6d2d46e01a4e14f8ab99",
                title: "Lecture 3: Work, Energy & Power",
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                description: "Analyzing kinetic energy, potential energy, work-energy theorem, and conservation of energy."
            }
        ]
    },
    {
        _id: "660c6d2d46e01a4e14f8ab56",
        coursename: "chemistry",
        description: "Explore atomic structures, chemical bonds, thermodynamics, and organic compounds.",
        isapproved: true,
        enrolledteacher: {
            _id: "660c6d2d46e01a4e14f8ab22",
            Firstname: "Parag",
            Lastname: "Kadyan",
            Email: "teacher@test.com",
            role: "instructor"
        },
        enrolledStudent: [],
        schedule: [
            { day: 2, starttime: 600, endtime: 720 }
        ],
        liveClasses: [],
        lectures: []
    }
];

const getCourse = asyncHandler(async(req,res)=>{
    if (!global.isMongoConnected) {
        return res.status(200).json(new ApiResponse(200, MOCK_COURSES, "All courses (Mock Mode)"));
    }

    const courses = await course.find(
      {isapproved:true}
    );

    return res
    .status(200)
    .json(new ApiResponse(200, courses, "All courses"))
})

const getcourseTeacher = asyncHandler(async(req,res)=>{
    const coursename = req.params.coursename;

    if(!coursename){
        throw new ApiError(400, "Choose a course")
    }

    if (!global.isMongoConnected) {
        const matched = MOCK_COURSES.filter(c => c.coursename === coursename);
        return res.status(200).json(new ApiResponse(200, matched, "details fetched (Mock Mode)"));
    }

    const courseTeachers = await course.find({ coursename, isapproved:true }).populate('enrolledteacher');

    if (!courseTeachers || courseTeachers.length === 0) {
        throw new ApiError(400, "No teachers found for the specified course");
    }

    return res
    .status(200)
    .json( new ApiResponse(200, courseTeachers, "details fetched"))
})

const addCourseTeacher = asyncHandler(async(req,res)=>{
    const loggedTeacher = req.teacher
    const teacherParams = req.params.id

    if(!teacherParams){
      throw new ApiError(400,"Invalid user")
    }
 
    if(loggedTeacher._id != teacherParams){
      throw new ApiError(400,"not authorized")
    }

    const{coursename,description, schedule} = req.body

    if(!schedule){
      throw new ApiError(400, "Schedule of the course is required.")
    }

    if ([coursename,description].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    if (!global.isMongoConnected) {
        const newMockCourse = {
            _id: "mock_course_" + Math.random().toString(36).substr(2, 9),
            coursename: coursename.toLowerCase(),
            description,
            isapproved: true, // auto-approve in mock mode
            enrolledteacher: loggedTeacher,
            enrolledStudent: [],
            schedule,
            liveClasses: [],
            lectures: []
        };
        MOCK_COURSES.push(newMockCourse);
        return res.status(200).json(new ApiResponse(200, { newCourse: newMockCourse, loggedTeacher }, "new course created (Mock Mode)"));
    }

    const schedules = await course.aggregate([
      {
        $match:{
          enrolledteacher:loggedTeacher._id
        }
      },
      {
        '$unwind': '$schedule'
      }, {
        '$project': {
          'schedule': 1, 
          '_id': 0
        }
      }
    ])

    let isconflict = false;
    for (let i = 0; i < schedule.length; i++) {
      for (const sch of schedules) {
        if (sch.schedule.day === schedule[i].day) {
          if (
            (schedule[i].starttime >= sch.schedule.starttime && schedule[i].starttime < sch.schedule.endtime) ||
            (schedule[i].endtime > sch.schedule.starttime && schedule[i].endtime <= sch.schedule.endtime) ||
            (schedule[i].starttime <= sch.schedule.starttime && schedule[i].endtime >= sch.schedule.endtime)
          ) {
            isconflict = true;
          }
        }
      }
    }
    
    if(isconflict){
      throw new ApiError(400, "Already enrolled in a course with the same timing.")
    }

    const newCourse = await course.create({
      coursename,
      description,
      schedule,
      enrolledteacher: loggedTeacher._id,
    })

    if(!newCourse){
      throw new ApiError(400, "couldnt create course")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {newCourse, loggedTeacher}, "new course created"))
})

const addCourseStudent = asyncHandler(async(req,res)=>{
  const loggedStudent = req.Student
  const studentParams = req.params.id

  if(!studentParams){
    throw new ApiError(400, "no params found")
  }

  if(loggedStudent._id != studentParams){
    throw new ApiError(400, "not authorized")
  }

  const courseID = req.params.courseID
  
  if(!courseID){
    throw new ApiError(400, "select a course")
  }

  if (!global.isMongoConnected) {
      const matchCourse = MOCK_COURSES.find(c => c._id === courseID);
      if (matchCourse) {
          if (!matchCourse.enrolledStudent.includes(loggedStudent._id)) {
              matchCourse.enrolledStudent.push(loggedStudent._id);
          }
      }
      return res.status(200).json(new ApiResponse(200, { selectedCourse: matchCourse, loggedStudent }, "successfully opted in course (Mock Mode)"));
  }

  const thecourse = await course.findById(courseID)
  const EC = thecourse.schedule

  const schedules = await course.aggregate([
    {
      $match:{
        enrolledStudent:loggedStudent._id
      }
    },
    {
      '$unwind': '$schedule'
    }, {
      '$project': {
        'schedule': 1, 
        '_id': 0
      }
    }
  ])

  let isconflict = false;
  for (let i = 0; i < EC.length; i++) {
    for (const schedule of schedules) {
      if (schedule.schedule.day === EC[i].day) {
        if (
          (EC[i].starttime >= schedule.schedule.starttime && EC[i].starttime < schedule.schedule.endtime) ||
          (EC[i].endtime > schedule.schedule.starttime && EC[i].endtime <= schedule.schedule.endtime) ||
          (EC[i].starttime <= schedule.schedule.starttime && EC[i].endtime >= schedule.schedule.endtime)
        ) {
          isconflict = true;
        }
      }
    }
  }
  
  if(isconflict){
    throw new ApiError(400, "Already enrolled in a course with the same timing.")
  }

  const alreadyEnrolled = await course.findOne({
    _id: courseID,
    enrolledStudent: loggedStudent._id
  });
  if(alreadyEnrolled){
    throw new ApiError(400,"already enrolled in this course")
  }

  const selectedCourse = await course.findByIdAndUpdate(courseID, 
    {
      $push: {
        enrolledStudent:loggedStudent._id
      }
    }, {
      new: true
    })

  if(!selectedCourse){
    throw new ApiError(400, "failed to add student in course schema")
  }

  const teacherID = selectedCourse.enrolledteacher

  const teacher = await Teacher.findByIdAndUpdate(teacherID,
    {
      $push: {
        enrolledStudent:loggedStudent._id
      }
    }, {
      new: true
  })

  await Sendmail(loggedStudent.Email, `Payment Confirmation`, `Payment Successful!`)

  return res
  .status(200)
  .json( new ApiResponse(200, {teacher, selectedCourse, loggedStudent}, "successfully opted in course"))
})

const enrolledcourseSTD = asyncHandler(async(req,res)=>{
  const stdID = req.params.id

  if(!stdID){
    throw new ApiError(400, "authorization failed")
  }

  if(stdID != req.Student._id){
    throw new ApiError(400, "params and logged student id doesnt match")
  }

  if (!global.isMongoConnected) {
      const matched = MOCK_COURSES.filter(c => c.enrolledStudent.includes(stdID));
      return res.status(200).json(new ApiResponse(200, matched, "student and enrolled courses (Mock Mode)"));
  }

  const studentEnrolledCourses = await course.aggregate([
      {
          $match: {
              enrolledStudent: new mongoose.Types.ObjectId(stdID)
          }
      },
      {
          $lookup: {
              from: "users",
              localField: "enrolledteacher",
              foreignField: "_id",
              as: "teacherInfo"
          }
      },
      {
          $unwind: {
              path: "$teacherInfo",
              preserveNullAndEmptyArrays: true
          }
      },
      {
          $project: {
              coursename: 1,
              description: 1,
              schedule: 1,
              lectures: 1,
              isapproved: 1,
              createdAt: 1,
              enrolledteacher: {
                  _id: "$teacherInfo._id",
                  Firstname: "$teacherInfo.firstName",
                  Lastname: "$teacherInfo.lastName",
                  Email: "$teacherInfo.email"
              }
          }
      }
  ]);

  return res
  .status(200)
  .json( new ApiResponse(200, studentEnrolledCourses, "student and enrolled courses"))
})

const enrolledcourseTeacher = asyncHandler(async(req,res)=>{
  const teacherID = req.params.id

  if(!teacherID){
    throw new ApiError(400, "authorization failed")
  }

  if(teacherID != req.teacher._id){
    throw new ApiError(400, "params and logged teacher id doesnt match")
  }

  if (!global.isMongoConnected) {
      const matched = MOCK_COURSES.filter(c => c.enrolledteacher._id === teacherID);
      return res.status(200).json(new ApiResponse(200, matched, "teacher and enrolled course (Mock Mode)"));
  }

  const teacherEnrolled = await course.aggregate([
      {
          $match: {
              enrolledteacher: new mongoose.Types.ObjectId(teacherID)
          }
      },
      {
          $project: {
              coursename: 1,
              description: 1,
              schedule: 1,
              lectures: 1,
              isapproved: 1,
              createdAt: 1,
              enrolledStudentsCount: { $size: { $ifNull: ["$enrolledStudent", []] } }
          }
      }
  ]);

  return res
  .status(200)
  .json( new ApiResponse(200, teacherEnrolled, "teacher and enrolled course"))
})

const addClass = asyncHandler(async(req,res) => {
  const {title, date, timing, link, status } = req.body
  const loggedTeacher = req.teacher

  if(!timing || !date){
    throw new ApiError(400, "All fields are required");
  }

  if ([title, link, status].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const {courseId, teacherId } = req.params

  if (!global.isMongoConnected) {
      const matchCourse = MOCK_COURSES.find(c => c._id === courseId);
      if (matchCourse) {
          matchCourse.liveClasses.push({ title, timing, date: new Date(date), link, status });
      }
      return res.status(200).json(new ApiResponse(200, { enrolledCourse: matchCourse, loggedTeacher }, "class added successfully (Mock Mode)"));
  }

  const dateObject = new Date(date);
  const enrolledTeacher = await course.findOne({
      _id: courseId,
      enrolledteacher: teacherId,
      isapproved:true,
  })

  if(!enrolledTeacher){
     throw new ApiError(400, "not authorized")
  }

  const cst = timing - 60;
  const cet = timing + 60;

  const conflictClass = await course.aggregate([
    {
      '$match': {
        'enrolledteacher': loggedTeacher._id,
      },
    },
    {
      '$unwind': '$liveClasses',
    },
    {
      '$match': {
        'liveClasses.date': dateObject,
        'liveClasses.timing': {
          '$gte': cst,
          '$lte': cet,
        },
      },
    },
    {
      '$project': {
        '_id': 0,
        'courseName': '$courseName',
        'liveClasses': 1,
      },
    },
  ]);

  if(conflictClass.length>0){
    throw new ApiError(400, "You already have another class for similar timing.")
  }

  const enrolledCourse = await course.findOneAndUpdate(
      { _id: courseId }, 
      { $push: { liveClasses: {title, date, timing, link, status } } },
      { new: true }  
  );
  
  if(!enrolledCourse){
     throw new ApiError(400, "error occured while adding the class")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, {enrolledCourse, loggedTeacher}, "class added successfully"))
})

const stdEnrolledCoursesClasses = asyncHandler(async(req,res)=>{
  const Student = req.Student

  if (!global.isMongoConnected) {
      const classes = [
          {
              _id: "classes",
              liveClasses: MOCK_COURSES.filter(c => c.enrolledStudent.includes(Student._id)).flatMap(c => c.liveClasses.map(lc => ({
                  coursename: c.coursename,
                  title: lc.title,
                  timing: lc.timing,
                  link: lc.link,
                  status: lc.status,
                  date: lc.date
              })))
          }
      ];
      return res.status(200).json(new ApiResponse(200, { Student, classes }, "fetched classes successfully (Mock Mode)"));
  }

  const classes = await course.aggregate([
    {
      $match: {
        enrolledStudent: Student._id
      }
    },
    {
      $unwind: "$liveClasses"
    },
    {
      $sort: {
        "liveClasses.date": 1,
        "liveClasses.timing": 1
      }
    },
    {
      $group: {
        _id: "classes",
        liveClasses: { 
          $push: {
            coursename: "$coursename",
            title: "$liveClasses.title",
            timing: "$liveClasses.timing",
            link: "$liveClasses.link",
            status: "$liveClasses.status",
            date: "$liveClasses.date"
          }
        }
      }
    }
  ]);

  return res
  .status(200)
  .json(new ApiResponse(200, {Student, classes}, "fetched classes successfully"))
})

const teacherEnrolledCoursesClasses = asyncHandler(async(req,res)=>{
  const teacher = req.teacher

  if (!global.isMongoConnected) {
      const classes = [
          {
              _id: "classes",
              liveClasses: MOCK_COURSES.filter(c => c.enrolledteacher._id === teacher._id).flatMap(c => c.liveClasses.map(lc => ({
                  coursename: c.coursename,
                  title: lc.title,
                  timing: lc.timing,
                  link: lc.link,
                  status: lc.status,
                  date: lc.date
              })))
          }
      ];
      return res.status(200).json(new ApiResponse(200, { teacher, classes }, "fetched classes successfully (Mock Mode)"));
  }

  const classes = await course.aggregate([
    {
      $match: {
        enrolledteacher: teacher._id
      }
    },
    {
      $unwind: "$liveClasses"
    },
    {
      $sort: {
        "liveClasses.date": 1,
        "liveClasses.timing": 1
      }
    },
    {
      $group: {
        _id: "classes",
        liveClasses: { 
          $push: {
            coursename: "$coursename",
            title: "$liveClasses.title",
            timing: "$liveClasses.timing",
            link: "$liveClasses.link",
            status: "$liveClasses.status",
            date: "$liveClasses.date"
          }
        }
      }
    }
  ]);

  return res
  .status(200)
  .json(new ApiResponse(200, {teacher, classes}, "fetched classes successfully"))
})

const canStudentEnroll = asyncHandler(async(req,res)=>{
  const loggedStudent = req.Student
  const studentParams = req.params.id

  if(!studentParams){
    throw new ApiError(400, "no params found")
  }

  if(loggedStudent._id != studentParams){
    throw new ApiError(400, "not authorized")
  }

  const courseID = req.params.courseID
  
  if(!courseID){
    throw new ApiError(400, "select a course")
  }

  if (!global.isMongoConnected) {
      return res.status(200).json(new ApiResponse(200, {}, "student can enroll (Mock Mode)"));
  }

  const thecourse = await course.findById(courseID)
  const EC = thecourse.schedule

  const schedules = await course.aggregate([
    {
      $match:{
        enrolledStudent:loggedStudent._id
      }
    },
    {
      '$unwind': '$schedule'
    }, {
      '$project': {
        'schedule': 1, 
        '_id': 0
      }
    }
  ])

  let isconflict = false;
  for (let i = 0; i < EC.length; i++) {
    for (const schedule of schedules) {
      if (schedule.schedule.day === EC[i].day) {
        if (
          (EC[i].starttime >= schedule.schedule.starttime && EC[i].starttime < schedule.schedule.endtime) ||
          (EC[i].endtime > schedule.schedule.starttime && EC[i].endtime <= schedule.schedule.endtime) ||
          (EC[i].starttime <= schedule.schedule.starttime && EC[i].endtime >= schedule.schedule.endtime)
        ) {
          isconflict = true;
        }
      }
    }
  }

  if(isconflict){
    throw new ApiError(400, "Already enrolled in a course with the same timing.")
  }

  const alreadyEnrolled = await course.findOne({
    _id: courseID,
    enrolledStudent: loggedStudent._id
  });
  if(alreadyEnrolled){
    throw new ApiError(400,"already enrolled in this course")
  }
  return res.status(200).json(new ApiResponse(200, {}, "student can enroll"))
})

const courseCatalog = asyncHandler(async(req,res)=>{
  if (!global.isMongoConnected) {
      return res.status(200).json(new ApiResponse(200, MOCK_COURSES, "Course catalog retrieved successfully (Mock Mode)"));
  }

  const catalog = await course.aggregate([
      {
          $match: {
              isapproved: true
          }
      },
      {
          $lookup: {
              from: "users",
              localField: "enrolledteacher",
              foreignField: "_id",
              as: "teacherDetails"
          }
      },
      {
          $unwind: {
              path: "$teacherDetails",
              preserveNullAndEmptyArrays: true
          }
      },
      {
          $project: {
              coursename: 1,
              description: 1,
              schedule: 1,
              lectures: 1,
              createdAt: 1,
              enrolledteacher: {
                  _id: "$teacherDetails._id",
                  Firstname: "$teacherDetails.firstName",
                  Lastname: "$teacherDetails.lastName",
                  Email: "$teacherDetails.email",
                  role: "$teacherDetails.role"
              }
          }
      }
  ]);

  return res
  .status(200)
  .json(new ApiResponse(200, catalog, "Course catalog retrieved successfully"));
})

export {getCourse, getcourseTeacher, addCourseTeacher, addCourseStudent, enrolledcourseSTD, enrolledcourseTeacher, addClass, stdEnrolledCoursesClasses, teacherEnrolledCoursesClasses, canStudentEnroll, courseCatalog}
