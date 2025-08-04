// 신규옮긴서버로감

const { Client } = require("ssh2");
const ClientSFTP = require("ssh2-sftp-client");
const path = require("path");
const readline = require("readline");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let onlyFile = !true; // 파일 옮기기만하고 remoteCommand 안할때 true

// Configuration
const localDir = __dirname;
const remoteDir = "/home/ubuntu/sjhtest";
const remoteCommand = "cd /home/ubuntu/sjhtest && pm2 restart sjhtest";
const remoteHost = "petnyang.shop"; // 134.185.109.113
const remoteUser = "ubuntu";
// const remotePass = "eoqkr!@34";
// const remotePort = 9022;

// Initialize SFTP client
const sftp = new ClientSFTP();

// Connect to remote server via SFTP
sftp
  .connect({
    host: remoteHost,
    username: remoteUser,
    // password: remotePass,
    privateKey: require("fs").readFileSync(
      path.join("C:\\Users\\user\\.ssh\\aws-ubuntu.pem")
    ),
  })
  .then(() => {
    console.log("Connected to remote server via SFTP");

    // Upload local directory to remote server
    sftp
      .uploadDir(localDir, remoteDir)
      .then(() => {
        console.log("Directory uploaded to remote server");

        if (onlyFile) {
          sftp.end();
          process.exit(0);
          return;
        }
        // Initialize SSH client
        const conn = new Client();

        // // Connect to remote server via SSH
        conn
          .on("ready", () => {
            console.log("Connected to remote server via SSH");
            // Execute command on remote server
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
            privateKey: require("fs").readFileSync(
              path.join("C:\\Users\\user\\.ssh\\aws-ubuntu.pem")
            ),
            // password: remotePass,
          });
      })
      .catch((err) => {
        console.error(err.message);
        sftp.end();
      });
  })
  .catch((err) => {
    console.error(err.message);
  });
