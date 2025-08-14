import React, { useState } from 'react';
import RoomsList from './RoomsList';
import ChatArea from './ChatArea';

function MainArea({ onRoomsRefresh }) {
  const [selectedRoom, setSelectedRoom] = useState(null);

  function handleRoomSelect(room) {
    setSelectedRoom(room);
  }

  return (
    <div className="flex flex-1 ">
      <div className={`lg:w-80 w-full bg-gray-800 text-white border-r border-gray-700 ${selectedRoom ? "hidden lg:block" : ""}`}>
        <RoomsList
          onRoomSelect={handleRoomSelect}
          selectedRoom={selectedRoom}
          onRefresh={onRoomsRefresh}
        />
      </div>
      <div className='flex flex-1'>
        <ChatArea selectedRoom={selectedRoom} />
      </div>
    </div>
  );
}

export default MainArea;
