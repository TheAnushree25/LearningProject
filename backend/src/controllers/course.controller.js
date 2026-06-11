import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import { Sendmail } from "../utils/Nodemailer.js"
import { Query, ID } from "node-appwrite";
import { databases, databaseId, coursesColId, usersColId } from "../database/appwrite.js";

// In-memory mock database of courses (fallback)
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
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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

// Helper to deserialize Appwrite flat document fields back to objects/arrays
const mapAppwriteCourse = async (doc) => {
    let schedule = [];
    let liveClasses = [];
    let lectures = [];

    try {
        schedule = doc.schedule ? (typeof doc.schedule === 'string' ? JSON.parse(doc.schedule) : doc.schedule) : [];
    } catch (e) { console.error("Error parsing course schedule:", e); }

    try {
        liveClasses = doc.liveClasses ? (typeof doc.liveClasses === 'string' ? JSON.parse(doc.liveClasses) : doc.liveClasses) : [];
    } catch (e) { console.error("Error parsing course liveClasses:", e); }

    try {
        lectures = doc.lectures ? (typeof doc.lectures === 'string' ? JSON.parse(doc.lectures) : doc.lectures) : [];
    } catch (e) { console.error("Error parsing course lectures:", e); }

    let enrolledteacher = null;
    if (doc.enrolledteacher) {
        if (typeof doc.enrolledteacher === 'string') {
            try {
                const teacherDoc = await databases.getDocument(databaseId, usersColId, doc.enrolledteacher);
                enrolledteacher = {
                    _id: teacherDoc.$id,
                    Firstname: teacherDoc.firstName || teacherDoc.Firstname,
                    Lastname: teacherDoc.lastName || teacherDoc.Lastname,
                    Email: teacherDoc.email || teacherDoc.Email,
                    role: teacherDoc.role
                };
            } catch (err) {
                console.error("Failed to fetch teacher profile for course:", doc.enrolledteacher, err.message);
                enrolledteacher = { _id: doc.enrolledteacher, Firstname: "Instructor", Lastname: "" };
            }
        } else {
            enrolledteacher = doc.enrolledteacher;
        }
    }

    return {
        _id: doc.$id,
        coursename: doc.coursename,
        description: doc.description,
        isapproved: doc.isapproved,
        enrolledteacher,
        enrolledStudent: doc.enrolledStudent || [],
        schedule,
        liveClasses,
        lectures,
        createdAt: doc.$createdAt
    };
};

const getCourse = asyncHandler(async(req,res)=>{
    if (!global.isAppwriteConnected) {
        return res.status(200).json(new ApiResponse(200, MOCK_COURSES, "All courses (Mock Mode)"));
    }

    const list = await databases.listDocuments(databaseId, coursesColId, [
        Query.equal('isapproved', true)
    ]);

    const courses = [];
    for (const doc of list.documents) {
        courses.push(await mapAppwriteCourse(doc));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, courses, "All courses"))
});

const getcourseTeacher = asyncHandler(async(req,res)=>{
    const coursename = req.params.coursename;

    if(!coursename){
        throw new ApiError(400, "Choose a course")
    }

    if (!global.isAppwriteConnected) {
        const matched = MOCK_COURSES.filter(c => c.coursename === coursename);
        return res.status(200).json(new ApiResponse(200, matched, "details fetched (Mock Mode)"));
    }

    const list = await databases.listDocuments(databaseId, coursesColId, [
        Query.equal('coursename', coursename),
        Query.equal('isapproved', true)
    ]);

    const courses = [];
    for (const doc of list.documents) {
        courses.push(await mapAppwriteCourse(doc));
    }

    if (courses.length === 0) {
        throw new ApiError(400, "No teachers found for the specified course");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, courses, "details fetched"))
});

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

    if (!global.isAppwriteConnected) {
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

    // Check teacher conflicts
    const teacherCoursesList = await databases.listDocuments(databaseId, coursesColId, [
        Query.equal('enrolledteacher', loggedTeacher._id)
    ]);

    const teacherSchedules = [];
    for (const doc of teacherCoursesList.documents) {
        const mapped = await mapAppwriteCourse(doc);
        teacherSchedules.push(...mapped.schedule);
    }

    let isconflict = false;
    for (let i = 0; i < schedule.length; i++) {
      for (const sch of teacherSchedules) {
        if (sch.day === schedule[i].day) {
          if (
            (schedule[i].starttime >= sch.starttime && schedule[i].starttime < sch.endtime) ||
            (schedule[i].endtime > sch.starttime && schedule[i].endtime <= sch.endtime) ||
            (schedule[i].starttime <= sch.starttime && schedule[i].endtime >= sch.endtime)
          ) {
            isconflict = true;
          }
        }
      }
    }
    
    if(isconflict){
      throw new ApiError(400, "Already enrolled in a course with the same timing.")
    }

    const newDoc = await databases.createDocument(databaseId, coursesColId, ID.unique(), {
        coursename: coursename.toLowerCase(),
        description,
        schedule: JSON.stringify(schedule),
        enrolledteacher: loggedTeacher._id,
        isapproved: false, // pending admin approval
        enrolledStudent: [],
        liveClasses: JSON.stringify([]),
        lectures: JSON.stringify([])
    });

    const newCourse = await mapAppwriteCourse(newDoc);

    return res
        .status(200)
        .json(new ApiResponse(200, {newCourse, loggedTeacher}, "new course created"))
});

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

  if (!global.isAppwriteConnected) {
      const matchCourse = MOCK_COURSES.find(c => c._id === courseID);
      if (matchCourse) {
          if (!matchCourse.enrolledStudent.includes(loggedStudent._id)) {
              matchCourse.enrolledStudent.push(loggedStudent._id);
          }
      }
      return res.status(200).json(new ApiResponse(200, { selectedCourse: matchCourse, loggedStudent }, "successfully opted in course (Mock Mode)"));
  }

  const courseDoc = await databases.getDocument(databaseId, coursesColId, courseID);
  const thecourse = await mapAppwriteCourse(courseDoc);
  const EC = thecourse.schedule;

  // Fetch student enrolled courses to check conflicts
  const studentCoursesList = await databases.listDocuments(databaseId, coursesColId, [
      Query.contains('enrolledStudent', loggedStudent._id)
  ]);

  const studentSchedules = [];
  for (const doc of studentCoursesList.documents) {
      const mapped = await mapAppwriteCourse(doc);
      studentSchedules.push(...mapped.schedule);
  }

  let isconflict = false;
  for (let i = 0; i < EC.length; i++) {
    for (const schedule of studentSchedules) {
      if (schedule.day === EC[i].day) {
        if (
          (EC[i].starttime >= schedule.starttime && EC[i].starttime < schedule.endtime) ||
          (EC[i].endtime > schedule.starttime && EC[i].endtime <= schedule.endtime) ||
          (EC[i].starttime <= schedule.starttime && EC[i].endtime >= schedule.endtime)
        ) {
          isconflict = true;
        }
      }
    }
  }
  
  if(isconflict){
    throw new ApiError(400, "Already enrolled in a course with the same timing.")
  }

  const alreadyEnrolled = thecourse.enrolledStudent.includes(loggedStudent._id);
  if(alreadyEnrolled){
    throw new ApiError(400,"already enrolled in this course")
  }

  const updatedStudents = [...thecourse.enrolledStudent, loggedStudent._id];
  const updatedCourseDoc = await databases.updateDocument(databaseId, coursesColId, courseID, {
      enrolledStudent: updatedStudents
  });
  const selectedCourse = await mapAppwriteCourse(updatedCourseDoc);

  const teacherID = selectedCourse.enrolledteacher?._id || selectedCourse.enrolledteacher;
  let teacher = null;
  if (teacherID) {
      try {
          const teacherUser = await databases.getDocument(databaseId, usersColId, teacherID);
          let teacherStudents = [];
          try {
              teacherStudents = teacherUser.enrolledStudent ? (typeof teacherUser.enrolledStudent === 'string' ? JSON.parse(teacherUser.enrolledStudent) : teacherUser.enrolledStudent) : [];
          } catch (e) {
              teacherStudents = [];
          }
          if (!teacherStudents.some(s => s.studentId === loggedStudent._id)) {
              teacherStudents.push({ studentId: loggedStudent._id, isNewEnrolled: true });
              teacher = await databases.updateDocument(databaseId, usersColId, teacherID, {
                  enrolledStudent: JSON.stringify(teacherStudents)
              });
          }
      } catch (err) {
          console.error("Failed to add student to teacher document:", err.message);
      }
  }

  await Sendmail(loggedStudent.Email || loggedStudent.email, `Payment Confirmation`, `Payment Successful!`)

  return res
      .status(200)
      .json( new ApiResponse(200, {teacher, selectedCourse, loggedStudent}, "successfully opted in course"))
});

const enrolledcourseSTD = asyncHandler(async(req,res)=>{
  const stdID = req.params.id

  if(!stdID){
    throw new ApiError(400, "authorization failed")
  }

  if(stdID != req.Student._id){
    throw new ApiError(400, "params and logged student id doesnt match")
  }

  if (!global.isAppwriteConnected) {
      const matched = MOCK_COURSES.filter(c => c.enrolledStudent.includes(stdID));
      return res.status(200).json(new ApiResponse(200, matched, "student and enrolled courses (Mock Mode)"));
  }

  const list = await databases.listDocuments(databaseId, coursesColId, [
      Query.contains('enrolledStudent', stdID)
  ]);

  const studentEnrolledCourses = [];
  for (const doc of list.documents) {
      studentEnrolledCourses.push(await mapAppwriteCourse(doc));
  }

  return res
      .status(200)
      .json( new ApiResponse(200, studentEnrolledCourses, "student and enrolled courses"))
});

const enrolledcourseTeacher = asyncHandler(async(req,res)=>{
  const teacherID = req.params.id

  if(!teacherID){
    throw new ApiError(400, "authorization failed")
  }

  if(teacherID != req.teacher._id){
    throw new ApiError(400, "params and logged teacher id doesnt match")
  }

  if (!global.isAppwriteConnected) {
      const matched = MOCK_COURSES.filter(c => c.enrolledteacher._id === teacherID);
      return res.status(200).json(new ApiResponse(200, matched, "teacher and enrolled course (Mock Mode)"));
  }

  const list = await databases.listDocuments(databaseId, coursesColId, [
      Query.equal('enrolledteacher', teacherID)
  ]);

  const teacherEnrolled = [];
  for (const doc of list.documents) {
      const mapped = await mapAppwriteCourse(doc);
      teacherEnrolled.push({
          _id: mapped._id,
          coursename: mapped.coursename,
          description: mapped.description,
          schedule: mapped.schedule,
          lectures: mapped.lectures,
          isapproved: mapped.isapproved,
          createdAt: mapped.createdAt,
          enrolledStudentsCount: mapped.enrolledStudent.length
      });
  }

  return res
      .status(200)
      .json( new ApiResponse(200, teacherEnrolled, "teacher and enrolled course"))
});

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

  if (!global.isAppwriteConnected) {
      const matchCourse = MOCK_COURSES.find(c => c._id === courseId);
      if (matchCourse) {
          matchCourse.liveClasses.push({ title, timing, date: new Date(date).toISOString(), link, status });
      }
      return res.status(200).json(new ApiResponse(200, { enrolledCourse: matchCourse, loggedTeacher }, "class added successfully (Mock Mode)"));
  }

  const courseDoc = await databases.getDocument(databaseId, coursesColId, courseId);
  const thecourse = await mapAppwriteCourse(courseDoc);

  if(thecourse.enrolledteacher?._id !== teacherId) {
      throw new ApiError(400, "not authorized")
  }

  const cst = timing - 60;
  const cet = timing + 60;
  const dateObjectStr = new Date(date).toISOString().split('T')[0];

  // Conflict checking in all classes for the teacher on this date
  const teacherCourses = await databases.listDocuments(databaseId, coursesColId, [
      Query.equal('enrolledteacher', loggedTeacher._id)
  ]);

  let isConflict = false;
  for (const doc of teacherCourses.documents) {
      const mapped = await mapAppwriteCourse(doc);
      for (const lc of mapped.liveClasses) {
          const lcDateStr = new Date(lc.date).toISOString().split('T')[0];
          if (lcDateStr === dateObjectStr && lc.timing >= cst && lc.timing <= cet) {
              isConflict = true;
              break;
          }
      }
      if (isConflict) break;
  }

  if(isConflict){
    throw new ApiError(400, "You already have another class for similar timing.")
  }

  const updatedLiveClasses = [...thecourse.liveClasses, { title, date: new Date(date).toISOString(), timing, link, status }];
  const updatedCourseDoc = await databases.updateDocument(databaseId, coursesColId, courseId, {
      liveClasses: JSON.stringify(updatedLiveClasses)
  });

  const enrolledCourse = await mapAppwriteCourse(updatedCourseDoc);

  return res
      .status(200)
      .json(new ApiResponse(200, {enrolledCourse, loggedTeacher}, "class added successfully"))
});

const stdEnrolledCoursesClasses = asyncHandler(async(req,res)=>{
  const Student = req.Student

  if (!global.isAppwriteConnected) {
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

  const list = await databases.listDocuments(databaseId, coursesColId, [
      Query.contains('enrolledStudent', Student._id)
  ]);

  const liveClasses = [];
  for (const doc of list.documents) {
      const mapped = await mapAppwriteCourse(doc);
      for (const lc of mapped.liveClasses) {
          liveClasses.push({
              coursename: mapped.coursename,
              title: lc.title,
              timing: lc.timing,
              link: lc.link,
              status: lc.status,
              date: lc.date
          });
      }
  }

  // Sort by date and timing
  liveClasses.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.timing - b.timing;
  });

  const classes = [{ _id: "classes", liveClasses }];

  return res
      .status(200)
      .json(new ApiResponse(200, {Student, classes}, "fetched classes successfully"))
});

const teacherEnrolledCoursesClasses = asyncHandler(async(req,res)=>{
  const teacher = req.teacher

  if (!global.isAppwriteConnected) {
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

  const list = await databases.listDocuments(databaseId, coursesColId, [
      Query.equal('enrolledteacher', teacher._id)
  ]);

  const liveClasses = [];
  for (const doc of list.documents) {
      const mapped = await mapAppwriteCourse(doc);
      for (const lc of mapped.liveClasses) {
          liveClasses.push({
              coursename: mapped.coursename,
              title: lc.title,
              timing: lc.timing,
              link: lc.link,
              status: lc.status,
              date: lc.date
          });
      }
  }

  liveClasses.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.timing - b.timing;
  });

  const classes = [{ _id: "classes", liveClasses }];

  return res
      .status(200)
      .json(new ApiResponse(200, {teacher, classes}, "fetched classes successfully"))
});

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

  if (!global.isAppwriteConnected) {
      return res.status(200).json(new ApiResponse(200, {}, "student can enroll (Mock Mode)"));
  }

  const courseDoc = await databases.getDocument(databaseId, coursesColId, courseID);
  const thecourse = await mapAppwriteCourse(courseDoc);
  const EC = thecourse.schedule;

  const studentCoursesList = await databases.listDocuments(databaseId, coursesColId, [
      Query.contains('enrolledStudent', loggedStudent._id)
  ]);

  const studentSchedules = [];
  for (const doc of studentCoursesList.documents) {
      const mapped = await mapAppwriteCourse(doc);
      studentSchedules.push(...mapped.schedule);
  }

  let isconflict = false;
  for (let i = 0; i < EC.length; i++) {
    for (const schedule of studentSchedules) {
      if (schedule.day === EC[i].day) {
        if (
          (EC[i].starttime >= schedule.starttime && EC[i].starttime < schedule.endtime) ||
          (EC[i].endtime > schedule.starttime && EC[i].endtime <= schedule.endtime) ||
          (EC[i].starttime <= schedule.starttime && EC[i].endtime >= schedule.endtime)
        ) {
          isconflict = true;
        }
      }
    }
  }

  if(isconflict){
    throw new ApiError(400, "Already enrolled in a course with the same timing.")
  }

  const alreadyEnrolled = thecourse.enrolledStudent.includes(loggedStudent._id);
  if(alreadyEnrolled){
    throw new ApiError(400,"already enrolled in this course")
  }
  return res.status(200).json(new ApiResponse(200, {}, "student can enroll"))
});

const courseCatalog = asyncHandler(async(req,res)=>{
  if (!global.isAppwriteConnected) {
      return res.status(200).json(new ApiResponse(200, MOCK_COURSES, "Course catalog retrieved successfully (Mock Mode)"));
  }

  const list = await databases.listDocuments(databaseId, coursesColId, [
      Query.equal('isapproved', true)
  ]);

  const catalog = [];
  for (const doc of list.documents) {
      catalog.push(await mapAppwriteCourse(doc));
  }

  return res
      .status(200)
      .json(new ApiResponse(200, catalog, "Course catalog retrieved successfully"));
});

export {getCourse, getcourseTeacher, addCourseTeacher, addCourseStudent, enrolledcourseSTD, enrolledcourseTeacher, addClass, stdEnrolledCoursesClasses, teacherEnrolledCoursesClasses, canStudentEnroll, courseCatalog}
