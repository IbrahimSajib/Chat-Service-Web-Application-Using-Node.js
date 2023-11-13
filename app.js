const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);
const SocketIOFile = require("socket.io-file");
const path = require("path");
const uuid = require("uuid");

app.use(express.static(__dirname + "/www"));

var rooms = ["Public", "WADA", "C#"];
var users = [];
io.on("connection", (socket) => {
     console.log("Someone connected");
     var uploader = new SocketIOFile(socket, {
          uploadDir: "www\\data", 
          accepts: [
               "audio/mpeg",
               "video/x-msvideo",
               "video/webm",
               "audio/mp3",
               "image/jpeg",
               "image/png",
               "image/gif",
               "application/pdf",
               "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
               "application/vnd.ms-powerpoint",
               "application/vnd.openxmlformats-officedocument.presentationml.presentation",
               "application/rtf",
               "application/vnd.rar",
               "text/plain",
               "application/zip",
               "application/x-zip-compressed"
          ], 
          maxFileSize: 4194304, 
          chunkSize: 10240, 
          transmissionDelay: 0,
          overwrite: false,
          rename: function (filename, fileInfo) {
               var file = path.parse(filename);
               var fname = uuid.v4(); 
               var ext = file.ext;
               return `${fname}${ext}`;
          },
     });

     socket.on("addme", (uname) => {
          console.log(uname);
          socket.username = uname;
          socket.emit("init", { user: uname, rooms: rooms });
     });
     socket.on("join", (g) => {
          var u = users.find((v, i) => v.user == socket.username);
          if (u) {
               var oldG = u.currentGroup;
               socket.leave(u.currentGroup);
               u.currentGroup = g;
               socket.join(g);
               io.to(oldG).emit(
                    "userlist",
                    users
                         .filter((v, i) => v.currentGroup == oldG)
                         .map((v, i) => v.user)
               );
               socket.emit("leaveSuccess", {
                    from: "",
                    msg: `${socket.username} left the group ${oldG}`,
               });
          } else {
               socket.join(g);
               users.push({ user: socket.username, currentGroup: g });
               socket.emit("joinSuccess", {
                    from: "",
                    msg: `${socket.username} joined the group ${g}`,
               });
               
          }
          io.to(g).emit(
               "userlist",
               users.filter((v, i) => v.currentGroup == g).map((v, i) => v.user)
          );

     });
     socket.on("disconnecting", () => {
          var u = users.find((v, i) => v.user == socket.username);

          if (u) {
               socket.leave(u.currentGroup);
               var i = users.findIndex((v, i) => v.user == socket.username);
               users.splice(i, 1);
               io.to(u.currentGroup).emit(
                    "userlist",
                    users
                         .filter((v, i) => v.currentGroup == u.currentGroup)
                         .map((v, i) => v.user)
               );
          }
     });
     socket.on('send', m=>{
          var u = users.find((v, i) => v.user == socket.username);
          if(u){
               io.to(u.currentGroup).emit('message', {from:socket.username, msg: m});
          }
     });
     socket.on("disconnect", () => {
          console.log("disconnected");
     });
 
     uploader.on("start", (fileInfo) => {
          console.log("Start uploading");
          console.log(fileInfo);
     });
     uploader.on("stream", (fileInfo) => {
          console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
     });
     uploader.on("complete", (fileInfo) => {
          console.log("Upload Complete.");
          console.log(fileInfo);
          var u = users.find((v, i) => v.user == socket.username);
          if(u) {
              io.to(u.currentGroup).emit( 
                   'uploaded', 
              {
                   from:socket.username, 
                    msg: `File uploaded: <a target='_blank' href='./data/${fileInfo.name}'><i class="fa fa-arrow-circle-down" aria-hidden="true"></i><a>`}
               );
          }
     });
     uploader.on("error", (err) => {
          console.log("Error!", err);
     });
     uploader.on("abort", (fileInfo) => {
          console.log("Aborted: ", fileInfo);
     });
}); 

httpServer.listen(5656, () => {
    console.log("Server running at http://localhost:5656");
});
