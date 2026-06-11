import mongoose from "mongoose";

const db = async() => {
    const connStrings = [
        "mongodb+srv://admin:u3opc0wbU3Rrnqcu@cluster0.z7dnoi5.mongodb.net",
        "mongodb+srv://%3Cadmin%3E:%3Cu3opc0wbU3Rrnqcu%3E@cluster0.z7dnoi5.mongodb.net",
        process.env.MONGODB_URL
    ].filter(Boolean);

    let connected = false;
    let lastError = null;

    for (const url of connStrings) {
        try {
            const connectionInstance = await mongoose.connect(`${url}/eLearning`);
            console.log(`\n MongoDB connected !! DB HOST :: ${connectionInstance.connection.host}`);
            connected = true;
            break;
        } catch (error) {
            lastError = error;
            // Mask password in logs to protect credentials
            const maskedUrl = url.replace(/:[^@]+@/, ":****@");
            console.log(`Failed connection attempt to: ${maskedUrl}. Error: ${error.message}`);
        }
    }

    if (!connected) {
        console.log("\n❌ MongoDB connection failed on all attempted connection strings.");
        console.log("Please ensure your database user credentials are correct in MongoDB Atlas and that Network Access allows IP 0.0.0.0/0.");
        // We do NOT call process.exit(1) so the server stays running
    }
}

export default db;