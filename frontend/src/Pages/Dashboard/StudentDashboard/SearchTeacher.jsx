import React, { useState } from 'react'
import Search from '../../Components/Searchbtn/Search'

function SearchTeacher() {
  const [popup, SetPopup] = useState(false);
  return (
    <div className='ml-0 md:ml-56 p-4 md:p-8 text-white'>
        <Search/>
        {popup && (
          <div className='fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
            <div className='bg-[#5be0de] w-full max-w-2xl px-6 md:px-14 py-6 md:py-10 rounded-sm overflow-y-auto max-h-[90vh] text-black'>
              {/* <div className=' absolute w-9 h-9 bg-white rounded-xl cursor-pointer flex items-center justify-center m-2' onClick={onClose}>✖️</div> */}

              <p className='text-2xl md:text-3xl font-bold'>Student Feedback Form</p>
              <p className=' border-b-2 py-2 text-sm md:text-base'>Please help us improve our courses by filling out this student feedback form. We highly appreciate your involvement. Thank you!</p>

              <div className='flex flex-col gap-3 my-5 pb-5 border-b-2'>
                <label className='font-semibold'>Teacher / Instructor</label>
                <input type="text" className='p-2 rounded border'  placeholder='Teacher / Instructor Name'/>
                <label className='font-semibold'>Course Name</label>
                <input type="text" className='p-2 rounded border'  placeholder='Course Name'/>
                <label className='font-semibold'>What you like about this course?</label>
                <input type="text" className='p-2 rounded border'  placeholder=''/>
              </div>

              <p className='font-bold mb-2'>Please rate each following statement : </p>
              
              <div className='my-3 flex flex-col gap-4'>
                <div className='flex flex-col md:flex-row md:items-center gap-2'>
                  <p className='md:w-1/3 font-medium'>Level of effort invested in course</p>
                  <div className='flex flex-wrap gap-3 items-center'>
                    <span className='flex items-center gap-1'><input name="group" type="radio" id='one'/> <label htmlFor='one'>Very Good</label></span>
                    <span className='flex items-center gap-1'><input name="group" type="radio" id='two'/> <label htmlFor='two'>Good</label></span>
                    <span className='flex items-center gap-1'><input name="group" type="radio" id='three'/> <label htmlFor='three'>Fair</label></span>
                    <span className='flex items-center gap-1'><input name="group" type="radio" id='four'/> <label htmlFor='four'>Poor</label></span>
                    <span className='flex items-center gap-1'><input name="group" type="radio" id='five'/> <label htmlFor='five'>Very Poor</label></span>
                  </div>
                </div>
                <div className='flex flex-col md:flex-row md:items-center gap-2'>
                  <p className='md:w-1/3 font-medium'>Level of knowledge on the Subject</p>
                  <div className='flex flex-wrap gap-3 items-center'>
                    <span className='flex items-center gap-1'><input name="group-0" type="radio" id='onec'/> <label htmlFor='onec'>Very Good</label></span>
                    <span className='flex items-center gap-1'><input name="group-0" type="radio" id='twoc'/> <label htmlFor='twoc'>Good</label></span>
                    <span className='flex items-center gap-1'><input name="group-0" type="radio" id='threec'/> <label htmlFor='threec'>Fair</label></span>
                    <span className='flex items-center gap-1'><input name="group-0" type="radio" id='fourc'/> <label htmlFor='fourc'>Poor</label></span>
                    <span className='flex items-center gap-1'><input name="group-0" type="radio" id='fivec'/> <label htmlFor='fivec'>Very Poor</label></span>
                  </div>
                </div>
                <div className='flex flex-col md:flex-row md:items-center gap-2'>
                  <p className='md:w-1/3 font-medium'>Level of communication</p>
                  <div className='flex flex-wrap gap-3 items-center'>
                    <span className='flex items-center gap-1'><input name="group-1" type="radio" id='oned'/> <label htmlFor='oned'>Very Good</label></span>
                    <span className='flex items-center gap-1'><input name="group-1" type="radio" id='twod'/> <label htmlFor='twod'>Good</label></span>
                    <span className='flex items-center gap-1'><input name="group-1" type="radio" id='threed'/> <label htmlFor='threed'>Fair</label></span>
                    <span className='flex items-center gap-1'><input name="group-1" type="radio" id='fourd'/> <label htmlFor='fourd'>Poor</label></span>
                    <span className='flex items-center gap-1'><input name="group-1" type="radio" id='fived'/> <label htmlFor='fived'>Very Poor</label></span>
                  </div>
                </div>
              </div>

              <div className='py-3'>
                <p className='pb-3 font-semibold'>Would you recommend this course to other students?</p>
                <div className='flex gap-5'>
                  <span className='flex items-center gap-1'><input name="radio-group" type="radio" id='recommend-yes'/> <label htmlFor='recommend-yes'>Yes</label></span>
                  <span className='flex items-center gap-1'><input name="radio-group" type="radio" id='recommend-no'/> <label htmlFor='recommend-no'>No</label></span>
                </div>
              </div>

              <div className='flex justify-center mt-5'>
                <button className='w-[10rem] bg-blue-900 text-white py-2 rounded font-semibold hover:bg-blue-800 transition'>Submit Form</button>
              </div>
              
            </div>
          </div>
        )}
    </div> 
  )
}

export default SearchTeacher