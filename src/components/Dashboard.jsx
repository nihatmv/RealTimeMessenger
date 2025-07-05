import React from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../style.css';
import Sidebar from './Sidebar';
import MainArea from './MainArea';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar session={session} handleSignOut={handleSignOut} />
      <MainArea />
    </div>
  );
};

export default Dashboard;
