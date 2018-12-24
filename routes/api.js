/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const expect = require("chai").expect;
const ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

mongoose.connect(MONGODB_CONNECTION_STRING);

// new thread schema and model
const threadSchema = new Schema({
  text: String,
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: String,
  replies: [Object]
});
const Thread = mongoose.model("Thread", threadSchema, "boards");

// new reply schema and model
const replySchema = new Schema({
  text: String,
  created_on: { type: Date, default: Date.now },
  delete_password: String,
  reported: { type: Boolean, default: false }
});
const Reply = mongoose.model("Reply", replySchema);

// check that id values are in correct hexadecimal format
function hexTest(str) {
  const hex = /[0-9A-Fa-f]{6}/g;
  return hex.test(str);
}

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .get((req, res) => {
      Thread.find(
        {},
        { replies: { $slice: 3 }, reported: 0, delete_password: 0 }
      )
        .sort({ bumped_on: "desc" })
        .limit(10)
        .exec((err, data) => {
          if (err) return res.send("Failed to retrieve thread");

          res.json(data);
        });
    })
    .post((req, res) => {
      const board = req.params.board;
      const text = req.body.text;
      const password = req.body.delete_password;
      const id = req.body._id; // for tests only

      // search for duplicate thread
      Thread.find({ text: text }, (err, data) => {
        if (err) {
          return res.send("Failed to search database");
        } else if (data.length === 0) {
          // create and save new thread if doesnt already exist
          Thread.create(
            { _id: id || ObjectId(), text: text, delete_password: password },
            (err, data) => {
              if (err)
                return res.status(400).send("Failed to save to database");
            }
          );
        }
        res.redirect(`/b/${board}`);
      });
    })
    .put((req, res) => {
      const threadId = req.body.thread_id;

      if (!hexTest(threadId)) {
        return res.send("incorrect id format");
      }

      Thread.findOneAndUpdate(
        { _id: ObjectId(threadId) },
        { reported: true },
        (err, result) => {
          if (err) {
            return res.send("Failed to find thread");
          } else if (result) {
            res.json("success");
          } else {
            res.json("Thread doesn't exist");
          }
        }
      );
    })
    .delete((req, res) => {
      const threadId = req.body.thread_id;
      const password = req.body.delete_password;

      if (!hexTest(threadId)) {
        return res.send("incorrect id format");
      }

      // first find the thread in the db so passwords can be compared
      Thread.findOne({ _id: ObjectId(threadId) }, (err, thread) => {
        if (password === thread.delete_password) {
          Thread.deleteOne({ _id: ObjectId(threadId) }, (err, result) => {
            if (err) return res.send("Error when deleting");

            res.json("success");
          });
        } else {
          res.json("incorrect password");
        }
      });
    });

  app
    .route("/api/replies/:board")
    .get((req, res) => {
      const threadId = req.query.thread_id;

      if (!hexTest(threadId)) {
        return res.send("incorrect id format");
      }

      Thread.find(
        { _id: ObjectId(threadId) },
        "-reported -delete_password",
        (err, data) => {
          if (err) return res.send("Failed to retrieve thread results");

          res.json(data);
        }
      );
    })
    .post((req, res) => {
      const board = req.params.board;
      const threadId = req.body.thread_id;
      const text = req.body.text;
      const password = req.body.delete_password;
      const replyId = req.body.reply_id; // for testing only

      if (!hexTest(threadId)) {
        return res.send("incorrect id format");
      }

      // create new reply
      let reply = new Reply({
        _id: replyId || ObjectId(),
        text: text,
        delete_password: password
      });

      // check for reply (for testing)
      Thread.find(
        {
          _id: ObjectId(threadId),
          replies: {
            $elemMatch: { _id: ObjectId(replyId) }
          }
        },
        (err, data) => {
          if (err) {
            return res.send("Error searching database");
          } else if (data.length === 0) {
            Thread.updateOne(
              { _id: ObjectId(threadId) },
              {
                bumped_on: new Date(),
                $push: { replies: reply }
              },
              (err, data) => {
                if (err) return res.send("Failed to update thread");
              }
            );
          }
          res.redirect(`/b/${board}/${threadId}`);
        }
      );
    })
    .put((req, res) => {
      const threadId = req.body.thread_id;
      const replyId = req.body.reply_id;

      if (!hexTest(threadId) || !hexTest(replyId)) {
        return res.send("incorrect id format");
      }

      Thread.findOneAndUpdate(
        {
          _id: ObjectId(threadId),
          replies: {
            $elemMatch: { _id: ObjectId(replyId) }
          }
        },
        { $set: { "replies.$.reported": true } },
        (err, result) => {
          if (err) {
            return res.send("Error finding reply");
          } else if (result) {
            res.json("success");
          } else {
            res.json("reply doesn't exist");
          }
        }
      );
    })
    .delete((req, res) => {
      const threadId = req.body.thread_id;
      const replyId = req.body.reply_id;
      const password = req.body.delete_password;

      if (!hexTest(threadId) || !hexTest(replyId)) {
        return res.send("incorrect id format");
      }

      // first find the thread
      Thread.findOneAndUpdate(
        {
          _id: ObjectId(threadId),
          replies: {
            $elemMatch: { _id: ObjectId(replyId), delete_password: password }
          }
        },
        { $set: { "replies.$.text": "[deleted]" } },
        (err, reply) => {
          if (err) {
            return res.send("Error finding thread");
          } else if (reply) {
            res.json("success");
          } else {
            res.json("incorrect password");
          }
        }
      );
    });
};
