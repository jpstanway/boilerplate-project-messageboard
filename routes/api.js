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
  app
    .route("/api/threads/:board")
    .post((req, res) => {
      expect(req.body).to.be.an("object");
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
              _id: ObjectId(id) || ObjectId(),
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

              res.redirect(`/b/${board}/`);
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
      expect(req.body).to.be.an("object");
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
      expect(req.body).to.be.an("object");
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

  app
    .route("/api/replies/:board")
    .post((req, res) => {
      expect(req.body).to.be.an("object");
      const board = req.body.board;
      const threadId = req.body.thread_id;
      const text = req.body.text;
      const password = req.body.delete_password;
      const replyId = req.body.reply_id; // for testing only

      const reply = {
        _id: ObjectId(replyId) || ObjectId(),
        text: text,
        created_on: new Date(),
        reported: false,
        delete_password: password
      };

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board)
            .findOneAndUpdate(
              { _id: ObjectId(threadId) },
              {
                $set: { bumped_on: new Date() },
                $push: { replies: reply }
              }
            )
            .then(thread => res.redirect(`/b/${board}/${threadId}`))
            .catch(err => res.json(err));
        }
      );
    })
    .get((req, res) => {
      const board = req.params.board;
      const threadId = req.query.thread_id;

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board)
            .findOne(
              { _id: ObjectId(threadId) },
              {
                reported: 0,
                delete_password: 0,
                "replies.reported": 0,
                "replies.delete_password": 0
              }
            )
            .then(thread => res.json(thread))
            .catch(err => res.json(err));
        }
      );
    })
    .put((req, res) => {
      expect(req.body).to.be.an("object");
      const board = req.body.board;
      const threadId = req.body.thread_id;
      const replyId = req.body.reply_id;

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board)
            .findOneAndUpdate(
              {
                _id: ObjectId(threadId),
                replies: { $elemMatch: { _id: ObjectId(replyId) } }
              },
              {
                $set: { "replies.$.reported": true }
              }
            )
            .then(thread => res.json("success"))
            .catch(err => res.json(err));
        }
      );
    })
    .delete((req, res) => {
      expect(req.body).to.be.an("object");
      const board = req.body.board;
      const threadId = req.body.thread_id;
      const replyId = req.body.reply_id;
      const password = req.body.delete_password;

      MongoClient.connect(
        CONNECTION,
        (err, db) => {
          if (err) return res.send("Failed to connect to database");

          db.collection(board)
            .findOne({
              _id: ObjectId(threadId),
              replies: { $elemMatch: { _id: ObjectId(replyId) } }
            })
            .then(thread => {
              const replyToDelete = thread.replies
                .map(reply => reply._id.toString())
                .indexOf(replyId);

              if (password === thread.replies[replyToDelete].delete_password) {
                db.collection(board)
                  .updateOne(
                    {
                      _id: ObjectId(threadId),
                      replies: { $elemMatch: { _id: ObjectId(replyId) } }
                    },
                    { $set: { "replies.$.text": "[deleted]" } }
                  )
                  .then(reply => res.json("success"));
              } else {
                res.json("incorrect password");
              }
            })
            .catch(err => res.json(err));
        }
      );
    });
};
