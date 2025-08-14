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
  const { data: newRooms, error } = await supabase
    .from('Rooms')
    .insert([
      {
        name,
        created_by: user.id,
        room_code: roomCode,
        is_active: true,
        password: null,
      },
    ])
    .select();

  if (error || !newRooms || newRooms.length === 0) {
    console.error('Error creating room:', error);
    return { data: null, error: error || { message: 'Failed to create room' } };
  }

  const newRoom = newRooms[0];

  // Add creator as a member
  const { error: membershipError } = await supabase
    .from('RoomMemberships')
    .insert([{ user_id: user.id, room_id: newRoom.id }]);

  if (membershipError) {
    // If adding member fails, we should ideally delete the room to avoid orphans
    console.error('Failed to add creator to room members:', membershipError);
    await supabase.from('Rooms').delete().eq('id', newRoom.id); // Rollback
    return { data: null, error: membershipError };
  }

  return { data: newRooms, error: null };
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
  const { data: newRooms, error } = await supabase
    .from('Rooms')
    .insert([
      {
        name,
        created_by: user.id,
        room_code: roomCode,
        is_active: true,
        password,
      },
    ])
    .select();

  if (error || !newRooms || newRooms.length === 0) {
    console.error('Error creating room:', error);
    return { data: null, error: error || { message: 'Failed to create room' } };
  }

  const newRoom = newRooms[0];

  // Add creator as a member
  const { error: membershipError } = await supabase
    .from('RoomMemberships')
    .insert([{ user_id: user.id, room_id: newRoom.id }]);

  if (membershipError) {
    // If adding member fails, we should ideally delete the room to avoid orphans
    console.error('Failed to add creator to room members:', membershipError);
    await supabase.from('Rooms').delete().eq('id', newRoom.id); // Rollback
    return { data: null, error: membershipError };
  }

  return { data: newRooms, error: null };
}

async function deleteRoom(roomId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  try {
    const { data: memberships, error: checkError } = await supabase
      .from('RoomMemberships')
      .select('*')
      .eq('room_id', roomId);

    if (checkError) {
      return { data: null, error: checkError };
    }

    if (memberships && memberships.length > 0) {
      const { error: membershipError } = await supabase
        .from('RoomMemberships')
        .delete()
        .eq('room_id', roomId);

      if (membershipError) {
        return { data: null, error: membershipError };
      }
    }

    const { data, error } = await supabase
      .from('Rooms')
      .delete()
      .eq('id', roomId)
      .eq('created_by', user.id);

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Unexpected error occurred' } };
  }
}

async function fetchOtherRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  // Query the 'Rooms' table directly and filter by the creator
  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .neq('created_by', user.id)
    .eq('is_active', true);

  return { data, error };
}

async function joinRoom(roomId, password = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { data: null, error: { message: 'User not authenticated' } };

  // Check if room exists and verify password
  const { data: room, error: roomError } = await supabase
    .from('Rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    return { data: null, error: { message: 'Room not found' } };
  }

  // Check password for private rooms
  if (room.password && room.password !== password) {
    return { data: null, error: { message: 'Incorrect password' } };
  }

  // Check if user is already a member
  const { data: existingMembership } = await supabase
    .from('RoomMemberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('room_id', roomId)
    .single();

  if (existingMembership) {
    return { data: existingMembership, error: { message: 'Already a member' } };
  }

  // Add user to room
  try {
    const { data, error } = await supabase.from('RoomMemberships').insert([
      {
        user_id: user.id,
        room_id: roomId,
        joined_at: new Date().toISOString(),
      },
    ]);

    if (error && error.message.includes('duplicate key value')) {
      return { data: null, error: { message: 'Already a member' } };
    }

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Unexpected error' } };
  }
}

async function fetchUserAccessibleRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  // 1. Fetch rooms the user has created
  const { data: createdRooms, error: createdError } = await supabase
    .from('Rooms')
    .select('*')
    .eq('created_by', user.id)
    .eq('is_active', true);

  // 2. Fetch rooms the user has joined through the RoomMemberships table
  const { data: joinedRooms, error: joinedError } = await supabase
    .from('RoomMemberships')
    .select(
      `
      Rooms ( * ) // Select all columns from the Rooms table
    `
    )
    .eq('user_id', user.id);

  // Extract the actual room data from the nested 'Rooms' object
  const joinedRoomsData =
    joinedRooms?.map((membership) => membership.Rooms) || [];

  // 3. Combine and remove duplicates
  const allRooms = [...(createdRooms || []), ...joinedRoomsData];
  const uniqueRooms = allRooms.filter(
    (room, index, self) => index === self.findIndex((r) => r.id === room.id)
  );

  return { data: uniqueRooms, error: createdError || joinedError };
}

// Fetch room member emails using RPC function
async function fetchRoomMemberEmails(roomId) {
  const { data, error } = await supabase.rpc('get_room_member_emails', {
    room_id_param: roomId,
  });

  if (error) {
    console.error('Error fetching room member emails:', error);
    return { data: null, error };
  }

  return { data: data || [], error: null };
}

async function sendMessage(roomId, userId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ room_id: roomId, user_id: userId, content }]);
  return { data, error };
}

async function fetchMessages(roomId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  return { data, error };
}

const fetchUserProfiles = async (userIds) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);
  return { data, error };
};

export {
  supabase,
  createPublicRoom,
  createPrivateRoom,
  deleteRoom,
  fetchOtherRooms,
  joinRoom,
  fetchUserAccessibleRooms,
  fetchRoomMemberEmails,
  sendMessage,
  fetchUserProfiles,
  fetchMessages,
};
