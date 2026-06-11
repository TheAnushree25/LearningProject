import React, { useState } from "react";
import HR from "../Login/Images/HR.svg";
import "./Login.css";
import { NavLink, useNavigate } from "react-router-dom";
import Radiobtn from "../Components/RadioBtn/Radiobtn";
import Header from "../Home/Header/Header";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { setUser } = useAuth();
  // State to hold user input and errors
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [userType, setUserType] = useState('');
  const [err, setErr] = useState('');


  const navigate=useNavigate()

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = {};

    if (!userType) {
      newErrors.general = "Please select whether you are a Student or Teacher";
      setErrors(newErrors);
      return;
    }

    if (!Email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(Email)) {
      newErrors.email = "Invalid email format";
    }

    if (!Password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      // Update the errors state and prevent form submission
      setErrors(newErrors);
      return;
    }

    // Prepare data object to send to the backend
    const data = {
      email: Email,
      password: Password,
    };

    try {
      // Send data to unified backend auth login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responesData = await response.json();
      if (!response.ok) {
        setErr(responesData.message || "Login failed");
        return;
      }

      const user = responesData.data.user;
      const expectedRole = userType === 'teacher' ? 'instructor' : 'student';

      if (user.role !== expectedRole) {
        setErr(`This account is registered as a ${user.role === 'instructor' ? 'teacher' : 'student'}, not a ${userType}.`);
        return;
      }

      setUser(user);
      const userid = user._id;
 
      // Handle response
      console.log("Login successful");
      console.log(user.Isapproved);
      
      if(user.Isapproved === "pending"){
        if(user.Teacherdetails || user.Studentdetails){
          navigate('/pending')
        }else{
          if(userType === 'student'){
            navigate(`/StudentDocument/${userid}`)
          }else if(userType === 'teacher'){
            navigate(`/TeacherDocument/${userid}`)
          }
        }
      }else if(user.Isapproved === "approved"){
        if(userType === 'student'){
          navigate(`/Student/Dashboard/${userid}/Search`)
        }else if(userType === 'teacher'){
          navigate(`/Teacher/Dashboard/${userid}/Home`)
        }
      }else if(user.Isapproved === "reupload"){
        navigate(`/rejected/${userType}/${userid}`)
      }else{
        setErr('You are banned from our platform!');
      }
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <>
    <Header/>
    <section className="main">
      <div className="container">
        {/* <div className="logo">
          <img src="" alt="" />
          <h1 className="head">Logo</h1>
        </div> */}
        {/* headings */}
        <div className="para1">
          <h2> WELCOME BACK!</h2>
        </div>

        <div className="para">
          <h5> Please Log Into Your Account.</h5>
        </div>

        <div className="form">
          <form onSubmit={handleSubmit}>
            <div className="input-1">
              <input
                type="text"
                placeholder="Email Address"
                className="input-0"
                value={Email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>
            <div className="input-2">
              <input
                type="password"
                placeholder="Password"
                className="input-0"
                value={Password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>

            {/* radio buttons */}
            <div className="radio-btn">
              <Radiobtn  userType={userType} setUserType={setUserType}  />
            </div>

            <div className="signup-link">
              <span>Don't have an account? </span>
              <NavLink to="/signup" className="link text-yellow-400 text-semibold text-md ">
                signup
              </NavLink>
            </div>

            <div className="text-yellow-400 text-semibold pt-3 cursor-pointer" onClick={()=>navigate('/forgetpassword')} >
              Forget Password?
            </div>

            {/* btns */}
            <div className="btns">
              <button type="submit" className="btns-1">
                Log In
              </button>
            </div>
            {err != '' && (
              <p className="text-red-400 text-sm">{err}</p>
            )}
            {/* {errors.general && (
              <div className="error-message">{errors.general}</div>
            )} */}
          </form>
        </div>
      </div>

      {/* image */}
      <div className="img-3">
        <img src={HR} width={600} alt="" />
      </div>
    </section>
    </>
  );
 
}
