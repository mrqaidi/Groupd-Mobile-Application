//Project Object
export interface Proj{
    projectId: String,
    projectName: String,
    projectThumb: String,
    projectCreator: String,
    projectMembers: String[],
    maxMembers: Number,
    projectDesc: String,
    comments: [Comment],
    tags?: String[],
    /*projectMembers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    
    tags: [String],
    projectDelete: Boolean,
    projectCompleted: Boolean,*/
    time: Date
}
export interface Comment{
        username: String,
        comment: String,
        time: Date
    }