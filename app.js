// pm2 start ecosystem.config.js

const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const cookieparser = require("cookie-parser");
const { v7: uuid } = require("uuid");
const mime = require("mime-types");
// const contentType = require("content-type");
const axios = require("axios");
// const shell = require("shelljs");
const socketioServer = require("socket.io");
const fs = require("fs");
const multer = require("multer");
const http = require("http");

app.use(cookieparser());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // form전송 application/x-www-form-urlencoded 를 파싱해서 req.body에 담아준다

const testKcpRouter = require("./routes/testKcpRouter.js");
app.use("/kcp", testKcpRouter);

const testKtMembershipRouter = require("./routes/testKtMembershipRouter.js");
app.use("/ktmem", testKtMembershipRouter);

const testPingRouter = require("./routes/testPingRouter.js");
app.use("/ping", testPingRouter);

const testJwtRouter = require("./routes/testJwtRouter.js");
app.use("/jwt", testJwtRouter);

// formdata.html 데이터가 어떻게 미들웨어에서처리되나..?
app.all("/howData", function (req, res) {
  const query = req.query; // 쿼리에 붙는거 /aa/bb?a=1&b=2
  const body = req.body;

  res.json({
    title: "@@ GET @@",
    query,
    body,
  });
});

// const upload = multer({ dest: 'testhtml/', limits: { fileSize: 5 * 1024 * 1024 }}) // dest속성을쓰면 파일이름이 난수로, 확장자없이 저장된다
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // images폴더에 아래 filename에서 정의한 이름으로 파일저장
      cb(null, "images/");
    },
    // filename: function (req, file, cb) {
    //   cb(null, file.originalname);
    // },
    filename: (req, file, cb) =>
      cb(null, `${uuid()}.${mime.extension(file.mimetype)}`),
  }),
  verify: (req, res, buf) => {
    req.rawBodyMulter = buf;
    // console.log("🚀 ~ rawBodyMulter", rawBodyMulter);
    req.rawStringMulter = buf.toLocaleString();
    // console.log("🚀 ~ rawStringMulter", rawStringMulter);
  },
});
const uploadFileChat = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      console.log(11111111111111111);
      console.log(11111111111111111);
      console.log(11111111111111111);
      console.log(11111111111111111);

      // images폴더에 아래 filename에서 정의한 이름으로 파일저장
      const pth = path.join(__dirname, "fileChat");
      cb(null, pth);
    },
    filename: function (req, file, cb) {
      console.log(222222222222222222222);
      console.log(222222222222222222222);
      console.log(222222222222222222222);
      console.log(222222222222222222222);

      file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf8",
      );
      cb(null, `${uuid()}-${file.originalname}`);
    },
    // filename: (req, file, cb) => cb(),
  }),
  verify: (req, res, buf) => {
    req.rawBodyMulter = buf;
    // console.log("🚀 ~ rawBodyMulter", rawBodyMulter);
    req.rawStringMulter = buf.toLocaleString();
    // console.log("🚀 ~ rawStringMulter", rawStringMulter);
  },
});

app.get("/fileChatDel", (req, res) => {
  // remove all files in fileChat folder
  fs.readdir("./fileChat", (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join("./fileChat", file), (err) => {
        if (err) throw err;
      });
    }
    res.send("all file del!!");
  });
});

app.get("/fileChatDel/:fileUuid", (req, res) => {
  const filename = req.params.fileUuid;
  const fPath = path.join(__dirname, "fileChat", filename);
  fs.unlink(fPath, (err) => {
    if (err) {
      res.status(500).send("지우다가 에러");
    } else {
      res.send("지웠다 >> " + filename);
    }
  });
});

app.get("/fileChatList", (req, res) => {
  const fPathDir = path.join(__dirname, "fileChat");

  fs.readdir(fPathDir, (err, files) => {
    if (err) {
      console.log("🚀 ~ app.get ~ err", err);
    }
    res.json(files);
  });
});
app.get("/fileChatDown/:fileUuid", (req, res) => {
  const filename = req.params.fileUuid;
  const fPath = path.join(__dirname, "fileChat", filename);
  res.download(fPath, filename, (err) => {
    if (err) {
      console.log("🚀 ~ app.get ~ err", err);
      res.status(500).send("ERR");
    }
  });
});
app.get("/fileChatShow/:fileUuid", (req, res) => {
  const filename = req.params.fileUuid;
  const fPath = path.join(__dirname, "fileChat", filename);

  res.sendFile(fPath, (err) => {
    if (err) {
      console.log("🚀 ~ app.get ~ err", err);
      res.status(500).send("ERR");
    }
  });
});

// ==== Multer 설정 ====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadaa = multer({ storage });

// ==== 업로드 API ====
app.post("/upload", upload.single("myfile"), (req, res) => {
  res.json({ message: "업로드 성공", file: req.file });
});

app.post("/fileChat", uploadFileChat.single("fileChat"), (req, res) => {
  console.log("🚀 ~ app.post ~ req.file", req.file);
  console.log("🚀 ~ app.post ~ req.body", req.body);
  res.send("ok");
});

// 꼭 파일등이 없어도 헤더가 multipart/form-data 라면 multer를 꼭 써야한다(아니면 니가파싱하던가..)
app.post("/formFile", upload.single("avatar"), (req, res) => {
  console.log("🚀 ~ app.post ~ req.file", req.file);
  console.log("🚀 ~ app.post ~ req.body", req.body);
  console.log("🚀 ~ app.post ~ req.body", { ...req.body });

  console.log("------gogo----------gogo----------gogo----");
  console.log("🚀 ~ rawBodyMulter", req.rawBodyMulter);
  console.log("🚀 ~ rawStringMulter", req.rawStringMulter);
  console.log("🚀 ~ app.post ~ req.raw", req.rawBody);
  console.log("🚀 ~ app.post ~ req.rawString", req.rawString);
  console.log("🚀 ~ app.post ~ req.raw1", req.rawBodyJson);
  console.log("🚀 ~ app.post ~ req.rawStringJson", req.rawStringJson);
  console.log("🚀 ~ app.post ~ req.raw2", req.rawBodyUrlEncode);
  console.log("🚀 ~ app.post ~ req.rawStringEncode", req.rawStringEncode);
  console.log("################################################");
  res.json({ req: "succc@@" });
  //
});

app.post("/json", (req, res) => {
  console.log("🚀 ~ app.post ~ req.body", req.body);
  console.log("🚀 ~ app.post ~ req.body", { ...req.body });
  console.log("------gogo----------gogo----------gogo----");
  console.log("🚀 ~ rawBodyMulter", req.rawBodyMulter);
  console.log("🚀 ~ rawStringMulter", req.rawStringMulter);
  console.log("🚀 ~ app.post ~ req.raw", req.rawBody);
  console.log("🚀 ~ app.post ~ req.rawString", req.rawString);
  console.log("🚀 ~ app.post ~ req.raw1", req.rawBodyJson);
  console.log("🚀 ~ app.post ~ req.rawStringJson", req.rawStringJson);
  console.log("🚀 ~ app.post ~ req.raw2", req.rawBodyUrlEncode);
  console.log("🚀 ~ app.post ~ req.rawStringEncode", req.rawStringEncode);
  console.log("################################################");

  res.json({ req: "succc@@" });
});

/**
 * cors막힌서버 대신 proxy해서 콜해주기
 */
app.post("/skipCors", async (req, res) => {
  const body = req.body;
  console.log("🚀 ~ app.post ~ body", body);
  const targetEndPoint = body.endPoint;
  const method = body.method;
  const headerData = body.headerData;
  const bodyData = body.bodyData;

  try {
    const options = {
      url: targetEndPoint,
      method: method,
      headers: headerData,
    };
    console.log("🚀 ~ app.post ~ options", options);
    if (method === "POST") {
      options.data = bodyData;
    }

    const ress = await axios(options);
    console.log("🚀 ~ app.post ~ ress", ress);
    const result = ress.data;
    console.log("🚀 ~ app.get ~ result", result);

    res.json(result);
  } catch (e) {
    console.log("🚀 ~ app.post ~ e", e);
    res.json({ result: "몬가안됨;", err: e });
  }
});

/**
 * 요청한자의 header 보여주기
 */
app.get("/myheader", (req, res) => {
  const headers = req.headers;

  // Create an HTML string with the header values
  let htmlResponse = "<html><body><h1>! Request Header Values</h1><ul>";
  for (const [key, value] of Object.entries(headers)) {
    htmlResponse += `<li><strong>${key}:</strong> ${value}</li>`;
  }
  htmlResponse += "</ul></body></html>";
  htmlResponse += `
    <script>
      fetch("https://ipapi.co/json/")
        .then(rr=>rr.json())
        .then(res=>{
          const city = res.city;
          const country_name = res.country_name;
           
          const li1 = document.createElement("li");
          li1.textContent = "나라 >> " + country_name;

          const li2 = document.createElement("li");
          li2.textContent = "지역 >> " + city;

          const ul = document.getElementsByTagName('ul')[0];
          ul.appendChild(li1);
          ul.appendChild(li2);
        })
    </script>
  
  `;

  // Send the HTML response
  res.send(htmlResponse);
});

/**
 * 페이징 더미 쿼리
 */

app.post("/paging", (req, res) => {
  const count = req.body.count || 13;
  const content = req.body.content || {};
  const { pageNo, dataPerPage } = req.body;

  const dummyData = Array.from({ length: count }, (_, index) => ({
    no: index + 1,
    data: `data${index + 1}`,
    //  ,"noticeSeq": "NOTICE_00000605",
    // "noticeSj": "HUSS서포터즈 모집",
    // "noticeImageCn": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHCAIAAAC6O5sJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAAuSURBVBhXY/iPA4AkVqxY0draCuHDAUgCKMrAgK4Vr1HIAG4sugTcWBxG/f8PALutmZ2F5MgiAAAAAElFTkSuQmCC",
    // "noticeCn": "순천향대 인문사회융합인재양성사업단에서 함께 근무할 서포터즈를 모집할 예정이오니, 관심 있는 학생들의 지원 부탁드립니다. \n\n1. 선발내용\n- 주요업무 : 인문사회융합인재양성사업단 업무 지원 (행사 지원, 행사 홍보)\n- 모집기간 : 공고일 ~ 24.3.15. (금) \n- 근무기간 : 2024학년도 1학기\n- 모집인원 : 총 00명\n\n2. 자격요건\n- 인문사회융합인재양성사업단 소속 학과 재학생\n※   참여학과: 글로벌문화산업학과, 중국학과\n※ 준참여학과: 건축학과, 영미학과, 한국문화콘텐츠학과\n- HUSS융합학부 교육과정(마이크로디그리, 부전공, 복수전공) 신청자 우대 \n\n3. 주요 활동내용\n- 인문사회 융합인재양성사업단의 프로그램 관련 콘텐츠 개발(영상, 포스터 제작, 카드뉴스 등)\n- 인문사회 융합인재양성사업단 온라인 및 오프라인 홍보활동\n- 인문사회 융합인재양성사업단 사업 운영 지원\n- 기타 인문사회 융합인재양성사업단 업무 지원\n- 인문사회 융합인재양성사업단의 프로그램(교과, 비교과) 참여 활동\n\n4. 서류제출\n- 제출기한 : 2024.3.15.(금) 16시\n- 제출방법 : 이메일 (hjh2023@sch.ac.kr)로 신청서 및 융합교육과정신청서 제출\n\n5. 문의\n- 순천향대학교 인문사회융합인재양성사업단(041-530-1134, 오픈카톡: 순천향대_인사융합사업단, 유니토피아관 1112호)",
    // "fileSeq": "FILE_00000323",
    // "userNm": "관리자",
    // "inquireCo": 412,
    // "registDt": "2024-03-04",
    // "updtDt": "2024-03-05"
    ...content,
  }));

  console.log("🚀 ~ app.post ~ req.body:", req.body);
  const currentPage = parseInt(pageNo);
  const perPage = parseInt(dataPerPage);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  const paginatedData = dummyData.slice(startIndex, endIndex);

  res.json({
    data: {
      list: paginatedData,
      totalCount: dummyData.length,
      pageNo: pageNo,
      dataPerPage,
    },
  });
});

// app.use(express.raw({
//   // 한번 파싱한타입으로는 파싱앙대는거 같기도하공...
//   type: 'application/json', //'application/*+json' 'application/vnd.custom-type'
//   verify: (req, res, buf) => {
//     console.log("🚀 ~ raw", buf.toLocaleString());
//     req.rawBody = buf;
//     req.rawString = buf.toLocaleString();
//   }
// }))

// app.use(
//   express.json({
//     verify: (req, res, buf) => {
//       // console.log("🚀 ~ json");

//       req.rawBodyJson = buf;
//       req.rawStringJson = buf.toLocaleString();
//     },
//   })
// );
// app.use(
//   express.urlencoded({
//     verify: (req, res, buf) => {
//       req.rawBodyUrlEncode = buf;
//       req.rawStringEncode = buf.toLocaleString();
//     },
//   })
// );

// app.use(
//   cors({
//     origin: "*", // 출처 허용 옵션
//     // credential: "true", // 사용자 인증이 필요한 리소스(쿠키 ..등) 접근
//   })
// );

// app.use((req, res, next) => {
//   //get request route
//   const route = req.originalUrl;
//   const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
//   // console.log("🚀 ~ app.use ~ fullUrl", fullUrl);
//   // console.log("🚀 ~ app.use ~ route", route);
//   next();
// });

// 이하 http expresss 서버! + websocket 서버 - 9000포트
// 이하 http expresss 서버! + websocket 서버 - 9000포트
// 이하 http expresss 서버! + websocket 서버 - 9000포트
// 이하 http expresss 서버! + websocket 서버 - 9000포트

const WEBSERVER_PORT = 19000;
const httpServer = http.createServer(app);

const resultServer = httpServer.listen(WEBSERVER_PORT, (hello) => {
  console.log("process.env.LANG >> " + process.env.LANG);
  console.log(`기본 웹서버 port http://localhost:${WEBSERVER_PORT}`);
});

const iohttp = socketioServer(resultServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

iohttp.on("connection", (clientSocket) => {
  clientSocket.emit("WER");
  clientSocket.on("chatClear", (_) => {
    chatMessage.clearAllChatLi();
  });
  clientSocket.on("removeChatLi", (num) => {
    chatMessage.removeChatLi(num);
    clientSocket.emit("all-chat", chatMessage.getAllChatLi());
  });

  clientSocket.on("chat", (chatMsg) => {
    // chatLi.push(chatMsg);
    chatMessage.pushChatLi(chatMsg);
    iohttp.emit("chat", chatMsg);
  });
  // clientSocket.emit("all-chat", chatLi);
  clientSocket.emit("all-chat", chatMessage.getAllChatLi());
});

/**
 * WebRTC용 https 소켓 서버 제작
 */
const tmpEx = express();
tmpEx.use(cors());
tmpEx.use(express.static(path.join(__dirname, "socketio")));
tmpEx.use(express.json());

const httpsServer = require("https").createServer(
  {
    key: fs.readFileSync(
      // "C:\\Users\\siha1\\Desktop\\project\\private\\playground\\js-playground\\.vscode\\lo.cal.com\\lo.cal.com.key"
      path.join(__dirname, "socketio", "lo.cal.com.key"),
    ),
    cert: fs.readFileSync(
      // "C:\\Users\\siha1\\Desktop\\project\\private\\playground\\js-playground\\.vscode\\lo.cal.com\\lo.cal.com.crt"
      path.join(__dirname, "socketio", "lo.cal.com.crt"),
    ),
  },
  tmpEx,
);
// const httpsServer = require("http").createServer(tmpEx)

const WEBRTC_SOCKETIO_PORT = 19001;
httpsServer.listen(WEBRTC_SOCKETIO_PORT, () => {
  console.log(
    "소켓 io 전용 https 서버...",
    `https://localhost:${WEBRTC_SOCKETIO_PORT}`,
  );
});
const io = socketioServer(httpsServer);
io.on("connection", (clientSocket) => {
  clientSocket.on("sdpOffer", (sessionDescription) => {
    console.log("sdpOffer");
    clientSocket.broadcast.emit("sdpOffer", sessionDescription);
  });
  clientSocket.on("sdpAnswer", (sessionDescription) => {
    console.log("sdpAnswer");
    clientSocket.broadcast.emit("sdpAnswer", sessionDescription);
  });

  clientSocket.on("candi", (candi) => {
    console.log("candi");
    clientSocket.broadcast.emit("candi", candi);
  });

  clientSocket.on("join", (roomNm, cb) => {
    clientSocket.join(roomNm);

    const userCount = io.sockets.adapter.rooms.get(roomNm)?.size;
    cb(userCount);
    clientSocket;
  });

  clientSocket.on("ranNum", (roomNm, cb) => {
    clientSocket.join(roomNm);

    const userCount = io.sockets.adapter.rooms.get(roomNm)?.size;
    cb(userCount);
    clientSocket;
  });
});

/**
 * ws 이용한 rtsp 송출 서버
 * ws 이용한 rtsp 송출 서버
 * ws 이용한 rtsp 송출 서버
 */
const RTSP_PORT = 19002;
const tmpExx = express();
const tmpS = http.createServer(tmpExx);

// let chatLi = [];

class ChatMessage {
  chatLi = [];

  constructor() {
    // load from file chatLi.txt if exists
    const filePath = path.join(__dirname, "chatLi.txt");
    console.log("🚀 ~ ChatMessage ~ constructor ~ filePath:", filePath);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }

    const data = fs.readFileSync(filePath, "utf8");
    try {
      this.chatLi = JSON.parse(data);
    } catch (e) {
      this.chatLi = [];
    }
  }

  getAllChatLi() {
    return this.chatLi;
  }
  clearAllChatLi() {
    this.chatLi = [];
    // save to file chatLi.txt
    const filePath = path.join(__dirname, "chatLi.txt");
    fs.writeFileSync(filePath, JSON.stringify(this.chatLi));
  }
  pushChatLi(msg) {
    this.chatLi.push(msg);
    // save to file chatLi.txt
    const filePath = path.join(__dirname, "chatLi.txt");
    fs.writeFileSync(filePath, JSON.stringify(this.chatLi));
  }
  removeChatLi(_num) {
    const num = _num - 1;
    this.chatLi.splice(num, 1);
    // save to file chatLi.txt
    const filePath = path.join(__dirname, "chatLi.txt");
    fs.writeFileSync(filePath, JSON.stringify(this.chatLi));
  }
}

const chatMessage = new ChatMessage();

tmpS.listen(RTSP_PORT, () => {
  console.log("ws 이용한 rtsp송출서버 PORT ->" + `ws://localhost:${RTSP_PORT}`);
});

const { VideoStream } = require("./lib/ws-rtsp/video-stream.js");

const streamer = new VideoStream({
  debug: !true,
  wsPort: RTSP_PORT,
  ffmpegPath: "ffmpeg",
  ffmpegArgs: {
    "-b:v": "2048K",
    "-an": "",
    "-r": "24",
  },
});
streamer.start(tmpS);
