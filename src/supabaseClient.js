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

async function fetchRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .eq('is_active', true)
    .eq('created_by', user.id);

  return { data, error };
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
  const { data: userMemberships, error: userMembershipsError } = await supabase
    .from('RoomMemberships')
    .select('room_id')
    .eq('user_id', user.id);

  let query = supabase.from('Rooms').select('*').eq('is_active', true);

  if (userMemberships && userMemberships.length > 0) {
    query = query.not(
      'id',
      'in',
      `(${userMemberships.map((r) => r.room_id).join(',')})`
    );
  }

  const { data, error } = await query;

  return { data, error };
}

async function fetchOtherRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log('user:', user.id);

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('rooms_with_creator_email')
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

  if (!user)
    return { data: null, error: { message: 'User not authenticated' } };

  // Get rooms created by user using the new view
  const { data: createdRooms, error: createdError } = await supabase
    .from('rooms_with_creator_email')
    .select('*')
    .eq('created_by', user.id)
    .eq('is_active', true);

  // Get rooms user has joined using the new view
  const { data: joinedRooms, error: joinedError } = await supabase
    .from('rooms_with_creator_email')
    .select(
      `
      *,
      RoomMemberships!inner(user_id)
    `
    )
    .eq('RoomMemberships.user_id', user.id)
    .eq('is_active', true);

  // Combine and remove duplicates
  const allRooms = [...(createdRooms || []), ...(joinedRooms || [])];
  const uniqueRooms = allRooms.filter(
    (room, index, self) =>
      index === self.findIndex((r) => r.room_id === room.room_id)
  );

  return { data: uniqueRooms, error: createdError || joinedError };
}

// Fetch all member emails and the creator's email for a room
async function fetchRoomAllMemberEmails(roomId) {
  // 1. Fetch all member emails from the view
  const { data: memberships, error: membershipsError } = await supabase
    .from('room_members_with_email')
    .select('email')
    .eq('room_id', roomId);

  if (membershipsError) {
    return { data: null, error: membershipsError };
  }

  const memberEmails = memberships?.map((m) => m.email) || [];

  // 2. Fetch the creator's email
  const { data: room, error: roomError } = await supabase
    .from('Rooms')
    .select('created_by')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    return { data: null, error: roomError || { message: 'Room not found' } };
  }

  // 3. Get creator's email from auth.users
  const { data: creator, error: creatorError } = await supabase
    .from('room_members_with_email')
    .select('email')
    .eq('user_id', room.created_by)
    .single();

  if (creatorError) {
    console.warn('Could not fetch creator email:', creatorError);
  }

  // 4. Combine and deduplicate emails
  const allEmails = [...memberEmails];
  if (creator?.email && !allEmails.includes(creator.email)) {
    allEmails.push(creator.email);
  }

  return { data: allEmails, error: null };
}

// Alternative function to fetch room member emails without SQL view
async function fetchRoomAllMemberEmailsAlternative(roomId) {
  // 1. Fetch all user_ids from RoomMemberships for the room
  const { data: memberships, error: membershipsError } = await supabase
    .from('RoomMemberships')
    .select('user_id')
    .eq('room_id', roomId);

  if (membershipsError) {
    return { data: null, error: membershipsError };
  }

  const memberUserIds = memberships?.map((m) => m.user_id) || [];

  // 2. Fetch the creator's user ID
  const { data: room, error: roomError } = await supabase
    .from('Rooms')
    .select('created_by')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    return { data: null, error: roomError || { message: 'Room not found' } };
  }

  // 3. Combine and deduplicate user IDs
  const allUserIds = [...memberUserIds];
  if (!allUserIds.includes(room.created_by)) {
    allUserIds.push(room.created_by);
  }

  // 4. Fetch emails for all user IDs using admin API
  // Note: This requires server-side implementation or RPC function
  // For now, we'll return user IDs and handle email fetching in the UI
  return { data: allUserIds, error: null };
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

async function fetchUsername(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();
  if (error) {
    return { data: null, error };
  }
  return { data: data?.username || null, error: null };
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

export {
  supabase,
  createPublicRoom,
  createPrivateRoom,
  fetchRooms,
  deleteRoom,
  fetchUserRooms,
  fetchAvailableRooms,
  fetchOtherRooms,
  joinRoom,
  fetchUserAccessibleRooms,
  fetchRoomAllMemberEmails,
  fetchRoomAllMemberEmailsAlternative,
  fetchRoomMemberEmails,
  fetchUsername,
  sendMessage,
  fetchMessages,
};
