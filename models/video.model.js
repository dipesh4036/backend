import mongoose, { Schema } from "mongoose";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new mongoose.Schema({
    videofile : String,
    thumbnail : String,
    title : String,
    description : String,
    duration : Number,
    views : {
        type : Number,
        default : 0
    },
    ispublish : {
        type : Boolean,
        default :true
    },
    owner : {
        type : Schema.type.ObjectId,
        ref : 'User'
    }
},{timestamps : true})

videoSchema.plugin(aggregatePaginate);

export const Video = mongoose.model("Video", videoSchema)