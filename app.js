const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");

const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const session = require("express-session");
const flash = require("connect-flash");

// MULTER (image upload)
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const app = express();

// ---------------- SESSION ---------------- //

const sessionOptions = {
    secret: "mysupersecretkey",
    resave: false,
    saveUninitialized: false
};

app.use(session(sessionOptions));
app.use(flash());

// flash messages
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

// ---------------- PASSPORT ---------------- //

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ---------------- EXPRESS SETUP ---------------- //

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads")); // show uploaded images

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// mongodb connection
mongoose.connect("mongodb://127.0.0.1:27017/farsan")
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));


// ---------------- AUTH ROUTES ---------------- //

// signup
app.get("/signup", (req, res) => {
    res.render("listings/signup");
});

app.post("/signup", async (req, res) => {
    try {
        let { username, email, password } = req.body;

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Account created successfully!");
            res.redirect("/listings");
        });

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
});

// login
app.get("/login", (req, res) => {
    res.render("listings/login");
});

app.post(
    "/login",
    passport.authenticate("local", {
        failureFlash: true,
        failureRedirect: "/login"
    }),
    (req, res) => {
        req.flash("success", "Welcome back!");
        res.redirect("/listings");
    }
);

// logout
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully");
        res.redirect("/listings");
    });
});

// ---------------- MIDDLEWARE ---------------- //

function isLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in");
        return res.redirect("/login");
    }
    next();
}

async function isOwner(req, res, next) {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "Not authorized");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

// ---------------- ROUTES ---------------- //

app.get("/", (req, res) => {
    res.redirect("/listings");
});

// all products
app.get("/listings", async (req, res) => {
    let alllisting = await Listing.find({});
    res.render("listings/index", { alllisting });
});

// new product form
app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("listings/new");
});

// ⭐ CREATE PRODUCT (FIXED)
app.post(
    "/listings",
    isLoggedIn,
    upload.single("image"),
    async (req, res, next) => {
        try {
            let newListing = new Listing(req.body.listing);
            newListing.owner = req.user._id;

            if (req.file) {
                newListing.image = "/uploads/" + req.file.filename;
            }

            await newListing.save();
            req.flash("success", "New product added");
            res.redirect("/listings");

        } catch (err) {
            next(err);
        }
    }
);

// show product
app.get("/listings/:id", async (req, res, next) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ExpressError(400, "Invalid ID"));
    }

    let list = await Listing.findById(id).populate("reviews");

    if (!list) {
        return next(new ExpressError(404, "Product not found"));
    }

    res.render("listings/show", { list });
});

// edit form
app.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
    let list = await Listing.findById(req.params.id);
    res.render("listings/edit", { list });
});

// update product
app.put("/listings/:id", isLoggedIn, isOwner, async (req, res, next) => {
    try {
        let { id } = req.params;
        await Listing.findByIdAndUpdate(id, req.body.listing);

        req.flash("success", "Product updated");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
});

// delete product
app.delete("/listings/:id", isLoggedIn, isOwner, async (req, res, next) => {
    try {
        await Listing.findByIdAndDelete(req.params.id);
        req.flash("error", "Product deleted");
        res.redirect("/listings");
    } catch (err) {
        next(err);
    }
});

// reviews
app.post("/listings/:id/reviews", async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
});

// ---------------- ERROR HANDLING ---------------- //

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).send(message);
});

// ---------------- SERVER ---------------- //

app.listen(8000, () => {
    console.log("Server running on http://localhost:8000");
});
