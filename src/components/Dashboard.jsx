import React, { useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../style.css';
import Sidebar from './Sidebar';
import MainArea from './MainArea';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [refreshRooms, setRefreshRooms] = useState(null);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomsRefresh = (refreshFunction) => {
    setRefreshRooms(() => refreshFunction);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        session={session}
        handleSignOut={handleSignOut}
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
        refreshRooms={refreshRooms}
      />
      <MainArea onRoomsRefresh={handleRoomsRefresh} />
    </div>
  );
};

export default Dashboard;
