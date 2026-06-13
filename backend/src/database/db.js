import mongoose from "mongoose";

// Global connection state
global.isMongoConnected = false;

const db = async() => {
    const connStrings = [
        process.env.MONGODB_URL,
        "mongodb+srv://ElearningProject:JGqPVGjdDW6k2VS2@mydatabase.uc73haq.mongodb.net/?appName=MyDatabase",
        "mongodb+srv://admin:u3opc0wbU3Rrnqcu@cluster0.z7dnoi5.mongodb.net"
    ].filter(Boolean);

    let connected = false;

    for (const url of connStrings) {
        try {
            let fullUrl = url;
            if (!fullUrl.includes("/eLearning")) {
                if (fullUrl.includes("?")) {
                    const parts = fullUrl.split("?");
                    if (parts[0].endsWith("/")) {
                        fullUrl = `${parts[0]}eLearning?${parts[1]}`;
                    } else {
                        fullUrl = `${parts[0]}/eLearning?${parts[1]}`;
                    }
                } else {
                    if (fullUrl.endsWith("/")) {
                        fullUrl = `${fullUrl}eLearning`;
                    } else {
                        fullUrl = `${fullUrl}/eLearning`;
                    }
                }
            }
            
            const connectionInstance = await mongoose.connect(fullUrl);
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