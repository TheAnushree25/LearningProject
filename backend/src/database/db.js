import mongoose from "mongoose";

const db = async() => {
    try{
        const baseUrl = process.env.MONGODB_URL || "mongodb+srv://admin:u3opc0wbU3Rrnqcu@cluster0.z7dnoi5.mongodb.net";
        const connectionInstance = await mongoose.connect(`${baseUrl}/eLearning`);
        console.log(`\n MongoDB connected !! DB HOST :: ${connectionInstance.connection.host}`)
    } catch (error){
        console.log("Mongodb connection error", error);
        process.exit(1)
    }
}

export default db;