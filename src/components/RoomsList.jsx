import React, { useState, useEffect } from 'react';
import {
  fetchUserAccessibleRooms,
  deleteRoom,
  joinRoom,
  supabase,
} from '../supabaseClient';
import { getRoomId } from '../helpers/roomHelpers';

function RoomsList({ onRoomSelect, selectedRoom, onRefresh }) {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinRoomPassword, setJoinRoomPassword] = useState('');
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hoveredRoomId, setHoveredRoomId] = useState(null);

  async function loadRooms() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);

    const { data, error } = await fetchUserAccessibleRooms();
    console.log('Initial load - rooms:', data?.length || 0);
    if (error) {
      setHasError(true);
      console.error('Error loading rooms:', error);
    } else {
      setRooms(data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (typeof onRefresh === 'function') {
      onRefresh(loadRooms);
    }
  }, []);

  async function handleDeleteRoom(roomId, roomName) {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${roomName}"?`
    );

    if (!isConfirmed) return;

    setDeletingRoomId(roomId);

    try {
      const { error } = await deleteRoom(roomId);

      if (error) {
        alert(`Error deleting room: ${error.message}`);
      } else {
        setRooms(rooms.filter((room) => getRoomId(room) !== roomId));

        if (selectedRoom && getRoomId(selectedRoom) === roomId) {
          onRoomSelect(null);
        }
      }
    } catch (err) {
      alert('Failed to delete room. Please try again.');
    } finally {
      setDeletingRoomId(null);
      setDeletingRoomId(null);
    }
  }

  function handleRoomClick(room) {
    onRoomSelect(room);
  }

  function isRoomCreatedByUser(room) {
    return room.created_by === currentUserId;
  }

  async function handleJoinRoom() {
    if (!joinRoomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    setJoiningRoom(true);
    setJoinError('');

    try {
      const { data: room, error: roomError } = await supabase
        .from('Rooms')
        .select('*')
        .eq('room_code', joinRoomCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (roomError || !room) {
        setJoinError('Room not found');
        return;
      }

      const { error: joinError } = await joinRoom(
        room.id,
        joinRoomPassword || null
      );

      if (joinError) {
        setJoinError(joinError.message);
        return;
      }

      const { data: newRooms, error: fetchError } =
        await fetchUserAccessibleRooms();
      console.log('After joining - new rooms:', newRooms?.length || 0);
      console.log('Fetch error:', fetchError);
      if (!fetchError) {
        setRooms(newRooms);
        console.log('Rooms state updated');
      }

      setShowJoinModal(false);
      setJoinRoomCode('');
      setJoinRoomPassword('');
      setJoinError('');
    } catch (err) {
      setJoinError('Failed to join room. Please try again.');
    } finally {
      setJoiningRoom(false);
    }
  }

  if (isLoading) {
    return (
      <div className="w-80 bg-gray-800 text-white border-r border-gray-700 p-4 overflow-y-auto">
        <div className="text-center text-gray-400">Loading rooms...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-80 bg-gray-800 text-white border-r border-gray-700 p-4 overflow-y-auto">
        <div className="text-red-400">Error: Error loading rooms.</div>
      </div>
    );
  }

  return (
    <div className={`lg:w-80 w-full h-screen bg-gray-800 text-white p-4 overflow-y-auto ${selectedRoom ? "hidden lg:block" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Rooms</h2>
        <button
          onClick={() => setShowJoinModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Join Room
        </button>
      </div>
      {rooms.length === 0 ? (
        <div className="text-gray-400 text-center">No rooms available</div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={getRoomId(room)}
              className={`relative group ${
                selectedRoom && getRoomId(selectedRoom) === getRoomId(room)
                  ? 'bg-blue-600 text-white'
                  : isRoomCreatedByUser(room)
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-500 text-white'
              } rounded-lg transition-colors`}
              onMouseEnter={() => setHoveredRoomId(getRoomId(room))}
              onMouseLeave={() => setHoveredRoomId(null)}
            >
              <button
                className="w-full text-left p-3 rounded-lg"
                onClick={() => handleRoomClick(room)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{room.name}</span>
                  {isRoomCreatedByUser(room) && (
                    <span className="text-yellow-400 text-xs">👑</span>
                  )}
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Code: {room.room_code}
                  {room.password && (
                    <span className="ml-2 text-yellow-400">🔒 Private</span>
                  )}
                </div>
              </button>

              {isRoomCreatedByUser(room) && (
                <button
                  className={`absolute top-2 right-2 p-1 rounded-full transition-opacity ${
                    deletingRoomId === getRoomId(room)
                      ? 'bg-red-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoom(getRoomId(room), room.name);
                  }}
                  disabled={deletingRoomId === getRoomId(room)}
                  title="Delete room"
                >
                  {deletingRoomId === getRoomId(room) ? (
                    <span className="text-xs">⏳</span>
                  ) : (
                    <span className="text-xs">🗑️</span>
                  )}
                </button>
              )}

              {hoveredRoomId === getRoomId(room) && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1 rounded bg-gray-600 text-white shadow-lg z-10">
                  {isRoomCreatedByUser(room)
                    ? 'You created the room'
                    : 'You joined this room'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Join a Room</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinRoomCode('');
                  setJoinRoomPassword('');
                  setJoinError('');
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) =>
                    setJoinRoomCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter room code"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password (if private)
                </label>
                <input
                  type="password"
                  value={joinRoomPassword}
                  onChange={(e) => setJoinRoomPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {joinError && (
                <div className="text-red-400 text-sm">{joinError}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleJoinRoom}
                  disabled={joiningRoom}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  {joiningRoom ? 'Joining...' : 'Join Room'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinRoomCode('');
                    setJoinRoomPassword('');
                    setJoinError('');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsList;
