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
          assert.equal(res.status, 200);
          assert.isAbove(res.redirects.length, 0, "A redirect should occur");
          done();
        });
    });

    test("GET", function(done) {
      chai
        .request(server)
        .get("/api/threads/test")
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isBelow(
            res.body.length,
            11,
            "Returned threads should be less than 11"
          );
          done();
        });
    });

    test("DELETE", function(done) {
      chai
        .request(server)
        .delete("/api/threads/test")
        .send({
          board: "test",
          thread_id: "5c1d8621a2a1d0529028051f",
          delete_password: "123456"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done();
        });
    });

    test("PUT", function(done) {
      chai
        .request(server)
        .put("/api/threads/test")
        .send({
          board: "test",
          thread_id: "5c1d98289a3f532898a83703"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body, "success");
          done();
        });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    test("POST", function(done) {});

    test("GET", function(done) {});

    test("PUT", function(done) {});

    test("DELETE", function(done) {});
  });
});
