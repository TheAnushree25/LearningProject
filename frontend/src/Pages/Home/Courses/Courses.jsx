import React, { useState, useEffect } from 'react';
import '../Landing/Landing.css';
import Footer from '../../Footer/Footer';
import Header from '../Header/Header';
import { useAuth } from '../../../context/AuthContext';
import VideoPlayer from '../../Components/VideoPlayer/VideoPlayer';

function Courses() {
  const { user, isAuthenticated, role } = useAuth();
  const [facList, setFacList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'watch'
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedWatchCourse, setSelectedWatchCourse] = useState(null);

  // Fetch student's enrolled courses if logged in
  useEffect(() => {
    if (isAuthenticated && role === 'student' && user?._id) {
      const fetchEnrolled = async () => {
        try {
          const response = await fetch(`/api/course/student/${user._id}/enrolled`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const resData = await response.json();
            setEnrolledCourses(resData.data || []);
            // Set tab to 'watch' if they have enrolled courses to welcome them!
            if (resData.data && resData.data.length > 0) {
              setActiveTab('watch');
              setSelectedWatchCourse(resData.data[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching enrolled courses:', error);
        }
      };
      fetchEnrolled();
    }
  }, [isAuthenticated, role, user]);

  const teachersList = async (sub) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/course/${sub}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFacList(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Default subject fetch on browse tab mount
  useEffect(() => {
    teachersList("physics");
  }, []);

  const price = {
    math: 700,
    physics: 800,
    computer: 1000,
    chemistry: 600,
    biology: 500,
  };

  const Image = {
    "physics" : "https://cdn-icons-png.flaticon.com/128/3081/3081548.png",
    "chemistry" : "https://cdn-icons-png.flaticon.com/128/3081/3081629.png",
    "biology" : "https://cdn-icons-png.flaticon.com/128/3081/3081559.png",
    "math" : "https://cdn-icons-png.flaticon.com/128/3815/3815461.png",
    "computer" : "https://cdn-icons-png.flaticon.com/128/3067/3067260.png",
  };

  return (
    <>
      <Header />
      <div className="courses min-h-screen bg-[#011627] text-white py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-yellow-400 mb-2">Our E-Learning Courses</h1>
            <p className="text-gray-400">Expand your knowledge with lectures from our expert faculties</p>
            <hr className="underLine mx-auto mt-4 border-yellow-400 w-24 border-t-2" />
          </div>

          {/* Tab Navigation for Enrolled Students */}
          {isAuthenticated && role === 'student' && enrolledCourses.length > 0 && (
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setActiveTab('watch')}
                className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                  activeTab === 'watch'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-[#052336] text-gray-300 hover:bg-[#0c3c59]'
                }`}
              >
                📺 My Lecture Watchroom
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                  activeTab === 'browse'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-[#052336] text-gray-300 hover:bg-[#0c3c59]'
                }`}
              >
                🔍 Browse Catalog
              </button>
            </div>
          )}

          {/* WATCH TAB */}
          {activeTab === 'watch' && isAuthenticated && role === 'student' && (
            <div className="space-y-6">
              {/* Course Selector */}
              <div className="flex items-center gap-3 overflow-x-auto py-2">
                <span className="text-gray-400 text-sm font-semibold whitespace-nowrap">Select Enrolled Course:</span>
                {enrolledCourses.map((course) => (
                  <button
                    key={course._id}
                    onClick={() => setSelectedWatchCourse(course)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap border ${
                      selectedWatchCourse?._id === course._id
                        ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                        : 'bg-[#052336] text-gray-300 border-gray-700 hover:bg-[#0a3047]'
                    }`}
                  >
                    {course.coursename.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Video Player Display */}
              {selectedWatchCourse ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">
                    Watching: <span className="text-yellow-400 font-bold">{selectedWatchCourse.coursename.toUpperCase()}</span>
                  </h3>
                  <VideoPlayer
                    courseId={selectedWatchCourse._id}
                    lectures={selectedWatchCourse.lectures || []}
                  />
                </div>
              ) : (
                <div className="text-center p-12 bg-[#021826] rounded-xl border border-gray-700">
                  <p className="text-gray-400">Please select a course to begin watching.</p>
                </div>
              )}
            </div>
          )}

          {/* BROWSE TAB */}
          {activeTab === 'browse' && (
            <div>
              {/* Subjects Category Cards */}
              <div className="subjects flex flex-wrap justify-center gap-6 mb-12">
                {['physics', 'chemistry', 'biology', 'math', 'computer'].map((sub) => (
                  <div
                    key={sub}
                    className="subject cursor-pointer bg-[#052336] hover:bg-[#0c3c59] p-6 rounded-xl text-center transition-all duration-300 border border-gray-800 hover:border-yellow-400 hover:-translate-y-1 w-40 flex flex-col items-center justify-center"
                    onClick={() => teachersList(sub)}
                  >
                    <img src={Image[sub]} alt={sub} className="w-12 h-12 mb-3 filter invert" />
                    <p className="font-bold text-sm text-yellow-400 capitalize">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Faculty Cards Display */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">Available Faculty</h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-yellow-400 border-gray-600"></div>
                </div>
              ) : facList.length === 0 ? (
                <div className="text-center py-12 bg-[#052336] rounded-xl border border-gray-800">
                  <p className="text-gray-400 text-lg">No classes currently available for this subject.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {facList.map((fac) => (
                    <div key={fac._id} className="bg-[#052336] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all shadow-md">
                      <div className="flex gap-4 items-center mb-4">
                        <img
                          src="https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png"
                          alt="profile_img"
                          className="w-12 h-12 rounded-full border border-gray-600 bg-gray-800"
                        />
                        <div>
                          <p className="font-bold text-lg text-white">
                            {fac.enrolledteacher?.Firstname || 'Instructor'} {fac.enrolledteacher?.Lastname || ''}
                          </p>
                          <h4 className="text-yellow-400 text-xs truncate max-w-[15rem]">
                            {fac.enrolledteacher?.Email || 'No Email'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-300 border-t border-gray-800 pt-3">
                        <p>
                          <span className="font-semibold text-yellow-400">Course:</span> {fac.coursename.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">{fac.description}</p>
                        <p>
                          <span className="font-semibold text-yellow-400">Experience:</span>{' '}
                          {fac.enrolledteacher?.Email === 'urttsg@gmail.com' ? '1 Year' : '2 Years'}
                        </p>
                        <p>
                          <span className="font-semibold text-yellow-400">Monthly Fees:</span> Rs. {price[fac.coursename] || 500}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Courses;