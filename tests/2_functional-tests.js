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
        .post("/api/threads/test")
        .send({
          _id: "5c225b796a6f460aa6ca0580",
          board: "test",
          text: "testing post route",
          delete_password: "123456"
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
          assert.property(res.body[0], "_id", "Thread should contain ID");
          assert.property(res.body[0], "text", "Thread should contain text");
          assert.property(
            res.body[0],
            "created_on",
            "Thread should contain created on date"
          );
          assert.property(
            res.body[0],
            "bumped_on",
            "Thread should contain bumped on date"
          );
          assert.property(
            res.body[0],
            "replies",
            "Thread should contain replies array"
          );
          done(null, res);
        });
    });

    test("PUT", function(done) {
      chai
        .request(server)
        .put("/api/threads/test")
        .send({
          board: "test",
          thread_id: "5c225b796a6f460aa6ca0580"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done(null, res);
        });
    });

    test("DELETE", function(done) {
      chai
        .request(server)
        .delete("/api/threads/test")
        .send({
          board: "test",
          thread_id: "5c225b796a6f460aa6ca0580",
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

  suite("API ROUTING FOR /api/replies/:board", function() {
    test("POST", function(done) {
      chai
        .request(server)
        .post("/api/replies/test")
        .send({
          board: "test",
          thread_id: "5c229a2c0d73fe03d06c0663",
          text: "testing reply route",
          delete_password: "123456",
          reply_id: "5c229ce59c7e4e10a3bea99e"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.isAbove(res.redirects.length, 0, "Page should be redirected");
          done(null, res);
        });
    });

    test("GET", function(done) {
      chai
        .request(server)
        .get("/api/replies/test?thread_id=5c229a2c0d73fe03d06c0663")
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.property(res.body, "_id", "Thread should contain ID");
          assert.property(res.body, "text", "Thread should contain text");
          assert.property(
            res.body,
            "created_on",
            "Thread should contain created on date"
          );
          assert.property(
            res.body,
            "bumped_on",
            "Thread should contain bumped on date"
          );
          assert.property(
            res.body,
            "replies",
            "Thread should contain replies array"
          );
          done(null, res);
        });
    });

    test("PUT", function(done) {
      chai
        .request(server)
        .put("/api/replies/test")
        .send({
          board: "test",
          thread_id: "5c229a2c0d73fe03d06c0663",
          reply_id: "5c229ce59c7e4e10a3bea99e"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done(null, res);
        });
    });

    test("DELETE", function(done) {
      chai
        .request(server)
        .delete("/api/replies/test")
        .send({
          board: "test",
          thread_id: "5c229a2c0d73fe03d06c0663",
          reply_id: "5c229ce59c7e4e10a3bea99e",
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
