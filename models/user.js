const mongoose = require("mongoose");

// IMPORTANT FIX 👇
const passportLocalMongoose =
    require("passport-local-mongoose").default ||
    require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
