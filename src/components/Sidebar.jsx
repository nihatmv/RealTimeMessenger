import React, { useState, useRef, useEffect } from 'react';
import {
  createPublicRoom,
  createPrivateRoom,
  fetchOtherRooms,
} from '../supabaseClient';
import { joinRoom, getRoomId } from '../helpers/roomHelpers';

function Sidebar({
  session,
  handleSignOut,
  currentRoom,
  setCurrentRoom,
  refreshRooms,
  selectedRoom,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeout = useRef(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [activeSection, setActiveSection] = useState('public');
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [publicRoomName, setPublicRoomName] = useState('');
  const [privateRoomName, setPrivateRoomName] = useState('');
  const [privateRoomPassword, setPrivateRoomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roomMessage, setRoomMessage] = useState('');
  const [roomError, setRoomError] = useState('');

  const [joinRooms, setJoinRooms] = useState([]);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // selectedRoom is now provided from parent
  const [joinRoomPassword, setJoinRoomPassword] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (showJoinRoomModal) {
      setIsJoinLoading(true);
      setJoinError('');
      fetchOtherRooms().then(({ data, error }) => {
        if (error) setJoinError(error.message || 'Failed to fetch rooms.');
        else setJoinRooms(data || []);
        setIsJoinLoading(false);
      });
    }
  }, [showJoinRoomModal]);

  function handleTabSwitch(section) {
    setActiveSection(section);

    setPublicRoomName('');
    setPrivateRoomName('');
    setPrivateRoomPassword('');
    setShowPassword(false);
  }

  function handleMouseEnter() {
    hoverTimeout.current = setTimeout(() => {
      setShowTooltip(true);
    }, 90);
  }

  function handleMouseLeave() {
    clearTimeout(hoverTimeout.current);
    setShowTooltip(false);
  }

  function togglePasswordVisibility() {
    setShowPassword(!showPassword);
  }

  function handleCreatePublicRoom() {
    setRoomMessage('');
    setRoomError('');
    createPublicRoom({ name: publicRoomName }).then(({ data, error }) => {
      if (error) {
        setRoomError(error.message || 'Failed to create public room.');
      } else {
        setRoomMessage('Public room created successfully!');
        setTimeout(() => setRoomMessage(''), 2000);
        setShowCreateRoomModal(false);
        setPublicRoomName('');

        if (refreshRooms) {
          refreshRooms();
        }
      }
    });
  }

  function handleCreatePrivateRoom() {
    setRoomMessage('');
    setRoomError('');
    createPrivateRoom({
      name: privateRoomName,
      password: privateRoomPassword,
    }).then(({ data, error }) => {
      if (error) {
        console.log('Supabase error:', error);
        setRoomError(error.message || 'Failed to create private room.');
      } else {
        setRoomMessage('Private room created successfully!');
        setShowCreateRoomModal(false);
        setPrivateRoomName('');
        setPrivateRoomPassword('');

        if (refreshRooms) {
          refreshRooms();
        }
      }
    });
  }

  function openModal() {
    setShowCreateRoomModal(true);
    setRoomMessage('');
    setRoomError('');
    setPublicRoomName('');
    setPrivateRoomName('');
    setPrivateRoomPassword('');
  }

  function closeModal() {
    setShowCreateRoomModal(false);
    setRoomMessage('');
    setRoomError('');
    setPublicRoomName('');
    setPrivateRoomName('');
    setPrivateRoomPassword('');
  }

  const handleJoinRoom = async (roomId) => {
    const userId = session.user.id;
    const { data, error } = await joinRoom({ userId, roomId });

    if (error) {
      if (error.code === '23505') {
        setJoinMessage('You are already a member of this room!');
      } else {
        setJoinMessage('Failed to join room.');
      }
      return;
    }

    // After joining, set currentRoom to the room being joined
    const joinedRoom = joinRooms.find((r) => getRoomId(r) === roomId) || null;
    setCurrentRoom(joinedRoom);
    setShowJoinRoomModal(false);
    setJoinMessage('');
  };

  return (
    <div
      className={`w-16 bg-gray-900 text-white flex flex-col items-center py-4 space-y-8 ${selectedRoom ? 'hidden lg:block' : ''}`}
    >
      <div
        className="relative flex flex-col items-center w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mb-2 cursor-pointer">
          <span className="text-sm">
            {session?.user?.email[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        {/* Custom Tooltip */}
        {showTooltip && (
          <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded shadow z-20 min-w-max flex flex-col items-center">
            <div className="mb-2">
              {username || session?.user?.email?.split('@')[0]}
            </div>
            <button
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      {/* Create Room Button */}
      <div className="relative group w-full flex flex-col items-center">
        <button
          className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition"
          onClick={() => setShowCreateRoomModal(true)}
        >
          <span className="text-xl">+</span>
        </button>
        <span className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-90 transition whitespace-nowrap z-10 select-none pointer-events-none shadow">
          Create Room
        </span>
      </div>

      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50 !m-0">
          {/* Larger, softer dark backdrop */}
          <div className="">
            {/* Modal content */}
            <div className="bg-white/90 rounded-lg p-6 w-96 relative">
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors z-20"
                onClick={() => setShowCreateRoomModal(false)}
              >
                ×
              </button>
              {/* Section Tabs */}
              <div className="flex mb-4 relative pr-12">
                <button
                  className={`flex-1 py-2 ${activeSection === 'public' ? 'bg-blue-500' : 'text-gray-500'}`}
                  onClick={() => handleTabSwitch('public')}
                >
                  Public Room
                </button>
                <button
                  className={`flex-1 py-2 ${activeSection === 'private' ? 'bg-green-700' : 'text-gray-500'}`}
                  onClick={() => handleTabSwitch('private')}
                >
                  Private Room
                </button>
              </div>
              {/* Section Content */}
              {activeSection === 'public' ? (
                <div>
                  {/* Public Room Creation Form */}
                  <div className="mb-2">
                    <input
                      className="w-full border p-2 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Room Name"
                      value={publicRoomName}
                      onChange={(e) => setPublicRoomName(e.target.value)}
                      maxLength={30}
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {publicRoomName.length}/30
                    </div>
                  </div>
                  <button
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                    onClick={handleCreatePublicRoom}
                    disabled={!publicRoomName.trim()}
                  >
                    Create Public Room
                  </button>
                </div>
              ) : (
                <div>
                  {/* Private Room Generation Form */}
                  <div className="mb-2">
                    <input
                      className="w-full border p-2 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Room Name"
                      value={privateRoomName}
                      onChange={(e) => setPrivateRoomName(e.target.value)}
                      maxLength={30}
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {privateRoomName.length}/30
                    </div>
                  </div>
                  {/* Password input with visibility toggle */}
                  <div className="relative mb-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full border p-2 pr-10 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Password"
                      value={privateRoomPassword}
                      onChange={(e) => setPrivateRoomPassword(e.target.value)}
                      maxLength={40}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <span className="text-lg">👁️</span>
                      ) : (
                        <span className="text-lg">👁️‍🗨️</span>
                      )}
                    </button>
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {privateRoomPassword.length}/40
                    </div>
                  </div>
                  <button
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                    onClick={handleCreatePrivateRoom}
                    disabled={
                      !privateRoomName.trim() || !privateRoomPassword.trim()
                    }
                  >
                    Generate Private Room
                  </button>
                </div>
              )}
              {roomError && (
                <div className="mb-2 text-red-600 text-sm">{roomError}</div>
              )}
              {roomMessage && (
                <div className="mb-2 text-green-600 text-sm">{roomMessage}</div>
              )}
            </div>
          </div>
        </div>
      )}
      {currentRoom && (
        <div className="w-full flex flex-col items-center mt-4">
          <div className="text-xs text-gray-400">Current Room</div>
          <div className="bg-blue-700 text-white px-3 py-1 rounded mt-1 text-sm font-semibold">
            {currentRoom.name}
            {currentRoom.password && (
              <span className="ml-2 text-gray-300">🔒</span>
            )}
          </div>
          <div className="text-[10px] text-gray-300 mt-1">
            Code: {currentRoom.room_code}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
