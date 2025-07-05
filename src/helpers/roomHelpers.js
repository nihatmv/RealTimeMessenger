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
  // You should hash the password here before returning!
  return {
    name,
    room_code: generateRoomCode(),
    password, // hash this before storing!
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
}

export { generateRoomCode, createPublicRoomPayload, createPrivateRoomPayload };
