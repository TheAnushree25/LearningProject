import { Client, Databases, Users } from "node-appwrite";

// Global connection state
global.isAppwriteConnected = false;

let appwriteClient = null;
let databases = null;
let appwriteUsers = null;

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (endpoint && projectId && apiKey) {
    try {
        appwriteClient = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(apiKey);

        databases = new Databases(appwriteClient);
        appwriteUsers = new Users(appwriteClient);
        global.isAppwriteConnected = true;
        console.log("✅ Appwrite Client initialized successfully!");
    } catch (err) {
        console.error("❌ Failed to initialize Appwrite Client:", err.message);
        global.isAppwriteConnected = false;
    }
} else {
    console.log("ℹ️ Appwrite environment variables not fully configured. Seamlessly falling back to In-Memory Mock Mode.");
    global.isAppwriteConnected = false;
}

export { appwriteClient, databases, appwriteUsers };
export const databaseId = process.env.APPWRITE_DATABASE_ID || "eLearningDB";
export const usersColId = process.env.APPWRITE_USERS_COL_ID || "users";
export const coursesColId = process.env.APPWRITE_COURSES_COL_ID || "courses";
export const progressColId = process.env.APPWRITE_PROGRESS_COL_ID || "course_progress";
export const contactsColId = process.env.APPWRITE_CONTACTS_COL_ID || "contacts";
export const paymentsColId = process.env.APPWRITE_PAYMENTS_COL_ID || "payments";
