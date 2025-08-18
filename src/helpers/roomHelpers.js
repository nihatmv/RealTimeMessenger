import { supabase } from '../supabaseClient';

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to get room ID consistently (handles both view and table structures)
function getRoomId(room) {
  return room.room_id || room.id;
}

export { generateRoomCode, getRoomId };
