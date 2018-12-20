/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

mongoose.connect(MONGODB_CONNECTION_STRING);

// new thread schema and model
const threadSchema = new Schema({
  text: String,
  created_on: {type: Date, default: Date.now},
  bumped_on: {type: Date, default: Date.now},
  reported: {type: Boolean, default: false},
  delete_password: String,
  replies: [String]
});
const Thread = mongoose.model('Thread', threadSchema, 'boards');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get((req, res) => {
      Thread.find({}, {replies: {$slice: 3}, reported: 0, delete_password: 0})
            .sort({bumped_on: 'desc'})
            .limit(10)
            .exec((err, data) => {
              if (err) res.send('Failed to retrieve thread');

              res.json(data);
            });
    })
    .post((req, res) => {
      const board = req.params.board;
      const text = req.body.text;
      const password = req.body.delete_password;

      Thread.create({text: text, delete_password: password}, (err, data) => {
        if (err) res.send('Failed to save to database');

        res.redirect(`/b/${board}`);
      });
    })
    .delete((req, res) => {
      const threadId = req.body.thread_id;
      const password = req.body.delete_password;

      // first find the thread in the db so passwords can be compared
      Thread.findOne({_id: ObjectId(threadId)}, (err, thread) => {
        
        if (password === thread.delete_password) {
          Thread.deleteOne({_id: ObjectId(threadId)}, (err, result) => {
            if (err) res.send('Error when deleting');

            res.json('success');
          });
        } else {
          res.json('incorrect password');
        }

      });
    });
    
  app.route('/api/replies/:board')
    .get((req, res) => {
      const threadId = req.query.thread_id;
      
      Thread.find({_id: ObjectId(threadId)}, '-reported -delete_password', (err, data) => {
        if (err) res.send('Failed to retrieve thread results');

        res.json(data);
      });
    })
    .post((req, res) => {
      const board = req.params.board;
      const threadId = req.body.thread_id;
      const text = req.body.text;
      const password = req.body.delete_password;

      Thread.updateOne(
        {_id: ObjectId(threadId)},
        {
          bumped_on: new Date(),
          delete_password: password,
          $push: {replies: text}
        },
        (err, data) => {
          if (err) res.send('Failed to update thread');

          res.redirect(`/b/${board}/${threadId}`);
        }
      );
    });
};
