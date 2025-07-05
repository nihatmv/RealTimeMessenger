function ChatArea({ selectedRoom }) {
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
        </div>
      </div>

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
    </div>
  );
}

export default ChatArea;
