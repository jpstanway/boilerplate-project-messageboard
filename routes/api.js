/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const CONNECTION = process.env.DB;

module.exports = function(app) {
  // THREAD ROUTE
  app
    .route("/api/threads/:board")
    .post((req, res) => {
      const board = req.body.board;
      const text = req.body.text;
      const password = req.body.delete_password;
      const id = req.body._id; // for tests only

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          // create and save new thread
          db.collection(board).insert(
            {
              _id: id || ObjectId(),
              text: text,
              created_on: new Date(),
              bumped_on: new Date(),
              reported: false,
              delete_password: password,
              replies: []
            },
            (err, thread) => {
              if (err)
                return res.status(400).send("Failed to save to database");

              res.redirect(`/b/${board}`);
            }
          );
        }
      );
    })
    .get((req, res) => {
      const board = req.params.board;

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board)
            .find(
              {},
              { replies: { $slice: 3 }, reported: 0, delete_password: 0 }
            )
            .limit(10)
            .sort({ bumped_on: -1 })
            .toArray()
            .then(threads => res.json(threads));
        }
      );
    })
    .delete((req, res) => {
      const board = req.body.board;
      const threadId = req.body.thread_id;
      const password = req.body.delete_password;

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          // find thread in collection first
          db.collection(board)
            .findOne({ _id: ObjectId(threadId) })
            .then(thread => {
              // compare passwords before deleting
              if (password === thread.delete_password) {
                db.collection(board)
                  .deleteOne({ _id: ObjectId(threadId) })
                  .then(thread => res.json("success"));
              } else {
                res.json("incorrect password");
              }
            });
        }
      );
    })
    .put((req, res) => {
      const board = req.body.board;
      const threadId = req.body.thread_id;

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board)
            .findOneAndUpdate(
              { _id: ObjectId(threadId) },
              { $set: { reported: true } }
            )
            .then(result => res.json("success"))
            .catch(err => res.json(err));
        }
      );
    });

  // REPLY ROUTE
  app
    .route("/api/replies/:board")
    .get((req, res) => {
      const board = req.params.board;
      const threadId = req.query.thread_id;

      if (!hexTest(threadId)) {
        return res.send("incorrect id format");
      }

      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board).find(
            { _id: ObjectId(threadId) },
            {
              reported: 0,
              delete_password: 0,
              "replies.reported": 0,
              "replies.delete_password": 0
            },
            (err, data) => {
              if (err) return res.send("Failed to retrieve thread results");

              res.json(data);
            }
          );
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
      const reply = {
        _id: replyId || ObjectId(),
        text: text,
        delete_password: password
      };

      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          // check for reply (for testing)
          db.collection(board).find(
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
                db.collection(board).updateOne(
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
        }
      );
    })
    .put((req, res) => {
      const board = req.params.board;
      const threadId = req.body.thread_id;
      const replyId = req.body.reply_id;

      if (!hexTest(threadId) || !hexTest(replyId)) {
        return res.send("incorrect id format");
      }

      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board).findOneAndUpdate(
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
        }
      );
    })
    .delete((req, res) => {
      const board = req.params.board;
      const threadId = req.body.thread_id;
      const replyId = req.body.reply_id;
      const password = req.body.delete_password;

      if (!hexTest(threadId) || !hexTest(replyId)) {
        return res.send("incorrect id format");
      }

      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          // first find the thread
          db.collection(board).findOneAndUpdate(
            {
              _id: ObjectId(threadId),
              replies: {
                $elemMatch: {
                  _id: ObjectId(replyId),
                  delete_password: password
                }
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
        }
      );
    });
};
