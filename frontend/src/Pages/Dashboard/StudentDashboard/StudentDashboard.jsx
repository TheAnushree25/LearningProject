import React, { useEffect, useState } from 'react'
import teachingImg from '../../Images/Teaching.svg'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import logo from '../../Images/logo.svg'


function StudentDashboard() {
  const { ID } = useParams();
  const navigator = useNavigate();
  const [data, setdata] = useState([]);
  const [error, setError] = useState(null);

  const Handlelogout = async() =>{
    const response = await fetch(`/api/student/logout`, {
      method: 'POST',
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    });
    const data = await response.json();
    if(data.statusCode == 200){
      navigator('/');
    }
  }

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(`/api/Student/StudentDocument/${ID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const user = await response.json();
        setdata(user.data);
      } catch (error) {
        setError(error.message)
      }
    };
    getData();
   },[]);

  return (
    <>
    {/* navbar */}
      <nav className='bg-[#04253A] px-10 py-3 flex justify-between items-center'>
        <NavLink to="/">
        <div className='flex items-center gap-3'>
          <img src={logo}
            className="w-14" alt="" />
          <h1 className='text-2xl text-[#4E84C1] font-bold'>Shiksharthee</h1>
        </div>
        </NavLink>
        <div className='bg-[#0D199D] text-white py-2 px-5 rounded-full'>
          <p onClick={Handlelogout}>logout</p>
        </div>
      </nav>

      <div className='bg-[#008280] flex flex-col md:flex-row justify-between items-center p-6 md:py-10'>
        <div className='text-white font-semibold text-3xl md:text-5xl ml-0 md:ml-72 text-center md:text-left'>
          <h1 className='mb-3 text-[#071645]'>Welcome to <span className='text-white'>Shiksharthee</span></h1>
          <h3 className='text-xl md:text-3xl text-[#071645]'>{data.Firstname} {data.Lastname}</h3>
        </div>
        <div className='hidden md:block m-5 mr-20'>
          <img src={teachingImg} alt="teaching" width={300}/>
        </div>
      </div>

      {/* sidebar */}
      <div className='bg-[#071645] w-full md:w-52 min-h-fit md:min-h-[120vh] md:max-h-[130vh] md:absolute md:top-20 flex flex-row md:flex-col justify-around md:justify-start items-center md:items-stretch py-3 md:py-0 z-10'>
        <div className='hidden md:flex flex-col gap-5 text-xl items-center text-white mt-8 mb-10'>
          <img src="https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png" alt="profile_img" width={50} />
          <p>{data.Firstname} {data.Lastname}</p>
        </div>

        <div className='flex flex-row md:flex-col gap-1 w-full justify-around md:justify-start px-2 md:px-0'>
          <NavLink to = {`/Student/Dashboard/${ID}/Search`} className={({isActive}) => isActive ? "bg-white p-3 flex-1 md:flex-none text-center font-semibold text-[#4E84C1]" : "p-3 flex-1 md:flex-none text-center font-semibold text-[#4E84C1]" }> 
          Teacher
          </NavLink>

          <NavLink to = {`/Student/Dashboard/${ID}/Classes`} className={({isActive}) => isActive ? "bg-white p-3 flex-1 md:flex-none text-center font-semibold text-[#4E84C1]" : "p-3 flex-1 md:flex-none text-center font-semibold text-[#4E84C1]" }> 
          Classes
          </NavLink>

          <NavLink to = {`/Student/Dashboard/${ID}/Courses`} className={({isActive}) => isActive ? "bg-white p-3 flex-1 md:flex-none text-center font-semibold text-[#4E84C1]" : "p-3 flex-1 md:flex-none text-center font-semibold text-[#4E84C1]" }> 
          Courses
          </NavLink>
        </div>

      </div>
    </>
  )
}

export default StudentDashboard 