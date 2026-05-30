import React, { useEffect, useState } from 'react'
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
import useZenuxAuth from '../hooks/useZenuxAuth';
import useAuth from '../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

function Sidebar() {
    const [activeLink, setActiveLink] = useState('home');
    const [close, setClose] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [recentSessions, setRecentSessions] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);
    const [recentError, setRecentError] = useState('');
    const zenuxAuth = useZenuxAuth();
    const customAuth = useAuth();
    const isAuthenticated = zenuxAuth.isAuthenticated || customAuth.isAuthenticated;
    const navigate = useNavigate();

    useEffect(() => {
        if (!customAuth.isAuthenticated) return;
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        setRecentLoading(true);
        setRecentError('');

        fetch(`${API_BASE}/interview-sessions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data)) {
                    setRecentSessions(data.data.slice(0, 3));
                } else {
                    setRecentSessions([]);
                    setRecentError(data.message || 'Unable to load recent interviews.');
                }
            })
            .catch(() => {
                setRecentSessions([]);
                setRecentError('Unable to load recent interviews.');
            })
            .finally(() => setRecentLoading(false));
    }, [customAuth.isAuthenticated]);

    const handleLogout = async () => {
        await Promise.all([customAuth.logout?.(), zenuxAuth.logout?.()]);
        sessionStorage.clear();
        navigate('/auth', { replace: true });
    };

    const handleProfileClick = () => {
        if (!isAuthenticated) {
            navigate('/auth', { replace: true, state: { from: '/profile' } });
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
                    <li onClick={() => {
                        if (!isAuthenticated) {
                            navigate('/auth', { replace: true, state: { from: '/score' } });
                        } else {
                            setActiveLink('score');
                            if (window.innerWidth <= 800) setMobileOpen(false);
                            navigate('/score');
                        }
                    }} className={activeLink === 'score' ? 'isActive' : 'sidebar-link'} data-title='My Score' style={{ cursor: 'pointer' }}><BarChart3 size={20} /> <span className='link-text'>My Score</span></li>
                    {isAuthenticated ? (
                        <Link to="/profile"><li onClick={() => { setActiveLink("profile"); if (window.innerWidth <= 800) setMobileOpen(false); }} className={activeLink === 'profile' ? 'isActive' : 'sidebar-link'} data-title='Profile'><User size={20} /> <span className='link-text'>Profile</span></li></Link>
                    ) : (
                        <li onClick={handleProfileClick} className={activeLink === 'profile' ? 'isActive' : 'sidebar-link'} data-title='Profile' style={{ cursor: 'pointer' }}><User size={20} /> <span className='link-text'>Profile</span></li>
                    )}
                    <Link to="/about"><li onClick={() => setActiveLink("about")} className={activeLink === 'about' ? 'isActive' : 'sidebar-link'} data-title='About'><Info size={20} /> <span className='link-text'>About</span></li></Link>
                </ul>

                {customAuth.isAuthenticated && (
                    <div className="recent-sessions">
                        <div className="recent-header">
                            <span>Recent Interviews</span>
                            <button className="recent-view-all" onClick={() => navigate('/interview/history')}>
                                View All
                            </button>
                        </div>

                        <div className="recent-list">
                            {recentLoading && <div className="sidebar-small-text">Loading...</div>}
                            {!recentLoading && recentSessions.length === 0 && (
                                <div className="sidebar-small-text">No recent interviews</div>
                            )}
                            {!recentLoading && recentSessions.map((session) => (
                                <button
                                    key={session._id || session.id}
                                    className="recent-item"
                                    onClick={() => {
                                        setActiveLink('interview');
                                        navigate(`/interview/session/${session._id || session.id}`);
                                        if (window.innerWidth <= 800) setMobileOpen(false);
                                    }}
                                >
                                    <span className="recent-item-title">{session.title || 'Interview Session'}</span>
                                    <span className="recent-item-meta">{session.field || 'Unknown field'} • {session.type || 'N/A'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
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
