import "./appwrite.js";

// Set MongoDB connected flag permanently false to disable old queries
global.isMongoConnected = false;

const db = async () => {
    if (global.isAppwriteConnected) {
        console.log("ℹ️ Server started with Appwrite Database backend active.");
    } else {
        console.log("ℹ️ Server started in Database-Disconnected In-Memory Mock Mode.");
    }
    return Promise.resolve();
};

export default db;