const path = require("path");
const express = require("express");
const axios = require("axios")
const dayjs = require("dayjs")

const router = express.Router();
var glob = require("glob");

router.get("/", (req, res) => {
  res.send("여기는 kt멤버십 테스트 라우터!");
});

const targetResults = {};

// console.log("HIHI", glob.sync(path.join(__dirname, "users/**/*.js")));

glob.sync(path.join(__dirname, "..", "ktusers/**/*.js")).forEach(function (file, ...li) {
  // console.log("🚀 ~ @@@@@@@@@@@@@@@@glob.sync ~ li", li);

  // const fileName = path.basename(file); // yunga.js
  const fileName = path.basename(file, ".js"); // yunga

  // console.log("🚀 ~ glob.sync ~ file", file);
  const target = require(path.resolve(file));

  targetResults[fileName] = target;
});

const promisifySjh = (cb) => async (req, res) => {
  try {
    await cb(req, res);
  } catch (e) {
    console.log("🚀 ~ fyfy ~ e", e);
    res.status(444).json({ err: e, msg: "ㅠㅠㅠ 에러" });
  }
};

/**
 * 프리픽스 : ktmem
 */


/**
 * 초반에 모든유저 리턴하기
 */
router.get("/all", (req, res) => {
  res.json(targetResults);
});

/**
 * 특정유저만 새로 리로드하기
 */
router.get(
  "/:target",
  promisifySjh(async (req, res) => {
    // const reload = req.query.reload || "N";
    console.log("🚀 ~ app.get ~ req.query", req.query);

    const targetNm = req.params.target || "inin";
    const userLoginObj = targetResults[targetNm];
    // console.log("🚀 ~ fyfy ~ userLoginObj:", userLoginObj);
    // console.log("🚀 ~ fyfy ~ userLoginObj:", userLoginObj.headers);

    if (userLoginObj?.userInfo?.authKey && req.query.reload !== "Y") {
      return res.json({
        result: "이미존재",
        ...userLoginObj,
        // userInfo: targetResults[targetNm].userInfo,
        // headerValue: targetResults[targetNm].headerValue,
      });
    }

    if (userLoginObj.targetUrl.includes("tb")) {
      userLoginObj.headers.os = "android";
      userLoginObj.headers.appVersion = "23.02.01";
    } else {
      userLoginObj.headers.os = "ios";
      userLoginObj.headers.appVersion = "23.04.01";
    }

    let { data } = await axios.post(
      userLoginObj.targetUrl,
      {
        ...userLoginObj.body,
      },
      {
        headers: { ...userLoginObj.headers },
      }
    );

    console.log("🚀 ~ fyfy ~ data:", data);

    if (!data.memToken) {
      console.log("🚀 ~ fyfy ~ data.data.memToken 없음");
      if (userLoginObj.userInfo) {
        userLoginObj.userInfo.authKey = null;
      }
      return res.status(500).json({
        msg: "data.memToken 없음" + JSON.stringify(data),
        errr: {
          body: userLoginObj.body,
          header: userLoginObj.headers,
        },
      });
    }

    const _headerValue = {};
    const _userInfo = {};

    _headerValue.autoLogin = "";
    _headerValue.gradeCd = "";
    _headerValue.rsaYn = `Y`;
    _headerValue.advertIdAgreeYn = `Y`;

    _headerValue.os = userLoginObj.headers.os;
    _headerValue.deviceId = userLoginObj.headers.deviceId;
    _headerValue.appVersion = userLoginObj.headers.appVersion;
    _headerValue.osVersion = userLoginObj.headers.osVersion;

    _headerValue.memToken = data.memToken;
    _headerValue.txId = data.txId;
    _headerValue.authKey = data.authKey;

    _headerValue.encMemberId = data.memberId;
    _headerValue.encMemberType = data.memberType;
    _headerValue.gradeNm = data.gradeName;
    _headerValue.encCrId = data.credentialId;
    _headerValue.memTokenExpireTime = data.memTokenExpir;

    _userInfo.isSimpleLogin = "Y"; //고정
    _userInfo.isLoginKeeping = "Y"; //고정

    _userInfo.name = data.name;
    _userInfo.gradeName = data.gradeName;
    _userInfo.authKey = data.authKey;
    _userInfo.phoneNumber = data.phoneNumber;
    _userInfo.tokenId = data.tokenId;
    _userInfo.loyaltyMbrId = data.loyaltyMbrId;
    _userInfo.memTokenTime = data.memTokenTime;
    _userInfo.prevSmsAgreeDate = data.prevSmsAgreeDate;
    _userInfo.terms = data.terms;
    _userInfo.encMsId = data.encMsId;
    _userInfo.smsAgreeYn = data.smsAgreeYn;
    _userInfo.userType = data.userType;
    _userInfo.memEnc = data.memEnc;
    _userInfo.marketingAgree = data.marketingAgree;
    _userInfo.memTokenExpir = data.memTokenExpir;
    _userInfo.credentialId = data.credentialId;
    _userInfo.grade = data.grade;
    _userInfo.memberType = data.memberType;
    _userInfo.cardNo = data.cardNo;
    _userInfo.memberId = data.memberId;
    _userInfo.tokenExpiryDate = data.tokenExpiryDate;
    _userInfo.memToken = data.memToken;
    _userInfo.ollehId = data.ollehId;
    _userInfo.currentPoint = data.currentPoint;
    _userInfo.termsAgreeYn = data.termsAgreeYn;
    _userInfo.isSimpleLogin = data.isSimpleLogin;
    _userInfo.isLoginKeeping = data.isLoginKeeping;

    userLoginObj.userInfo = _userInfo;
    userLoginObj.lastRefreshed = dayjs().format("YYYY-MM-DD HH:mm:ss");
    userLoginObj.headerValue = _headerValue;
    userLoginObj.VITE_userInfo = JSON.stringify(userLoginObj.userInfo);
    userLoginObj.VITE_headerValue = JSON.stringify(userLoginObj.headerValue);
    // VITE_userInfo  VITE_headerValue

    // console.log("🚀 ~ app.get ~ all", all);
    res.json({
      result: "처음!",
      ...userLoginObj,
    });
  })
);



module.exports = router;
