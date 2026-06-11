import React, { useState, useEffect, useRef } from 'react';

function VideoPlayer({ courseId, lectures }) {
  const [selectedLecture, setSelectedLecture] = useState(lectures && lectures.length > 0 ? lectures[0] : null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const videoRef = useRef(null);
  const lastSavedTime = useRef(0);

  // Load progress when selected lecture changes
  useEffect(() => {
    if (!selectedLecture || !courseId) return;

    const fetchProgress = async () => {
      setLoadingProgress(true);
      try {
        const response = await fetch(`/api/progress/${courseId}/${selectedLecture._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const res = await response.json();
          const resumeTime = res.data?.lastWatchedTimestamp || 0;
          
          if (videoRef.current) {
            videoRef.current.currentTime = resumeTime;
            lastSavedTime.current = resumeTime;
          }
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [selectedLecture, courseId]);

  // Handle video time update with a 5-second interval save
  const handleTimeUpdate = async () => {
    if (!videoRef.current || !selectedLecture || !courseId) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    
    // Save every 5 seconds or when video finishes
    const isEnded = videoRef.current.ended;
    const timeDiff = Math.abs(currentTime - lastSavedTime.current);

    if (timeDiff >= 5 || isEnded) {
      lastSavedTime.current = currentTime;
      try {
        await fetch('/api/progress/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            videoId: selectedLecture._id,
            lastWatchedTimestamp: currentTime,
          }),
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  };

  if (!lectures || lectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#021826] rounded-xl border border-gray-700 text-center">
        <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <h3 className="text-xl font-bold text-white mb-2">No Video Lectures Available</h3>
        <p className="text-gray-400 max-w-sm">There are currently no recorded video lectures uploaded for this course. Please check back later or contact your instructor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-[#021826] p-6 rounded-xl border border-gray-700 shadow-2xl text-white">
      {/* Video Player Section */}
      <div className="flex-1 flex flex-col">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 shadow-lg">
          {loadingProgress && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-t-yellow-400 border-gray-600"></div>
                <span className="text-sm text-yellow-400 font-medium">Resuming playback...</span>
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            src={selectedLecture?.videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-yellow-400">{selectedLecture?.title}</h2>
          <p className="text-gray-300 mt-2 text-sm leading-relaxed">{selectedLecture?.description || "No description provided for this lecture."}</p>
        </div>
      </div>

      {/* Lectures List Section */}
      <div className="w-full lg:w-80 flex flex-col bg-[#052336] p-4 rounded-lg border border-gray-800 h-[28rem]">
        <h3 className="text-lg font-bold border-b border-gray-700 pb-3 mb-3 text-yellow-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          Course Lectures
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {lectures.map((lecture, index) => (
            <button
              key={lecture._id}
              onClick={() => setSelectedLecture(lecture)}
              className={`w-full text-left p-3 rounded-md transition-all duration-200 flex items-start gap-3 border ${
                selectedLecture?._id === lecture._id
                  ? 'bg-yellow-400 text-gray-900 border-yellow-400 font-semibold'
                  : 'bg-[#093047] hover:bg-[#0c3c59] border-transparent text-white'
              }`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                selectedLecture?._id === lecture._id ? 'bg-gray-900 text-yellow-400' : 'bg-yellow-400 text-gray-900'
              }`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{lecture.title}</p>
                <p className={`truncate text-xs mt-1 ${selectedLecture?._id === lecture._id ? 'text-gray-800' : 'text-gray-400'}`}>
                  {lecture.description || 'Watch video lecture'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
