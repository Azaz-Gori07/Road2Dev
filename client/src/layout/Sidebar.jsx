import React, { use } from 'react'
import './Sidebar.css'
import { Link, useNavigate } from 'react-router-dom'
import {
    Home,
    BookOpen,
    Mic,
    BarChart3,
    User,
    Info,
    LogOut,
    LogIn,
} from "lucide-react";
import {
    BiFoodMenu,
} from "react-icons/bi";
import { useState } from 'react'
import useZenuxAuth from '../hooks/useZenuxAuth';

function Sidebar() {
    const [activeLink, setActiveLink] = useState('home');
    const [close, setClose] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated, logout } = useZenuxAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/auth', { replace: true });
    };

    const handleProfileClick = () => {
        if (!isAuthenticated) {
            navigate('/auth', { replace: true });
        } else {
            setActiveLink("profile");
            if (window.innerWidth <= 800) setMobileOpen(false);
            navigate('/profile');
        }
    };

    return (
        <section id={
            window.innerWidth <= 800
                ? mobileOpen
                    ? "sidebar-mobile-open"
                    : "sidebar-mobile-close"
                : close
                    ? "sidebar-close"
                    : "sidebar-open"
        }>
            <div className="section">
                <div className={"logodiv"}>
                    <h2 className={close ? "logo-close" : "logo"}><img src="logo.png" alt="Logo" className='logoImg' /> Road<b>2</b>Dev</h2>
                    <span className='menutitle' data-title="open/close"><BiFoodMenu className="menubtn" onClick={() => {
                        if (window.innerWidth <= 800) {
                            setMobileOpen(!mobileOpen);
                        } else {
                            setClose(!close);
                        }
                    }} data-title="open/close" /></span>
                </div>
                <ul className="sidebar-links">
                    <Link to="/"><li onClick={() => {setActiveLink("home"); if (window.innerWidth <= 800) setMobileOpen(false);}} className={activeLink === 'home' ? 'isActive' : 'sidebar-link'} data-title='Home'><Home size={20} /> <span className='link-text'>Home</span></li></Link>
                    <Link to="/learning"><li onClick={() => setActiveLink("learning")} className={activeLink === 'learning' ? 'isActive' : 'sidebar-link'} data-title='Learning'><BookOpen size={20} /> <span className='link-text'>Learning</span></li></Link>
                    <Link to="/interview"><li onClick={() => setActiveLink("interview")} className={activeLink === 'interview' ? 'isActive' : 'sidebar-link'} data-title='Interview Prep'><Mic size={20} /> <span className='link-text'>Interview Prep</span></li></Link>
                    <Link to="/score"><li onClick={() => setActiveLink("score")} className={activeLink === 'score' ? 'isActive' : 'sidebar-link'} data-title='My Score'><BarChart3 size={20} /> <span className='link-text'>My Score</span></li></Link>
                    {isAuthenticated ? (
                        <Link to="/profile"><li onClick={() => { setActiveLink("profile"); if (window.innerWidth <= 800) setMobileOpen(false); }} className={activeLink === 'profile' ? 'isActive' : 'sidebar-link'} data-title='Profile'><User size={20} /> <span className='link-text'>Profile</span></li></Link>
                    ) : (
                        <li onClick={handleProfileClick} className={activeLink === 'profile' ? 'isActive' : 'sidebar-link'} data-title='Profile' style={{ cursor: 'pointer' }}><User size={20} /> <span className='link-text'>Profile</span></li>
                    )}
                    <Link to="/about"><li onClick={() => setActiveLink("about")} className={activeLink === 'about' ? 'isActive' : 'sidebar-link'} data-title='About'><Info size={20} /> <span className='link-text'>About</span></li></Link>
                </ul>
            </div>

            <div className="logoutdiv">
                {isAuthenticated ? (
                    <button className="logoutbtn" data-title='SignOut' onClick={handleLogout}><LogOut size={22} /> <span className='logout-text'>Log Out</span></button>
                ) : (
                    <Link to="/auth" className="logoutbtn" data-title='Login' style={{ textDecoration: 'none' }}><LogIn size={22} /> <span className='logout-text'>Login</span></Link>
                )}
            </div>
        </section>
    )
}

export default Sidebar
