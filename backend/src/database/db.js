import mongoose from "mongoose";

// Global connection state
global.isMongoConnected = false;

const db = async() => {
    const connStrings = [
        "mongodb+srv://admin:u3opc0wbU3Rrnqcu@cluster0.z7dnoi5.mongodb.net",
        "mongodb+srv://%3Cadmin%3E:%3Cu3opc0wbU3Rrnqcu%3E@cluster0.z7dnoi5.mongodb.net",
        process.env.MONGODB_URL
    ].filter(Boolean);

    let connected = false;

    for (const url of connStrings) {
        try {
            const connectionInstance = await mongoose.connect(`${url}/eLearning`);
            console.log(`\n MongoDB connected !! DB HOST :: ${connectionInstance.connection.host}`);
            connected = true;
            global.isMongoConnected = true;
            break;
        } catch (error) {
            // Mask password in logs
            const maskedUrl = url.replace(/:[^@]+@/, ":****@");
            console.log(`Failed connection attempt to: ${maskedUrl}. Error: ${error.message}`);
        }
    }

    if (!connected) {
        console.log("\n❌ MongoDB connection failed. Seamlessly falling back to In-Memory Mock Database Mode.");
        global.isMongoConnected = false;
    }
}

export default db;