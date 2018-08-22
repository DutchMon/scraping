// Require mongoose
var mongoose = require("mongoose");
var Comment = require("./Comments");
// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  favorites: {
    type: Boolean,
    default: false
  },
  comments: [{
     type: Schema.Types.ObjectId,
     ref: "Comments"
  }]
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;