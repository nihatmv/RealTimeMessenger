import { useEffect, useState } from 'react';
import { fetchRoomMemberEmails } from '../supabaseClient';
import { getRoomId } from '../helpers/roomHelpers';

function ChatArea({ selectedRoom }) {
  const [roomMembers, setRoomMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (selectedRoom) {
      const roomId = getRoomId(selectedRoom);
      console.log('Selected room object:', selectedRoom);
      console.log('Selected room ID:', roomId);
      fetchRoomMemberEmails(roomId).then(({ data, error }) => {
        console.log('Fetched room members:', data, error);
        // Extract email strings from the objects
        const emailList = data ? data.map((item) => item.email) : [];
        setRoomMembers(emailList);
      });
    }
  }, [selectedRoom]);

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">👋</div>
            <div className="text-lg font-medium">
              Welcome to Real-Time Messenger
            </div>
            <div className="text-sm">
              Select a room from the left to start chatting
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Room Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedRoom.name}
            </h2>
            <div className="text-sm text-gray-500">
              Room Code: {selectedRoom.room_code}
              {selectedRoom.password && (
                <span className="ml-2 text-yellow-600">🔒 Private Room</span>
              )}
            </div>
          </div>
          <button
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => setIsModalOpen(true)}
          >
            Members
          </button>
        </div>
      </div>

      {/* Members */}
      {/* {roomMembers.length > 0 && (
        <div className="bg-white p-4 border-b">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Room Members ({roomMembers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {roomMembers.map((memberEmail, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <span className="mr-1">👤</span>
                {memberEmail}
              </span>
            ))}
          </div>
        </div>
      )} */}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Placeholder for messages */}
        <div className="text-center text-gray-500 mt-8">
          <div className="text-lg mb-2">💬</div>
          <div>No messages yet</div>
          <div className="text-sm">Be the first to send a message!</div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <input
          className="w-full p-2 border rounded"
          placeholder="Type a message..."
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Room Members</h2>
            {roomMembers.length > 0 ? (
              <div className="mb-4">
                <p className="text-gray-600 mb-3">Current members:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {roomMembers.map((memberEmail, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-blue-600 mr-2">👤</span>
                      <span className="text-sm text-gray-800">
                        {memberEmail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 mb-4">No members found</p>
            )}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Room Creator:</span>{' '}
                {selectedRoom.creator_email || 'Unknown'}
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Invite functionality coming soon!
              </p>
            </div>
            <button
              className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatArea;
