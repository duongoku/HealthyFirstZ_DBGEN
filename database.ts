import mongoose from "mongoose";
import dotenv from "dotenv";

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    throw dotenvResult.error;
}

class MongooseService {
    private count = 0;
    private mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
    };
    private mongoURI = "uriplaceholder";

    constructor() {
        if (process.env.MONGO_URI === undefined) {
            throw new Error("MONGO_URI is not defined");
        }
        this.mongoURI = process.env.MONGO_URI;
        this.connectWithRetry();
    }

    getMongoose() {
        return mongoose;
    }

    connectWithRetry = () => {
        console.log("Attempting MongoDB connection (will retry if needed)");
        mongoose
            .connect(this.mongoURI, this.mongooseOptions)
            .then(() => {
                console.log("MongoDB is connected");
            })
            .catch((err) => {
                const retrySeconds = 5;
                console.log(
                    `MongoDB connection unsuccessful (will retry #${++this
                        .count} after ${retrySeconds} seconds):`,
                    err
                );
                setTimeout(this.connectWithRetry, retrySeconds * 1000);
            });
    };

    async clearCollections() {
        const collections = mongoose.connection.collections;

        await Promise.all(
            Object.values(collections).map(async (collection) => {
                await collection.deleteMany({});
            })
        );
    }
}

export default new MongooseService();
