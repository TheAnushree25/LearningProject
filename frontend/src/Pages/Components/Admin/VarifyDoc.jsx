import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function VarifyDoc() {
    const { type, adminID, ID } = useParams();
    const [data, setData] = useState(null);
    const navigator = useNavigate();
    const [value, setValue] = useState("");

    const handleMessage = (event) => {
        setValue(event.target.value);
    };

    const Approval = async(id, type, approve, email)=>{
        try {
          const data = {
            Isapproved : approve,
            remarks : value,
            email: email,
          }
    
          const response = await fetch(`/api/admin/${adminID}/approve/${type}/${id}`, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
        
          navigator(`/admin/${adminID}`);
    
        } catch (error) {
          console.log(error.message);
        }
      }

    useEffect(() => {
        const getData = async () => {
            try {
                const docData = await fetch(`/api/admin/${adminID}/documents/${type}/${ID}`);
                const response = await docData.json();
                setData(response.data);
                console.log(response.data);
            } catch (err) {
                console.log(err.message);
            }
        };
        getData();
    }, []);

    return (
        <>
            <nav className="h-16 sm:h-20 md:h-24 lg:h-24  w-full bg-[#042439] flex justify-between items-center px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                <div className="flex items-center">
                    <h1 onClick={()=>  navigator(`/admin/${adminID}`)} className="text-lg sm:text-xl md:text-2xl lg:text-3xl  text-blue-700 font-bold font-mono ml-2">
                    ◀ Back
                    </h1>
                </div>
                <div><h2 className='text-2xl text-white font-bold'>Document  Details</h2></div>
                <div className="flex items-center">
                    <button onClick={() => navigator('/')} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                        Logout
                    </button>
                </div>
            </nav>
            {type === "student" && data && data.theStudent && (
                <>
                    <div className='flex flex-wrap gap-4 md:gap-10 text-gray-200 justify-center mt-5 text-base md:text-[1.3rem] px-4'>
                        <p><span className="font-semibold text-[#8DE855]">Full Name:</span> {data.theStudent.Firstname} {data.theStudent.Lastname}</p>
                        <p><span className="font-semibold text-[#8DE855]">Phone No:</span> {data.studentDocs.Phone}</p>
                        <p><span className="font-semibold text-[#8DE855]">Highest Education:</span> {data.studentDocs.Highesteducation}</p>
                        <p><span className="font-semibold text-[#8DE855]">Address:</span> {data.studentDocs.Address}</p>
                    </div>

                    <div className='flex mt-10 justify-center gap-10 md:gap-20 flex-wrap text-gray-200 font-bold px-4'>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.studentDocs.Secondary} alt="Secondary" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>10th Marksheet  <span className='text-[#8DE855]'>: {data.studentDocs.SecondaryMarks}%</span></p>
                        </div>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.studentDocs.Higher} alt="Higher" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>12th Marksheet  <span className='text-[#8DE855]'>: {data.studentDocs.HigherMarks}%</span></p>
                        </div>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.studentDocs.Aadhaar} alt="Aadhar" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>Aadhar Card </p>
                        </div>
                        <div className='flex items-center md:items-end mb-10 flex-col gap-6 w-full max-w-[500px]'>
                            <textarea value={value} onChange={handleMessage} className='w-full max-w-sm h-60 mt-6 text-black p-5 rounded' placeholder='Write reason for rejecting application ...'/>
                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end">
                                <div className="px-5 py-2 cursor-pointer bg-green-600 text-lg font-bold text-white ring-1 ring-inset ring-white rounded-lg hover:scale-95 hover:bg-green-900 transition" onClick={()=>Approval(data.theStudent._id, "student", "approved",data.theStudent.Email)}>
                                Approve !
                                </div>
                                <div className="px-5 py-2 cursor-pointer bg-red-600 text-lg font-bold text-white ring-1 ring-inset ring-white rounded-lg hover:scale-95 hover:bg-red-900 transition" onClick={()=>Approval(data.theStudent._id, "student", "rejected",data.theStudent.Email)}>
                                Reject !
                                </div>
                                <div className="px-5 py-2 cursor-pointer bg-blue-600 text-lg font-bold text-white ring-1 ring-inset ring-white rounded-lg hover:scale-95 hover:bg-blue-900 transition" onClick={()=>Approval(data.theStudent._id, "student", "reupload", data.theStudent.Email)}>
                                Reupload !
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {type === "teacher" && data && data.theTeacher &&  (
                <>
                    <div className='flex flex-wrap gap-4 md:gap-10 text-gray-200 justify-center mt-5 text-base md:text-[1.3rem] px-4'>
                        <p><span className="font-semibold text-[#8DE855]">Full Name:</span> {data.theTeacher.Firstname} {data.theTeacher.Lastname}</p>
                        <p><span className="font-semibold text-[#8DE855]">Phone No:</span> {data.teacherDocs.Phone}</p>
                        <p><span className="font-semibold text-[#8DE855]">Experience:</span> {data.teacherDocs.Experience} years</p>
                        <p><span className="font-semibold text-[#8DE855]">Address:</span> {data.teacherDocs.Address}</p>
                    </div>

                    <div className='flex mt-10 justify-center gap-10 md:gap-20 flex-wrap text-gray-200 font-bold px-4'>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.teacherDocs.Secondary} alt="Secondary" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>10th Marksheet  <span className='text-[#8DE855]'>: {data.teacherDocs.SecondaryMarks}%</span></p>
                        </div>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.teacherDocs.Higher} alt="Higher" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>12th Marksheet  <span className='text-[#8DE855]'>: {data.teacherDocs.HigherMarks}%</span></p>
                        </div>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.teacherDocs.UG} alt="UG" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>U.G. Marksheet  <span className='text-[#8DE855]'>: {data.teacherDocs.UGmarks}</span></p>
                        </div>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.teacherDocs.PG} alt="PG" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>P.G. Marksheet  <span className='text-[#8DE855]'>: {data.teacherDocs.PGmarks}</span></p>
                        </div>
                        <div className='m-2 flex flex-col gap-3 w-full max-w-[500px]'>
                            <img src={data.teacherDocs.Aadhaar} alt="Aadhar" className="w-full h-auto object-contain rounded border border-gray-700"/>
                            <p>Aadhar Card </p>
                        </div>
                        <div className='flex items-center md:items-end mb-10 flex-col gap-6 w-full max-w-[500px]'>
                            <textarea value={value} onChange={handleMessage} className='w-full max-w-sm h-60 mt-6 text-black p-5 rounded' placeholder='Write reason for rejecting application ...'/>

                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end">
                                <div className="px-5 py-2 cursor-pointer bg-green-600 text-lg font-bold text-white ring-1 ring-inset ring-white rounded-lg hover:scale-95 hover:bg-green-900 transition" onClick={()=>Approval(data.theTeacher._id, "teacher", "approved",data.theTeacher.Email)}>
                                Approve !
                                </div>
                                <div className="px-5 py-2 cursor-pointer bg-red-600 text-lg font-bold text-white ring-1 ring-inset ring-white rounded-lg hover:scale-95 hover:bg-red-900 transition" onClick={()=>Approval(data.theTeacher._id, "teacher", "rejected",data.theTeacher.Email)}>
                                Reject !
                                </div>
                                <div className="px-5 py-2 cursor-pointer bg-blue-600 text-lg font-bold text-white ring-1 ring-inset ring-white rounded-lg hover:scale-95 hover:bg-blue-900 transition" onClick={()=>Approval(data.theTeacher._id, "teacher", "reupload", data.theTeacher.Email)}>
                                Reupload !
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default VarifyDoc;
