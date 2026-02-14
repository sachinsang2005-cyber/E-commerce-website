const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initdata = require("./data.js");

mongoose.connect("mongodb://127.0.0.1:27017/farsan")
    .then(() => console.log("DB is connected"))
    .catch((err) => console.error("DB connection failed:", err));

const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initdata.data);
    console.log("Data initialized");
};

initDB();
