import React, { useState, useEffect } from 'react';
import { fetchAvailableRooms, deleteRoom } from '../supabaseClient';

function RoomsList({ onRoomSelect, selectedRoom }) {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);

  useEffect(() => {
    async function loadRooms() {
      setIsLoading(true);
      const { data, error } = await fetchAvailableRooms();
      if (error) {
        setHasError(true);
      } else {
        setRooms(data);
      }
      setIsLoading(false);
    }
    loadRooms();
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
        setRooms(rooms.filter((room) => room.id !== roomId));

        if (selectedRoom?.id === roomId) {
          onRoomSelect(null);
        }
      }
    } catch (err) {
      alert('Failed to delete room. Please try again.');
    } finally {
      setDeletingRoomId(null);
    }
  }

  function handleRoomClick(room) {
    onRoomSelect(room);
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
    <div className="w-80 bg-gray-800 text-white border-r border-gray-700 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Rooms</h2>
      {rooms.length === 0 ? (
        <div className="text-gray-400 text-center">No rooms available</div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`relative group ${
                selectedRoom?.id === room.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              } rounded-lg transition-colors`}
            >
              <button
                className="w-full text-left p-3 rounded-lg"
                onClick={() => handleRoomClick(room)}
              >
                <div className="font-medium">{room.name}</div>
                <div className="text-xs text-gray-300 mt-1">
                  Code: {room.room_code}
                  {room.password && (
                    <span className="ml-2 text-yellow-400">🔒 Private</span>
                  )}
                </div>
              </button>

              <button
                className={`absolute top-2 right-2 p-1 rounded-full transition-opacity ${
                  deletingRoomId === room.id
                    ? 'bg-red-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRoom(room.id, room.name);
                }}
                disabled={deletingRoomId === room.id}
                title="Delete room"
              >
                {deletingRoomId === room.id ? (
                  <span className="text-xs">⏳</span>
                ) : (
                  <span className="text-xs">🗑️</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoomsList;
