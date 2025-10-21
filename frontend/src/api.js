// src/api.js
const BASE_URL = import.meta.env.VITE_API_URL;

// STUDENT ROUTES
export const getStudents = async () => {
  const res = await fetch(`${BASE_URL}/student/list`); // replace /list with actual route
  return res.json();
};

export const getStudentProfile = async (id) => {
  const res = await fetch(`${BASE_URL}/student/profile/${id}`); // if route needs id
  return res.json();
};

// TEACHER ROUTES
export const teacherLogin = async (data) => {
  const res = await fetch(`${BASE_URL}/teacher/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

// COURSE ROUTES
export const getCourses = async () => {
  const res = await fetch(`${BASE_URL}/course/list`);
  return res.json();
};

// ADMIN ROUTES
export const adminLogin = async (data) => {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

// PAYMENT ROUTES
export const createPayment = async (data) => {
  const res = await fetch(`${BASE_URL}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};
