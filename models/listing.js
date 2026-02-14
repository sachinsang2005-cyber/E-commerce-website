const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: String,

    price: {
        type: Number,
        required: true
    },

    image: {
        type: String,
        default: "https://via.placeholder.com/150"
    },

    category: String,
    weight: String,
    stock: Number,
    location: String,
    country: String,

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ]
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
