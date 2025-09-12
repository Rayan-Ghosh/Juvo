import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Settings as SettingsIcon, LogOut, Bell, Menu, User, Image as ImageIcon, Info, Calendar as CalendarIcon, View } from 'lucide-react';
import Chat from './components/Chat.jsx';
import Dashboard from './components/Dashboard.jsx';
import Settings from './components/Settings.jsx';
import SignIn from './components/SignIn.jsx';
import SignUp from './components/SignUp.jsx';
import CalendarPage from './components/CalendarPage.jsx';

// --- Imports for all necessary Firebase services ---
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const formatDateToKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Your original sub-components remain unchanged ---
const NotificationPanel = ({ onNotificationClick }) => {
  const notifications = [
    { id: 1, icon: <Info size={18} />, text: 'Your weekly mood summary is ready.', time: '15m ago', targetPage: 'dashboard' },
    { id: 2, icon: <User size={18} />, text: 'Dr. Subhadeep sent you a new resource.', time: '1h ago', targetPage: 'dashboard' },
    { id: 3, icon: <ImageIcon size={18} />, text: 'A new breathing exercise was added.', time: '3h ago', targetPage: 'dashboard' },
  ];
  return (
    <div className="dropdown-panel notification-panel">
      <div className="dropdown-header"><h4>Notifications</h4></div>
      <div className="dropdown-content">
        {notifications.map(notif => (
          <button key={notif.id} className="notification-item" onClick={() => onNotificationClick(notif.targetPage)}>
            <div className="notification-icon">{notif.icon}</div>
            <div className="notification-text"><p>{notif.text}</p><span>{notif.time}</span></div>
          </button>
        ))}
      </div>
    </div>
  );
};

const ProfilePicModal = ({ picUrl, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={picUrl} alt="Profile Avatar Large View" className="modal-image" />
        <button className="modal-close-button" onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};

const ProfileDropdown = ({ onSignOut, onChangeProfilePic, onViewProfilePic }) => {
  const fileInputRef = useRef(null);
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) { onChangeProfilePic(file); }
  };
  const handleChangePicture = () => { fileInputRef.current.click(); };
  return (
    <div className="dropdown-panel profile-dropdown">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/png, image/jpeg" />
        <div className="dropdown-content">
            <button className="profile-menu-item" onClick={onViewProfilePic}><View size={16} /><span>View Profile Pic</span></button>
            <button className="profile-menu-item" onClick={handleChangePicture}><ImageIcon size={16} /><span>Change Profile Picture</span></button>
            <button className="profile-menu-item" onClick={onSignOut}><LogOut size={16} /><span>Log Out</span></button>
        </div>
    </div>
  );
};

const Sidebar = ({ activePage, onNavItemClick, isOpen }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'chat', icon: <MessageSquare size={20} />, label: 'Chat' },
    { id: 'calendar', icon: <CalendarIcon size={20} />, label: 'Calendar' },
    { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
  ];
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        <div className="sidebar-brand"><img src="logo.png" alt="Juvo Logo" className="logo" /><span className="brand-name">Juvo</span></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} onClick={() => onNavItemClick(item.id)} className={`nav-button ${activePage === item.id ? 'active' : ''}`}>
              {item.icon} <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

const Header = ({ toggleSidebar, onSignOut, isNotifOpen, isProfileOpen, onNotifToggle, onProfileToggle, onNotificationClick, profilePic, onChangeProfilePic, hasNewNotifications, onViewProfilePic, userName }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-menu" onClick={toggleSidebar}><Menu size={24} /></button>
        <h1 className="header-title">Welcome back, {userName || 'User'}</h1>
      </div>
      <div className="header-actions">
        <div className="action-item-wrapper">
          <button className="notification-button" onClick={onNotifToggle}>
            <Bell size={22} />
            {hasNewNotifications && <span className="notification-dot"></span>}
          </button>
          {isNotifOpen && <NotificationPanel onNotificationClick={onNotificationClick} />}
        </div>
        <div className="action-item-wrapper">
          <button className="profile-button" onClick={onProfileToggle}>
            <img src={profilePic} alt="User Avatar" className="avatar-image" />
          </button>
          {isProfileOpen && <ProfileDropdown onSignOut={onSignOut} onChangeProfilePic={onChangeProfilePic} onViewProfilePic={onViewProfilePic} />}
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [authMode, setAuthMode] = useState('signin');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [profilePic, setProfilePic] = useState('https://placehold.co/40x40/1f2937/FFFFFF?text=A');
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [moodHistory, setMoodHistory] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setProfilePic(user.photoURL || `https://placehold.co/40x40/1f2937/FFFFFF?text=${user.email[0].toUpperCase()}`);
        const fetchMoodData = async () => {
          const moodsCollectionRef = collection(db, "users", user.uid, "moods");
          const querySnapshot = await getDocs(moodsCollectionRef);
          const moods = {};
          querySnapshot.forEach((doc) => { moods[doc.id] = doc.data(); });
          setMoodHistory(moods);
        };
        fetchMoodData();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => { signOut(auth).catch(error => console.error("Sign out error", error)); };

  const handleMoodSelect = async (selectedMood) => {
    if (!currentUser) return;
    const dateKey = formatDateToKey(new Date());
    const newMoodEntry = { mood: selectedMood.level, label: selectedMood.label };
    const moodDocRef = doc(db, "users", currentUser.uid, "moods", dateKey);
    await setDoc(moodDocRef, newMoodEntry);
    setMoodHistory(prev => ({ ...prev, [dateKey]: newMoodEntry }));
  };

  const handleChangeProfilePic = async (file) => {
    if (!currentUser) return;
    const storageRef = ref(storage, `avatars/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const newPicUrl = await getDownloadURL(storageRef);
    await updateProfile(currentUser, { photoURL: newPicUrl });
    setProfilePic(newPicUrl);
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const handleNavItemClick = (page) => { setActivePage(page); setSidebarOpen(false); };
  const handleNotifToggle = () => { setProfileOpen(false); setNotifOpen(!isNotifOpen); if (hasNewNotifications) setHasNewNotifications(false); };
  const handleProfileToggle = () => { setNotifOpen(false); setProfileOpen(!isProfileOpen); };
  const handleNotificationClick = (page) => { setActivePage(page); setNotifOpen(false); };
  const openProfileModal = () => { setProfileModalOpen(true); setProfileOpen(false); };
  const closeProfileModal = () => setProfileModalOpen(false);

  const getThisWeeksChartData = () => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Adjust to get Sunday as the start of the week
    let weekData = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateKey = formatDateToKey(date);
        const dayName = dayNames[date.getDay()];
        const moodEntry = moodHistory[dateKey];
        weekData.push({
            day: dayName,
            dateKey: dateKey,
            mood: moodEntry ? moodEntry.mood : 0,
            label: moodEntry ? moodEntry.label : 'No Entry'
        });
    }
    return weekData;
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <Dashboard chartData={getThisWeeksChartData()} handleMoodSelect={handleMoodSelect} />;
      case 'chat': 
        return <Chat currentUser={currentUser} />;
      case 'calendar': 
        return <CalendarPage moodHistory={moodHistory} />;
      case 'settings': 
        return <Settings currentUser={currentUser} />;
      default: 
        return <Dashboard chartData={getThisWeeksChartData()} handleMoodSelect={handleMoodSelect} />;
    }
  };

  if (loading) { return <div className="loading-screen">Loading...</div>; }
  if (!currentUser) {
    if (authMode === 'signin') { return <SignIn onSwitchToSignUp={() => setAuthMode('signup')} />; } 
    else { return <SignUp onSwitchToSignIn={() => setAuthMode('signin')} />; }
  }

  return (
    <div className="app-layout">
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      {isProfileModalOpen && <ProfilePicModal picUrl={profilePic} onClose={closeProfileModal} />}
      <Sidebar activePage={activePage} onNavItemClick={handleNavItemClick} isOpen={isSidebarOpen} />
      <div className="main-content-wrapper">
        <Header 
            toggleSidebar={toggleSidebar} 
            onSignOut={handleSignOut} 
            isNotifOpen={isNotifOpen}
            isProfileOpen={isProfileOpen}
            onNotifToggle={handleNotifToggle}
            onProfileToggle={handleProfileToggle}
            onNotificationClick={handleNotificationClick}
            profilePic={profilePic}
            onChangeProfilePic={handleChangeProfilePic}
            hasNewNotifications={hasNewNotifications}
            onViewProfilePic={openProfileModal}
            userName={currentUser.displayName}
        />
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
