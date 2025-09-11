import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new mongoose.Schema({
   subscriber: {
        type: Schema.Types.ObjectId,  // one who subscribing
        ref: 'User'
   },
   channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing (dusro ki channle subscriber ki hue hai)
        ref: 'User'
   }
}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)