$(document).ready(() => {
    $(".closebtn").click(() => {
      $("#side-nav").animate({ width: "0px" }, 300);
    });
    $(".icon").click(() => {
      $("#side-nav").animate({ width: "250px" }, 300);
    });

    $("#displayname").hide();
    $("#nameinput").hide();
    $("#rooms").hide();
    $("#messages").hide();
    var socket = io.connect("http://localhost:5656");
    socket.on("connect", () => {
      console.log("connected");
      $("#nameinput").show();
    });
    socket.on("init", (data) => {
      $("#nameinput").hide();
      $("#uname").html(data.user);
      $("#displayname").show();
      $("#gnames").empty();
      data.rooms.forEach((v) => {
        $("#gnames").append(`<option value='${v}'>${v}</option>`);
      });
      $("#gnames").append(
        `<option value="" selected>Select group</option>`
      );
      $("#rooms").show();
    });
    socket.on("joinSuccess", (m) => {
      $("#messages").show();
      $("#nameinput").hide();
    });
    socket.on("leaveSuccess", (m) => {
      $("#users").empty();
      $("#conversation").empty();
    });
    socket.on("userlist", (users) => {
      var uname = $("#uname").html();
      $("#users").empty();
      users.forEach((v, i) => {
        if (v == uname)
          $("#users").append(`<li class="l-group-i active">${v}</li>`);
        else $("#users").append(`<li class="l-group-i">${v}</li>`);
      });
    });
    socket.on('message', data=>{
      var uname = $("#uname").html();
      if(data.from == uname){
        $('#conversation').append(`<li class="l-group-i active">You: ${data.msg}</li>`);
      }
      else{
        $('#conversation').append(`<li class="l-group-i">${data.from}: ${data.msg}</li>`);
      }
    });
    socket.on('uploaded', data=>{
      var uname = $("#uname").html();
      if(data.from != uname){
     
        $('#conversation').append(`<li class="l-group-i">${data.from}: ${data.msg}</li>`);
      }
    });
    var uploader = new SocketIOFileClient(socket);
    var form = document.getElementById("form");
    uploader.on("start", function (fileInfo) {
      console.log("Start uploading", fileInfo);
    });
    uploader.on("stream", function (fileInfo) {
      console.log("Streaming... sent " + fileInfo.sent + " bytes.");
    });
    uploader.on("complete", function (fileInfo) {
      console.log("Upload Complete", fileInfo);
      $('#conversation').append(`<li class="l-group-i active">You: You uploaded: ${fileInfo.originalFileName}</li>`);
    });
    uploader.on("error", function (err) {
      console.log("Error!", err);
    });
    uploader.on("abort", function (fileInfo) {
      console.log("Aborted: ", fileInfo);
    });
    $("#connect").click(() => {
      if ($("#dname").val() != "") {
        socket.emit("addme", $("#dname").val());
      }
    });

    $("#join").click(() => {
      if ($("#gnames").val() != "") socket.emit("join", $("#gnames").val());
    });
    $("#send").click(()=>{
       if($("#msg").val() != ""){
         socket.emit('send', $("#msg").val());
         $("#msg").val('');
       }
    });
    $("#upload").click(() => {
      $("#file").trigger("click");
    });
    $("#file").change(() => {
      var fileEl = document.getElementById("file");
      var uploadIds = uploader.upload(fileEl);
    });
  });