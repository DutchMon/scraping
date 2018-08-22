var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var path = require("path");
var port = process.env.PORT || 3000

var Comment = require("./models/Comments.js");
var Article = require("./models/Articles.js");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");


var app = express();

// Use body parser with our app
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

mongoose.Promise = Promise;
var MONGODB_URI = process.env.MONGODB_URI|| "mongodb://localhost:/mongoHeadlines";

mongoose.connect(MONGODB_URI);


var db = mongoose.connection;
db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});

db.once("open", function () {
    console.log("Mongoose connection successful.");
});


//   Routes

//GET requests to render Handlebars pages
app.get("/", function (req, res) {
    Article.find({ "favorites": false }, function (error, data) {
        var hbsObject = {
            Article: data
        };
        console.log(hbsObject);
        res.render("feed", hbsObject);
    });
});

app.get("/favorited", function (req, res) {
    Article.find({ "favorites": true }).exec(function (error, articles) {
        var hbsObject = {
            Article: articles
        };
        res.render("favorited", hbsObject);
    });
});

// A GET request to scrape the echojs website
app.get("/scrape", function (req, res) {
    request("https://www.independent.ie/sport/soccer/", function (error, response, html) {
        var $ = cheerio.load(html);
        $("article").each(function (i, element) {

            var result = {};

            result.title = $(this).find("h2").text().replace(/\n/g, '');
            result.summary = $(this).find("p").text().replace(/\n/g, '');
            result.link = $(this).find("a").attr("href");

            var entry = new Article(result);

            entry.save(function (err, doc) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(doc);
                }
            });

        });
        res.send("Scrape Complete");

    });
});

// Get the articles we scraped from the mongoDB
app.get("/articles", function (req, res) {
    Article.find({}, function (error, doc) {
        if (error) {
            console.log(error);
        }
        else {
            res.json(doc);
        }
    });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function (req, res) {
    Article.findOne({ "_id": req.params.id })
        .populate("comment")
        .exec(function (error, doc) {
            if (error) {
                console.log(error);
            }
            else {
                res.json(doc);
            }
        });
});

// Favorite an article
app.post("/articles/favorites/:id", function (req, res) {
    Article.findOneAndUpdate({ "_id": req.params.id }, { "favorites": true })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(doc);
            }
        });
});

// Delete a favorited article
app.post("/articles/delete/:id", function (req, res) {
    Article.findOneAndUpdate({ "_id": req.params.id }, { "favoirtes": false, "comments": [] })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(doc);
            }
        });
});

// Create a new comment
app.post("/comments/save/:id", function (req, res) {
    var newNote = new Comment({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body)
    newComment.save(function (error, comment) {
        if (error) {
            console.log(error);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "comments": comment } })
                .exec(function (err) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    }
                    else {
                        res.send(comment);
                    }
                });
        }
    });
});

// Delete a note
app.delete("/comments/delete/:comment_id/:article_id", function (req, res) {
    Comment.findOneAndRemove({ "_id": req.params.comment_id }, function (err) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "comments": req.params.comment_id } })
                .exec(function (err) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    }
                    else {
                        res.send("Comment Deleted");
                    }
                });
        }
    });
});

// Listen on port
app.listen(port, function () {
    console.log("Server running on port " + port);
});