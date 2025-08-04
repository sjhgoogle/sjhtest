const path = require("path");
const express = require("express");
const APP_ROOT = process.env.PWD;
const jwtLib = require("jsonwebtoken");

const router = express.Router();
router.get("/", (req, res) => {
  res.send("여기는 jwt 토큰 테스트 라우터!");
});

router.post("/accToken", (req, res) => {
  console.log("🚀 ~ router.post ~ res.body:", req.body);
  const bodyData = req.body;
  const options = {
    algorithm: "HS256", // 해싱 알고리즘
    // algorithm: "RS256", // 해싱 알고리즘
    issuer: "issuer", // 발행자
    expiresIn: bodyData.ttl || "30m",
    mutatePayload: false,
  };
  if (bodyData.iss) {
    delete options.issuer;
  }
  const jwtToken = jwtLib.sign(bodyData, bodyData.secret || "secret", options);
  res.json({ jwtToken });
});

router.post("/refreshToken", (req, res) => {
  const { accToken, ignoreExp } = req.body;

  // "error": {
  //   "name": "TokenExpiredError",
  //   "message": "jwt expired",
  //   "expiredAt": "2024-03-24T14:31:10.000Z"
  // }
  let decode = null;
  try {
    decode = jwtLib.verify(accToken, "secret");
    console.log(1111);
  } catch (error) {
    console.log(2222, error);

    if (ignoreExp && error instanceof jwtLib.TokenExpiredError) {
      console.log(3333);
      decode = jwtLib.decode(accToken);
    } else {
      res.status(403).json({
        code: 1234,
        error,
      });
      return;
    }
  }
  console.log("🚀 ~ router.post ~ decode:", decode);

  // console.log("🚀 ~ router.post ~ res.body:", req.body);
  // const bodyData = req.body;
  const options = {
    algorithm: "HS256", // 해싱 알고리즘
    // algorithm: "RS256", // 해싱 알고리즘
    issuer: "issuer", // 발행자
    expiresIn: req.body.ttl || "30m",
    mutatePayload: false,
  };

  delete decode.iat;
  delete decode.exp;
  delete decode.nbf;
  delete decode.jti; //We are generating a new token, if you are using jwtid during signing, pass it in refreshOptions
  delete decode.iss; //We are generating a new token, if you are using jwtid during signing, pass it in refreshOptions

  const newToken = jwtLib.sign(decode, "secret", options);
  const newTokenDecode = jwtLib.verify(newToken, "secret", options);

  res.json({ decode, newToken, newTokenDecode, accToken });
});

router.post("/verifyToken", (req, res) => {
  console.log("🚀 ~ router.post ~ res.body:", req.body);
  const bodyData = req.body;
  jwtLib;

  try {
    const decode = jwtLib.verify(bodyData.accToken, bodyData.secret || "secret");

    // { ttl: '1m', iat: 1711290610, exp: 1711290670, iss: 'issuer' }

    res.json({
      msg: "성공",
      result: decode,
    });
  } catch (err) {
    res.json({ err });
  }
});

var jwtMiddleWare = function (req, res, next) {
  const token = req.headers["x-auth-token"];
  console.log("🚀 ~ jwtMiddleWare ~ token:", token);

  try {
    const decode = jwtLib.verify(token, "secret");
    console.log("🚀 ~ jwtMiddleWare ~ decode:", decode);
    next();
  } catch (error) {
    console.log("🚀 ~ jwtMiddleWare ~ error:", error);
    res.status(403).json({
      code: "901",
      msg: "되겠냐 ㅋㅋㅋ",
      error,
    });
  }
};

/**
 * 토큰 필요한 데이터
 */
router.get("/dataNeedToken", jwtMiddleWare, (req, res) => {
  res.json({
    msg: "성공",
  });
});

/**
 * 토큰 안필요한 데이터
 */
router.get("/dataNoNeedToken", (req, res) => {
  res.json({
    msg: "성공",
  });
});

module.exports = router;
