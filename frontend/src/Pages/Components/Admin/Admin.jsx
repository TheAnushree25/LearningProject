import React, { useState, useEffect } from "react";
import { IoIosNotificationsOutline } from "react-icons/io";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import logo from '../../Images/logo.svg'
import Course from "./Course";
import axios from "axios";

const Admin = () => {
  const { data } = useParams();
  const navigator = useNavigate();


  const [StudentData, setStudentData] = useState([]);
  const [TeacherData, setTeacherData] = useState([]);
  const [adminID, setAdminID] = useState(null);
  const [error, setErrors] = useState("");
  const [allmsg, setAllMsg] = useState(null);
  const [open, setOpen] = useState(false);


  useEffect(()=>{
    const getAllMsg = async () => {
      try {
        const response = await fetch(`/api/admin/messages/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        setAllMsg(data.data)

      } catch (err) {
        console.log(err.message);
      }
    };
    getAllMsg();
  },[])

  const Approval = async(ID, type, approve)=>{
    try {
      const data = {
        Isapproved : approve
      }

      const response = await fetch(`/api/admin/${adminID}/approve/${type}/${ID}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

   
      if(type == "student"){
        setStudentData(pre => pre.filter((pre) => pre._id !== ID));

      }else if(type == "teacher"){
        setTeacherData(pre => pre.filter((pre) => pre._id !== ID));

      }

    } catch (error) {
      setErrors(error.message);
    }
  }

  const docDetails = async (type, ID) =>{
    navigator(`/VarifyDoc/${type}/${adminID}/${ID}`);
  }


  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(`/api/admin/${data}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        } else {
          const result = await response.json();
         
          setStudentData(result.data.studentsforApproval);
          setTeacherData(result.data.teachersforApproval);
          setAdminID(result.data.admin._id);
        }
      } catch (err) {
        console.log(err.message);
      }
    };
    getData();
  }, []);



  









  return (
    <div className="h-[100vh]">
      {/* Navbar */}
      <nav className="h-16 sm:h-20 md:h-24 lg:h-24  w-full bg-[#042439] flex justify-between items-center px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <NavLink to='/'>
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="logo"
            className="w-14 sm:h-12 md:h-14 lg:h-16 xl:h-18"
          />
          <h1 className="text-2xl text-[#4E84C1] font-bold">
            Shiksharthee
          </h1>
        </div>
        </NavLink>
        <div className="flex items-center">
          <div className="relative mr-4">
            <IoIosNotificationsOutline className="h-8 w-8 text-white" />
            <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </div>
          <button onClick={() => navigator('/')} className="bg-blue-500 text-white px-4 py-2 rounded-md">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Section */}
      <div className="p-4 sm:p-8 md:p-12 lg:p-10 relative">
        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-2xl border-b-2 font-semibold text-white border-white pb-2">
          All New Request
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 my-6">
          <button onClick={()=> setOpen(prev => !prev)} className="text-white bg-green-800 hover:bg-green-700 py-3 px-6 rounded font-semibold cursor-pointer w-full sm:w-auto text-center">
            Messages
          </button>
          
          <button onClick={()=>navigator(`/admin/course/${data}`)} className="text-white bg-blue-800 hover:bg-blue-700 py-3 px-6 rounded font-semibold cursor-pointer w-full sm:w-auto text-center">
            Course Requests
          </button>
        </div>
        
        {open && (
          <div className="mt-3 w-full max-w-lg bg-gray-700 text-gray-100 p-5 rounded border border-gray-600 shadow-xl mb-6">
            <h3 className="text-lg font-bold border-b border-gray-600 pb-2 mb-4">Feedback Messages</h3>
            {allmsg && allmsg.length > 0 ? allmsg.map((msg,index) => (
              <div key={index} className="bg-gray-600 mb-4 rounded-sm p-3 border border-gray-500">
                <p className="text-gray-300 font-semibold">Name : <span className="text-white font-normal">{msg.name}</span></p>
                <p className="text-gray-300 font-semibold"><span className="text-gray-300">Email : </span><span className="text-blue-300 font-normal">{msg.email}</span></p>
                <p className="text-gray-300 font-semibold"><span className="text-gray-300">Message : </span><span className="text-white font-normal">{msg.message}</span></p>
              </div>
            )) : <p className="text-gray-400">No messages found.</p>}
          </div>
        )}
      </div>
       
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 lg:gap-20 p-4 pb-20">
        <div className="rounded-md w-full max-w-sm bg-gray-800 p-4 border border-gray-700 shadow-md">
          <h4 className="text-white bg-blue-gray-900 p-3 rounded text-center font-bold">Student Request</h4>
          {
            StudentData && StudentData.length > 0 ? StudentData.map((student) => (
              student.Isapproved === "pending" && (
                <div
                  key={student._id}
                  onClick={() => docDetails("student", student._id)}
                  className="flex justify-between items-center mt-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer border border-gray-600 transition"
                >
                  <h1 className="text-lg text-white font-semibold truncate mr-2">
                    {student.Firstname + " " + student.Lastname}
                  </h1>
                  <span className="text-xs bg-yellow-600 text-white px-2.5 py-1 rounded-full font-bold uppercase">{student.Isapproved}</span>
                </div>
              )
            )) : <p className="text-gray-500 text-center py-4">No pending student requests.</p>
          }
        </div>

        <div className="rounded-md w-full max-w-sm bg-gray-800 p-4 border border-gray-700 shadow-md">
          <h4 className="text-white bg-blue-gray-900 p-3 rounded text-center font-bold">Teacher Request</h4>
          {
            TeacherData && TeacherData.length > 0 ? TeacherData.map((teacher) => (
              teacher.Isapproved === "pending" && (
                <div
                  key={teacher._id}
                  onClick={() => docDetails("teacher", teacher._id)}
                  className="flex justify-between items-center mt-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer border border-gray-600 transition"
                >
                  <h1 className="text-lg text-white font-semibold truncate mr-2">
                    {teacher.Firstname + " " + teacher.Lastname}
                  </h1>
                  <span className="text-xs bg-yellow-600 text-white px-2.5 py-1 rounded-full font-bold uppercase">{teacher.Isapproved}</span>
                </div>
              )
            )) : <p className="text-gray-500 text-center py-4">No pending teacher requests.</p>
          }
        </div>
        
        <div className="rounded-md w-full max-w-sm bg-gray-800 p-4 border border-gray-700 shadow-md">
          <h4 className="text-white bg-red-800 p-3 rounded text-center font-bold">Rejected Request</h4>
          {
            (TeacherData && TeacherData.some(t => t.Isapproved === "rejected")) || (StudentData && StudentData.some(s => s.Isapproved === "rejected")) ? (
              <>
                {TeacherData && TeacherData.map((teacher) => (
                  teacher.Isapproved === "rejected" && (
                    <div
                      key={teacher._id}
                      onClick={() => docDetails("teacher", teacher._id)}
                      className="flex justify-between items-center mt-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer border border-gray-600 transition"
                    >
                      <h1 className="text-lg text-white font-semibold truncate mr-2">
                        {teacher.Firstname + " " + teacher.Lastname} (T)
                      </h1>
                      <span className="text-xs text-red-400 italic truncate max-w-[8rem]">{teacher.Remarks}</span>
                    </div>
                  )
                ))}
                {StudentData && StudentData.map((student) => (
                  student.Isapproved === "rejected" && (
                    <div
                      key={student._id}
                      onClick={() => docDetails("student", student._id)}
                      className="flex justify-between items-center mt-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer border border-gray-600 transition"
                    >
                      <h1 className="text-lg text-white font-semibold truncate mr-2">
                        {student.Firstname + " " + student.Lastname} (S)
                      </h1>
                      <span className="text-xs text-red-400 italic truncate max-w-[8rem]">{student.Remarks}</span>
                    </div>
                  )
                ))}
              </>
            ) : <p className="text-gray-500 text-center py-4">No rejected requests.</p>
          }
        </div>
        
      </div>

    </div>
  );
};

export default Admin;