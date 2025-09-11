import mongoose from "mongoose";

export const db = async () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("✅ mongodb connected successully !"))
        .catch((e) => console.log(e))
}
