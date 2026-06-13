import React,{ useEffect, useState } from 'react'
import Camera from '../Images/Camera.png'
import Clock from '../Images/Clock.png'
import { NavLink, useParams } from 'react-router-dom'

function StudentClasses() {
    const { ID } = useParams();
    const [data, setdata] = useState([]);

    useEffect(() => {
        const getData = async () => {
          try {
            const response = await fetch(`/api/course/classes/student/${ID}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
    
            if (!response.ok) {
              throw new Error('Failed to fetch data');
            }
    
            const user = await response.json();
            setdata(user.data.classes[0].liveClasses);
            console.log(user.data.classes[0].liveClasses);

          } catch (error) {
            setError(error.message)
          }
        };
        getData();
    },[ID]);

  return (
    <div className='ml-0 md:ml-60 mt-8 md:mt-20 text-white flex flex-col lg:flex-row justify-between mr-0 md:mr-20 lg:mr-60 px-4 md:px-10 gap-10'>
        <div className='w-full max-w-[30rem] flex flex-col'>
          <h1 className='text-[#1671D8] text-2xl mt-4 mb-4 font-semibold'>Weekly Schedule</h1>

          <div className='h-[17rem] w-full overflow-auto '>
          {data.filter(clas => {
            const classDate = new Date(clas.date.slice(0, 10));
            const today = new Date();
            const oneWeekFromNow = new Date(today);
            oneWeekFromNow.setDate(today.getDate() + 7);

            return classDate >= today && classDate <= oneWeekFromNow;
          }).map((clas) => (
          <div key={clas.timing} className='flex items-center mb-5'>
          <img src="https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png" alt="profile_img" width={30} />
          <div className='ml-5 mr-10 font-bold flex-1'>
              <p className=' text-lg'>{clas.coursename}
                  <span className='text-black text-sm ml-3 block sm:inline'>
                      {clas.date.slice(0, 10)}  {Math.floor(clas.timing / 60)}:{clas.timing % 60 === 0 ? "00" : clas.timing % 60}
                  </span>
              </p>
              <span className='text-blue-500 text-sm ml-3'>{clas.title.slice(0, 35)} ...</span>
          </div>
          <p className='text-sm bg-[#4E84C1] p-2 rounded-lg'>{clas.status}</p>
      </div>
  ))}

          </div>
        </div>
        
          <NavLink to={data[0]?.link} target='_blank' className='w-full max-w-[24rem] self-center lg:self-start mt-6 lg:mt-14'>
            <div className='bg-white p-5 h-auto min-h-52 cursor-pointer rounded-lg text-black w-full'>
                <div className='flex gap-3 items-center mb-5 mt-2 flex-wrap'>
                    <img src={Clock} alt="clock" width={50} />
                    <span className='text-[#4E84C1] text-xl md:text-2xl font-semibold'>{typeof data[0]?.date === 'string' ? data[0]?.date.slice(0,10) : ''}</span> 
                    <span className='text-[#018280] text-xl md:text-2xl ml-2'>
                        {typeof data[0]?.timing === 'number' ? `${Math.floor(data[0]?.timing / 60)}:${data[0]?.timing % 60 === 0 ?"00":data[0]?.timing % 60}` :''}
                    </span>
                </div>
                <div className='flex gap-6 md:gap-12 items-center justify-between'>
                    <div className='ml-3'>
                        <p className='text-sm text-gray-600 font-medium'>Your next Class</p>
                        <p className='text-[#018280] text-2xl md:text-3xl font-semibold'>{data[0]?.coursename}</p>
                        <p className=' text-light-blue-700 text-sm'>{data[0]?.title.slice(0,25)} ...</p>
                    </div>
                    <img src={Camera} alt="Camera" width={70} className='w-14 md:w-[70px]'/>
                </div>
            </div>
          </NavLink>
    </div>
  )
}

export default StudentClasses