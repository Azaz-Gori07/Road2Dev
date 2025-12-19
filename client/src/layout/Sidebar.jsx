import React from 'react'
import './Sidebar.css'
import { NavLink } from 'react-router-dom'
import {
    Home,
    BookOpen,
    Mic,
    BarChart3,
    User,
    Info,
    LogOut,
} from "lucide-react";
import { 
    BiFoodMenu,
 } from "react-icons/bi";
import { useState } from 'react'

function Sidebar() {
    const [activeLink, setActiveLink] = useState('home');
    const [close, setClose] = useState(false);


    return (
        <section id={close ? "sidebar-close" : "sidebar-open"} className="sidebar">
            <div className="section">
                <div className={"logodiv"}>
                    <h2 className={close ? "logo-close" : "logo"}><img src="logo.png" alt="Logo" className='logoImg'/> Road<b>2</b>Dev</h2>
                    <BiFoodMenu className="menubtn"onClick={() => setClose(!close)}/>
                </div>
                <ul className="sidebar-links">
                    <li onClick={() => setActiveLink("home")} className={activeLink === 'home' ? 'isActive' : 'sidebar-link'}><Home size={20} /> Home</li>
                    <li onClick={() => setActiveLink("learning")} className={activeLink === 'learning' ? 'isActive' : 'sidebar-link'}><BookOpen size={20} /> Learning</li>
                    <li onClick={() => setActiveLink("interview")} className={activeLink === 'interview' ? 'isActive' : 'sidebar-link'}><Mic size={20} /> Interview Prep</li>
                    <li onClick={() => setActiveLink("score")} className={activeLink === 'score' ? 'isActive' : 'sidebar-link'}><BarChart3 size={20} /> My Score</li>
                    <li onClick={() => setActiveLink("profile")} className={activeLink === 'profile' ? 'isActive' : 'sidebar-link'}><User size={20} /> Profile</li>
                    <li onClick={() => setActiveLink("about")} className={activeLink === 'about' ? 'isActive' : 'sidebar-link'}><Info size={20} /> About</li>
                </ul>
            </div>

            <div className="logoutdiv">
                <button className="logoutbtn"><LogOut size={22} /> Log Out</button>
            </div>
        </section>
    )
}

export default Sidebar
