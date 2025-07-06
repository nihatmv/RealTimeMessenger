import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function isRoomCodeUnique(roomCode) {
  const { data, error } = await supabase
    .from('Rooms')
    .select('id')
    .eq('room_code', roomCode)
    .single();
  return !data;
}

async function getUniqueRoomCode() {
  let roomCode;
  let isUnique = false;
  while (!isUnique) {
    roomCode = generateRoomCode();
    isUnique = await isRoomCodeUnique(roomCode);
  }
  return roomCode;
}

async function createPublicRoom({ name }) {
  // Get current user from Supabase auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const roomCode = await getUniqueRoomCode();
  const { data, error } = await supabase.from('Rooms').insert([
    {
      name,
      created_by: user.id,
      room_code: roomCode,
      is_active: true,
      password: null,
    },
  ]);
  return { data, error };
}

async function createPrivateRoom({ name, password }) {
  // Get current user from Supabase auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const roomCode = await getUniqueRoomCode();
  const { data, error } = await supabase.from('Rooms').insert([
    {
      name,
      created_by: user.id,
      room_code: roomCode,
      is_active: true,
      password,
    },
  ]);
  return { data, error };
}

async function fetchRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  // Only fetch rooms where is_active is true
  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .eq('is_active', true);

  return { data, error };
}

async function deleteRoom(roomId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('Rooms')
    .delete()
    .eq('id', roomId)
    .eq('created_by', user.id); // Only allow creator to delete

  return { data, error };
}

async function fetchUserRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('Rooms')
    .select(
      `
      *,
      RoomMemberships!inner(user_id)
    `
    )
    .eq('RoomMemberships.user_id', user.id)
    .eq('is_active', true);

  return { data, error };
}

async function fetchAvailableRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  // Get rooms that the user hasn't joined yet
  const { data: userRooms, error: userRoomsError } = await supabase
    .from('UserRooms')
    .select('room_id')
    .eq('user_id', user.id);

  let query = supabase.from('Rooms').select('*').eq('is_active', true);

  if (userRooms && userRooms.length > 0) {
    query = query.not(
      'id',
      'in',
      `(${userRooms.map((r) => r.room_id).join(',')})`
    );
  }

  const { data, error } = await query;

  return { data, error };
}

// async function joinRoom(roomId, password = null) {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     return { data: null, error: { message: 'User not authenticated' } };
//   }

//   // First check if room exists and password is correct
//   const { data: room, error: roomError } = await supabase
//     .from('Rooms')
//     .select('*')
//     .eq('id', roomId)
//     .single();

//   if (roomError || !room) {
//     return { data: null, error: { message: 'Room not found' } };
//   }

//   // Check password for private rooms
//   if (room.password && room.password !== password) {
//     return { data: null, error: { message: 'Incorrect password' } };
//   }

//   // Add user to room
//   const { data, error } = await supabase.from('UserRooms').insert([
//     {
//       user_id: user.id,
//       room_id: roomId,
//     },
//   ]);

//   return { data, error };
// }

export {
  supabase,
  createPublicRoom,
  createPrivateRoom,
  fetchRooms,
  deleteRoom,
  fetchUserRooms,
  fetchAvailableRooms,
};
