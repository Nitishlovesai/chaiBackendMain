import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{
            type: String,  //cloudinary 
            required: [true ,"Video is required"],

        },
        thumbNail:{
            type: String,  //cloudinary 
            required: [true ,"Video is required"],
        },
        title:{
            type: String,
            required: true,
        },
        description:{
            type: String,
            required: true,
        },
        duration :{
            type: Number, //cloudinary se mil jaye ga
            required: true
        },
        views:{
            type: Number,
            default,
        },
        isPublished:{
            type: Boolean,
            default: true
        },
        Owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
        
    }
    ,{timestamps: true})



videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video" , videoSchem)