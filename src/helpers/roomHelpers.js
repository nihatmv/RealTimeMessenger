import { supabase } from '../supabaseClient';

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createPublicRoomPayload(name, createdBy) {
  return {
    name,
    room_code: generateRoomCode(),
    password: null,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
}

function createPrivateRoomPayload(name, password, createdBy) {
  return {
    name,
    room_code: generateRoomCode(),
    password, // hash this before storing!
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
}

export async function joinRoom({ userId, roomId }) {
  return await supabase
    .from('RoomMemberships')
    .insert([{ user_id: userId, room_id: roomId }]);
}

// Helper function to get room ID consistently (handles both view and table structures)
function getRoomId(room) {
  return room.room_id || room.id;
}

export {
  generateRoomCode,
  createPublicRoomPayload,
  createPrivateRoomPayload,
  getRoomId,
};
