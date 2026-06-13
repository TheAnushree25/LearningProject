import './Header.css'
import { NavLink } from 'react-router-dom'
import Logo from '../../Images/logo.svg'

function Header() {
  return (
    <>
    <header className="flex flex-col lg:flex-row items-center justify-between bg-[#042439] w-full fixed z-10 py-4 px-6 lg:px-16 gap-4">
      <NavLink to='/'>
      <div className="logo">
        <img src={Logo} alt="logo" />
        <h1 className='text-2xl text-[#4E84C1] font-bold'>Shiksharthee</h1>
      </div>
      </NavLink>
      <div className="link-nav">
        <ul>
          <li><NavLink to='/' className={({isActive}) => isActive ? "active" : "deactive" }> Home </NavLink></li>
          <li><NavLink to='/courses' className={({isActive}) => isActive ? "active" : "deactive"}> Courses </NavLink></li>
          <li><NavLink to='/about' className={({isActive}) => isActive ? "active" : "deactive"}> About </NavLink></li>
          <li><NavLink to='/contact' className={({isActive}) => isActive ? "active" : "deactive"}> Contact us </NavLink></li>
        </ul>
      </div>
      <div className='flex gap-4'>
        <NavLink to='/login' className={({isActive}) => isActive ? "deactive" : "deactive"}><button>Login</button></NavLink>
        <NavLink to='/signup' className={({isActive}) => isActive ? "deactive" : "deactive"}><button>Signup</button></NavLink>
      </div>
    </header>
    <div className="gapError"></div>
    </>
  )
}

export default Header
