import React, { useState } from 'react';
import RoomsList from './RoomsList';
import ChatArea from './ChatArea';

function MainArea({ onRoomsRefresh }) {
  const [selectedRoom, setSelectedRoom] = useState(null);

  function handleRoomSelect(room) {
    setSelectedRoom(room);
  }

  return (
    <div className="flex flex-1">
      <div className="w-80 bg-gray-800 text-white border-r border-gray-700">
        {/* Tab Navigation */}
        {/* Room Lists */}
        <RoomsList
          onRoomSelect={handleRoomSelect}
          selectedRoom={selectedRoom}
          onRefresh={onRoomsRefresh}
        />
      </div>
      <ChatArea selectedRoom={selectedRoom} />
    </div>
  );
}

export default MainArea;
