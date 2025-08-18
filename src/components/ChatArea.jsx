import { useEffect, useState, useRef } from 'react';
import {
  fetchRoomMemberEmails,
  fetchMessages,
  sendMessage,
  fetchUserProfiles,
  supabase,
} from '../supabaseClient';
import { getRoomId } from '../helpers/roomHelpers';
import { UserAuth } from '../context/AuthContext';

function ChatArea({ selectedRoom, roomId, onRoomSelect }) {
  const [roomMembers, setRoomMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatAreaOpen, setisChatAreaOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [usernames, setUsernames] = useState({});
  const { session } = UserAuth();
  const [userProfiles, setUserProfiles] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const autoScrollEnabled = useRef(true);
  const userProfilesRef = useRef({});
  const inputRef = useRef(null);

  const fetchAndSetMessages = async (currentRoomId) => {
    const { data, error } = await fetchMessages(currentRoomId);
    if (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } else {
      setMessages(data);
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((msg) => msg.user_id))];
        const { data: profiles, error: profilesError } =
          await fetchUserProfiles(userIds);
        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError);
        } else {
          const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
          setUserProfiles(profilesMap);
        }
      }
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      const currentRoomId = getRoomId(selectedRoom);

      fetchRoomMemberEmails(currentRoomId).then(({ data, error }) => {
        const emailList = data ? data.map((item) => item.email) : [];
        setRoomMembers(emailList);
      });
      fetchAndSetMessages(currentRoomId);

      const subscription = supabase
        .channel(`room:${currentRoomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${currentRoomId}`,
          },
          async (payload) => {
            const newMessage = payload.new;
            if (!userProfilesRef.current[newMessage.user_id]) {
              const { data: profiles, error } = await fetchUserProfiles([
                newMessage.user_id,
              ]);
              if (!error && Array.isArray(profiles) && profiles.length > 0) {
                const newProfile = profiles[0];
                setUserProfiles((prev) => ({
                  ...prev,
                  [newProfile.id]: newProfile,
                }));
              } else {
                setUserProfiles((prev) => ({
                  ...prev,
                  [newMessage.user_id]: {
                    id: newMessage.user_id,
                    email: 'Unknown User',
                  },
                }));
              }
            }
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedRoom]);

  // Keep ref in sync without retriggering the subscription effect
  useEffect(() => {
    userProfilesRef.current = userProfiles;
  }, [userProfiles]);

  useEffect(() => {
    if (autoScrollEnabled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const threshold = 12;
      const atBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - threshold;
      autoScrollEnabled.current = atBottom;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !session) return;

    const currentRoomId = getRoomId(selectedRoom);
    const userId = session.user.id;

    const { error } = await sendMessage(currentRoomId, userId, newMessage);
    if (error) return console.error(error);

    setNewMessage('');
    // Only focus if input still exists
    inputRef.current?.focus();
  };

  if (!selectedRoom) {
    return (
      <div className="flex-1 hidden flex-col lg:flex bg-gray-100">
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
    <div
      className={`flex-1 relative flex flex-col bg-gray-200 ${selectedRoom ? 'w-full' : ''}`}
    >
      {/* Room Header */}
      <div className=" sticky left-0 top-0 right-0 bg-white border-b px-3 z-10">
        <div className="flex items-center text-center">
          {/* Left: Back button */}
          <div className="flex-1 flex justify-start">
            <button
              className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              onClick={() => onRoomSelect && onRoomSelect(null)}
            >
              ← Back
            </button>
          </div>

          {/* Center: Room name and code */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 p-0">
              {selectedRoom.name}
            </h2>
            <div className="text-sm text-gray-500">
              Room Code: {selectedRoom.room_code}
              {selectedRoom.password && (
                <span className="ml-2 text-yellow-600">🔒 Private Room</span>
              )}
            </div>
          </div>

          {/* Right: Members button */}
          <div className="flex-1 flex justify-end">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => setIsModalOpen(true)}
            >
              Members
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto"
      >
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const isOwner = session?.user?.id === msg.user_id;
            const showUsername =
              index === 0 || messages[index - 1].user_id !== msg.user_id;

            return (
              <div
                key={msg.id}
                className={`flex ${isOwner ? 'justify-end' : 'justify-start'} mb-1`}
              >
                <div className="flex flex-col">
                  {showUsername && (
                    <div
                      className={`flex items-center ${isOwner ? 'flex-row-reverse' : ''}`}
                    >
                      <span className="font-bold text-gray-800">
                        {userProfiles[msg.user_id]?.email || 'Unknown User'}
                      </span>
                    </div>
                  )}
                  <div
                    className={`mt-1 p-2 rounded-lg max-w-xs ${
                      isOwner ? 'bg-blue-600 text-white' : 'bg-white'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="block text-xs text-gray-500 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-lg mb-2">💬</div>
            <div>No messages yet</div>
            <div className="text-sm">Be the first to send a message!</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky left-0 right-0 bottom-0 p-4 border-t bg-white z-10">
        <form onSubmit={handleSendMessage} className="flex p-0">
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="send"
            inputMode="text"
            className="w-full caret-slate-300 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition disabled:bg-blue-300"
            disabled={!newMessage.trim() || !session}
          >
            Send
          </button>
        </form>
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
