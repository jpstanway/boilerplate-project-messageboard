/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    test("POST", function(done) {
      chai
        .request(server)
        .post("/api/threads/:board")
        .send({
          board: "test",
          text: "testing new thread creation",
          delete_password: "123456",
          _id: "5c1d8621a2a1d0529028051f"
        })
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.isAbove(res.redirects.length, 0, "A redirect should occur");
          done(null, res);
        });
    });

    test("GET", function(done) {
      chai
        .request(server)
        .get("/api/threads/test")
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.isBelow(
            res.body.length,
            11,
            "Returned threads should be less than 11"
          );
          done(null, res);
        });
    });

    test("DELETE", function(done) {
      chai
        .request(server)
        .delete("/api/threads/:board")
        .send({
          board: "test",
          thread_id: "5c1d8621a2a1d0529028051f",
          delete_password: "123456"
        })
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done(null, res);
        });
    });

    test("PUT", function(done) {
      chai
        .request(server)
        .put("/api/threads/:board")
        .send({
          board: "test",
          thread_id: "5c1d98289a3f532898a83703"
        })
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done(null, res);
        });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    test("POST", function(done) {
      chai
        .request(server)
        .post("/api/replies/:board")
        .send({
          board: "test",
          thread_id: "5c1d98289a3f532898a83703",
          text: "test reply",
          delete_password: "123456",
          reply_id: "5c1d9a7658d4c949c8ec70a9"
        })
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.isAbove(res.redirects.length, 0, "A redirect should occur");
          done(null, res);
        });
    });

    test("GET", function(done) {
      chai
        .request(server)
        .get("/api/replies/test?thread_id=5c1d98289a3f532898a83703")
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.property(res.body[0], "_id", "Thread should have an id");
          assert.property(
            res.body[0],
            "text",
            "Thread should have a text field"
          );
          assert.property(
            res.body[0],
            "created_on",
            "Thread should have a created on date"
          );
          assert.property(
            res.body[0],
            "bumped_on",
            "Thread should have a bumped on date"
          );
          assert.property(
            res.body[0],
            "replies",
            "Thread should have replies array"
          );
          assert.isArray(res.body[0].replies);
          done(null, res);
        });
    });

    test("PUT", function(done) {
      chai
        .request(server)
        .put("/api/replies/:board")
        .send({
          board: "test",
          thread_id: "5c1d98289a3f532898a83703",
          reply_id: "5c1d9a7658d4c949c8ec70a9"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done(null, err);
        });
    });

    test("DELETE", function(done) {
      chai
        .request(server)
        .delete("/api/replies/:board")
        .send({
          board: "test",
          thread_id: "5c1d98289a3f532898a83703",
          reply_id: "5c1d9a7658d4c949c8ec70a9",
          delete_password: "123456"
        })
        .end((err, res) => {
          if (err) return done(err);

          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done(null, res);
        });
    });
  });
});
