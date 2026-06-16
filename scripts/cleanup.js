const FIREBASE_URL = process.env.FIREBASE_URL;

if (!FIREBASE_URL) {
  console.error("Error: FIREBASE_URL environment variable is not defined.");
  process.exit(1);
}

const dbUrl = (path) => {
  return FIREBASE_URL.replace(/\/$/, '') + '/' + path + '.json';
};

async function runCleanup() {
  console.log("Starting database cleanup task...");
  try {
    const res = await fetch(dbUrl('rooms'));
    if (!res.ok) {
      throw new Error(`Failed to fetch rooms: ${res.status} ${res.statusText}`);
    }

    const rooms = await res.json();
    if (!rooms) {
      console.log("No active rooms found in the database.");
      return;
    }

    const now = Date.now();
    const cutoffHours = 24;
    const cutoffTime = now - cutoffHours * 60 * 60 * 1000;

    let deletedCount = 0;
    const roomsArray = Object.entries(rooms);

    for (const [code, room] of roomsArray) {
      // Each room update sets a `ts` field automatically in src/firebase.js
      const lastActive = room.ts || 0;

      if (lastActive < cutoffTime) {
        console.log(`Room ${code} is inactive (last active: ${new Date(lastActive).toISOString()}). Deleting...`);
        const deleteRes = await fetch(dbUrl(`rooms/${code}`), {
          method: 'DELETE'
        });
        if (deleteRes.ok) {
          deletedCount++;
        } else {
          console.error(`Failed to delete room ${code}: ${deleteRes.status}`);
        }
      }
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} inactive room(s) out of ${roomsArray.length} total room(s).`);
  } catch (error) {
    console.error("Cleanup failed with error:", error);
    process.exit(1);
  }
}

runCleanup();
