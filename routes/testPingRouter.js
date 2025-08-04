const path = require("path");
const express = require("express");
const APP_ROOT = process.env.PWD;

const router = express.Router();
router.get("/", (req, res) => {
  res.send("여기는 ping 테스트 라우터!");
});


// N초 딜레이
router.get("/delay/:sec", (req, res) => {
  console.log("🚀 ~ app.get ~ req.query", req.query);

  const sec = req.params.sec;
  setTimeout(() => {
    res.send(`Delayed for ${sec} seconds`);
  }, sec * 1000);
});

// N초 딜레이 후 Throw
router.get("/delayErr/:sec", (req, res) => {
  const sec = req.params.sec;
  setTimeout(() => {
    //send error
    var aa = { aa: 1 };

    throw new Error("RRR");
  }, sec * 1000);
});

// N초 딜레이 후 status 500으로 리턴
router.get("/delay500/:sec", (req, res) => {
  const sec = req.params.sec;
  setTimeout(() => {
    res.status(500).send(`500 status Delayed for ${sec} seconds`);
  }, sec * 1000);
});

// N초후 받은 json 그대로 리턴
router.post("/same/:sec", (req, res) => {
  const json = req.body;
  console.log("🚀 ~ router.post ~ json", json);
  const sec = req.params.sec;

  setTimeout(() => {
    res.json(json);
  }, sec * 1000);
});

// N초후 받은 json 그대로 status 리턴
router.post("/sameErr/:sec", (req, res) => {
  const json = req.body;
  const sec = req.params.sec;

  setTimeout(() => {
    res.status(500).json(json);
  }, sec * 1000);
});

// n초 딜레이후 말 이미지
router.get("/delayImg1/:sec", (req, res) => {
  const sec = req.params.sec;
  setTimeout(() => {
    const pth = path.join(APP_ROOT, "images/horse.jpg")
    res.sendFile(pth);
  }, sec * 1000);
});

// n초 딜레이후 사람 이미지
router.get("/delayImg2/:sec", (req, res) => {
  const sec = req.params.sec;
  setTimeout(() => {
    const pth = path.join(APP_ROOT, "images/woman.png")
    res.sendFile(pth);
    // res.status(500).send(`Delayed for ${sec} seconds`)
  }, sec * 1000);
});

module.exports = router;
