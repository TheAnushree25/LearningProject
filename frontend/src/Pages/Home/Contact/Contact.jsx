import React, { useState } from 'react'
import "../Landing/Landing.css";
import Mail from "../../Images/Meet-the-team.svg";
import Header from '../Header/Header';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handlemsg = async (e) => {
    e.preventDefault();
    if (name.trim() === '' || email.trim() === '' || msg.trim() === '') {
      alert("All fields are required!");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("Please enter a valid email address!");
      return;
    }
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message: msg }),
      });

      const resData = await response.json();
      alert(resData.message || "Message sent successfully!");
      if (response.ok) {
        setName('');
        setEmail('');
        setMsg('');
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit. Please check your internet connection.");
    }
  };

  return (
    <>
    <Header/>
    <div className="contact">
        <h4>Contact Us</h4>
        <hr className="underLine"/>
        <div className="content">
          <img src={Mail} width={700} alt="" />
          <form onSubmit={handlemsg} className="form-submit">
            <h4>Send Message</h4>
            <input
              type="text"
              placeholder="Name"
              className="input"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
            <textarea
              placeholder="Message"
              className="textArea"
              name="message"
              value={msg}
              onChange={(e)=>setMsg(e.target.value)}
              required
            />
            <button type="submit" className="w-[19rem] bg-light-blue-800">Send A Message</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Contact