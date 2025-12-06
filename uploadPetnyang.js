const { Client } = require("ssh2");
const ClientSFTP = require("ssh2-sftp-client");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let onlyFile = true; // 파일 옮기기만하고 remoteCommand 안할때 true

// Configuration
const localDir = __dirname;
const remoteDir = "/home/ubuntu/sjhtest";
const remoteCommand = "cd /home/ubuntu/sjhtest && pm2 restart sjhtest";
const remoteHost = "sjhtest.petnyang.shop"; // 134.185.109.113
const remoteUser = "ubuntu";
// const remotePass = "eoqkr!@34";
// const remotePort = 9022;
const skipList = [".git", "node_modules", "chatLi.txt"]; // 제외할 폴더명/파일명 리스트

// Initialize SFTP client
const sftp = new ClientSFTP();

// 재귀로 파일 리스트와 크기 얻는 함수
async function getFiles(dir) {
  let files = [];
  const list = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const d of list) {
    const fullPath = path.join(dir, d.name);
    if (d.isDirectory()) {
      files = files.concat(await getFiles(fullPath));
    } else if (d.isFile()) {
      const stat = await fs.promises.stat(fullPath);
      files.push({ path: fullPath, size: stat.size });
    }
  }
  return files;
}

// 디렉터리 업로드 + 퍼센트 표시 함수
async function uploadDirWithProgress(localDir, remoteDir) {
  const files = await getFiles(localDir);
  console.log("🚀 ~ uploadDirWithProgress ~ files:", files.length);

  // skipList에 포함된 파일 제외
  const filteredFiles = files.filter(({ path: filePath }) => {
    return !skipList.some((skipItem) => filePath.includes(skipItem));
  });
  console.log(
    "🚀 ~ uploadDirWithProgress ~ filteredFiles:",
    filteredFiles.length
  );

  const totalSize = filteredFiles.reduce((acc, f) => acc + f.size, 0);
  console.log("🚀 ~ uploadDirWithProgress ~ totalSize:", totalSize);
  let uploadedSize = 0;

  for (const file of filteredFiles) {
    const relativePath = path.relative(localDir, file.path);
    const remoteFilePath = path.posix.join(
      remoteDir,
      relativePath.split(path.sep).join("/")
    );

    try {
      await sftp.mkdir(path.posix.dirname(remoteFilePath), true);
    } catch {}

    await sftp.fastPut(file.path, remoteFilePath, {
      step(transferred, chunk, total) {
        const currentUploaded = uploadedSize + transferred;
        const percent = ((currentUploaded / totalSize) * 100).toFixed(2);
        process.stdout.write(`\r업로드 진행률: ${percent}%`);
      },
    });

    uploadedSize += file.size;
  }

  console.log("\n업로드 완료");
}

// 실행부: connect 후 uploadDirWithProgress 호출, 기존 로직 유지
sftp
  .connect({
    host: remoteHost,
    username: remoteUser,
    // password: remotePass,
    privateKey: fs.readFileSync(
      path.join("C:\\Users\\user\\.ssh\\aws-ubuntu.pem")
    ),
  })
  .then(async () => {
    console.log("Connected to remote server via SFTP");

    await uploadDirWithProgress(localDir, remoteDir);

    if (onlyFile) {
      sftp.end();
      process.exit(0);
      return;
    }

    // SSH 연결 및 명령 실행
    const conn = new Client();

    conn
      .on("ready", () => {
        console.log("Connected to remote server via SSH");
        conn.exec(remoteCommand, (err, stream) => {
          if (err) throw err;

          stream
            .on("close", (code, signal) => {
              console.log(
                `Command executed on remote server with code ${code}`
              );
              sftp.end();
              conn.end();
            })
            .on("data", (data) => {
              console.log(data.toString());
            })
            .stderr.on("data", (data) => {
              console.error(data.toString());
            });
        });
      })
      .connect({
        host: remoteHost,
        // port: remotePort,
        username: remoteUser,
        privateKey: fs.readFileSync(
          path.join("C:\\Users\\user\\.ssh\\aws-ubuntu.pem")
        ),
        // password: remotePass,
      });
  })
  .catch((err) => {
    console.error(err.message);
  });
