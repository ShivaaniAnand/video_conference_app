let conn = null;
let call = null;
let mystream = null;
let name = null;
let peer = null; //new Peer(Math.floor(Math.random() * 2 ** 18).toString(36));

document.getElementById("disconnect").disabled = true;
document.getElementById("clrmsg").disabled = true;
document.getElementById("onlyvideo").disabled = true;
document.getElementById("chat-msg").disabled = true;
document.getElementById("chat-send").disabled = true;

const land_name = document.getElementById("land-name");
land_name.addEventListener("keyup", (event) => {
  name = land_name.value.trim();
  if (event.keyCode === 13 && name != "") {
    peer = new Peer(`${name}${Math.floor(Math.random() * 2 ** 8)}`);
    document.getElementById("chat-name").innerHTML = `${name} (id: ${peer.id})`;
    document.getElementById("land-name-div").style.display = "none";
    land_name.value = "";
    init();
  }
});
let remoteid = null;
let currentPear = null;
let isaudio = true;
let isvideo = true;
let toggleNav = false;

const sharescreen = document.getElementById("sharescreen");
const videoframe = document.getElementById("video-call-div");
const cover = document.getElementById("cover");
const connecttopeer = document.getElementById("connectpeer");
const input_remote_id = document.getElementById("inputremoteid");
const main_chat_input = document.getElementById("chat-msg");

// init function to initialize the peer and start listening on events
function init() {
  peer.on("open", (id) => {
    console.log(`connected to peer server with id: ${id}`);
  });
  peer.on("connection", (c) => {
    document.getElementById("reconnect").style.display = "none";
    document.getElementById("disconnect").disabled = false;
    document.getElementById("clrmsg").disabled = false;
    document.getElementById("onlyvideo").disabled = false;
    document.getElementById("chat-msg").disabled = false;
    document.getElementById("chat-send").disabled = false;
    conn = c;
    cover.style.display = "none";
    document.getElementById(
      "chat-name"
    ).innerHTML = `connected with: ${conn.peer}`;
    remoteid = conn.peer;
    ready();
  });
  peer.on("call", (c) => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        videoframe.style.display = "inline";
        mystream = stream;
        addLocalVideo(stream);
        c.answer(stream);
        c.on("stream", (remoteStream) => {
          addRemoteVideo(remoteStream);
          currentPear = c.peerConnection;
          call = c;
          console.log(call.peer, c.peer);
        });
      })
      .catch((err) => {
        console.log(err);
      });

    c.on("close", () => {
      mystream.getVideoTracks()[0].enabled = false
      videoframe.style.display = "none";
      c.close();
    });
  });
  peer.on("close", function () {
    console.log("connection closed");
    mystream = null;
  });
  peer.on("error", function (err) {
    switch (err.type) {
      case "peer-unavailable":
        alert("Entered ID Doesnt Exist or invalid, pls re-enter");
        document.getElementById("connect-with-someone").click();
        document.getElementById("reconnect").style.display = "inline";
        document.getElementById("disconnect").disabled = true;
        document.getElementById("clrmsg").disabled = true;
        document.getElementById("onlyvideo").disabled = true;
        document.getElementById("chat-msg").disabled = true;
        document.getElementById("chat-send").disabled = true;
        break;
      case "unavailable-id":
        alert("ID not found or unavailable pls try again");
        location.reload();
        break;
      default:
        alert("Invalid ID");
        location.reload();
    }
  });
}

connecttopeer.addEventListener("click", () => {
  remoteid = input_remote_id.value;
  remoteid = remoteid.trim();
  if (remoteid != "") {
    joinChat(remoteid);
    cover.style.display = "none";
  }
});

//handling calls

const videobtn = document.getElementById("onlyvideo");
videobtn.addEventListener("click", () => {
  let isaudio = true;
  let isvideo = true;
  videoframe.style.display = "inline";
  startvideocall(remoteid);
});
function startvideocall(id) {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      mystream = stream;
      addLocalVideo(stream);
      call = peer.call(id, stream);
      call.on("stream", (remoteStream) => {
        addRemoteVideo(remoteStream);
        currentPear = call.peerConnection;
        callstart(call);
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

function callstart(call) {
  console.log(call.peer);
  call.on("close", () => {
    mystream.getVideoTracks()[0].enabled = false
    videoframe.style.display = "none";
    call.close();
  });
}

function addRemoteVideo(stream) {
  document.getElementById("remote-video").srcObject = stream;
}

function addLocalVideo(stream) {
  document.getElementById("local-video").srcObject = stream;
}

function muteaudio() {
  isaudio = !isaudio;
  mystream.getAudioTracks()[0].enabled = isaudio;
  if (isaudio == false) {
    document.getElementById("mute-audio").innerHTML =
      "<i class='fas fa-microphone-slash'></i>";
  } else {
    document.getElementById("mute-audio").innerHTML =
      "<i class='fas fa-microphone'></i>";
  }
}
function mutevideo() {
  isvideo = !isvideo;
  mystream.getVideoTracks()[0].enabled = isvideo;
  if (isvideo == false) {
    document.getElementById("mute-video").innerHTML =
      "<i class='fas fa-video-slash'></i>";
  } else {
    document.getElementById("mute-video").innerHTML =
      "<i class='fas fa-video'></i>";
  }
}

//for scrnshare
sharescreen.addEventListener("click", (e) => {
  navigator.mediaDevices
    .getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    .then((stream) => {
      let videoTrack = stream.getVideoTracks()[0];
      videoTrack.onended = () => {
        stopScreenShare();
      };
      let sender = currentPear.getSenders().find((s) => {
        return s.track.kind == videoTrack.kind;
      });
      sender.replaceTrack(videoTrack);
    })
    .catch((err) => {
      alert("your device doesnt support screen share");
    });
});

function stopScreenShare() {
  let videoTrack = mystream.getVideoTracks()[0];
  let sender = currentPear.getSenders().find((s) => {
    return s.track.kind == videoTrack.kind;
  });
  sender.replaceTrack(videoTrack);
}

function endcall() {
  let isaudio = true;
  let isvideo = true;

  videoframe.style.display = "none";
  call.close();
}

function openCloseNav() {
  toggleNav = !toggleNav;
  if (toggleNav == false) {
    document.getElementById("mySidenav").style.width = "0";
  } else {
    document.getElementById("chat").className = "fas fa-comment-alt";
    document.getElementById("mySidenav").style.width = "300px";
  }
}

function closeNav() {
  toggleNav = false;
  document.getElementById("mySidenav").style.width = "0";
}

const disconnectchatbtn = document.getElementById("disconnect");
const clearchat = document.getElementById("clrmsg");
const msginput = document.getElementById("chat-msg");
const msginput_incall = document.getElementById("chat_input_incall");
const sendbtn = document.getElementById("chat-send");
const chatbdy = document.getElementById("chat-target");
const chatbody = document.getElementById("chat-body");

clearchat.addEventListener("click", () => {
  chatbdy.innerHTML = "";
  chatbody.innerHTML = "";
});

disconnectchatbtn.addEventListener("click", () => {
  alert("disconnected with peer");
  conn.close();
  location.reload();
});

msginput.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    sendbtn.click();
    msginput.value = "";
    console.log(remoteid);
  }
});

sendbtn.onclick = () => {
  if (msginput.value != "") {
    let m = msginput.value;
    m = m.trim();
    if (m != "") {
      msginput.value = "";
      addmsglocal(m);
      addmsglocalmain(m);
      conn.send(m);
      chatbdy.scrollTo(0, chatbdy.scrollHeight);
      chatbody.scrollTo(0, chatbody.scrollHeight);
    }
  }
};

msginput_incall.addEventListener("keypress", (event) => {
  if (event.keyCode === 13) {
    document.getElementById("send").click();
    msginput_incall.value = "";
  }
});
document.getElementById("send").onclick = () => {
  if (msginput_incall.value != "") {
    let m = msginput_incall.value;
    m = m.trim();
    if (m != "") {
      msginput_incall.value = "";
      addmsglocal(m);
      addmsglocalmain(m);
      conn.send(m);
      chatbdy.scrollTo(0, chatbdy.scrollHeight);
      chatbody.scrollTo(0, chatbody.scrollHeight);
    }
  }
};
function addmsglocal(msg) {
  let now = new Date();
  let h = now.getHours();
  let m = addZero(now.getMinutes());
  let s = addZero(now.getSeconds());

  function addZero(t) {
    if (t < 10) t = "0" + t;
    return t;
  }

  let msgbody =
    '<br><div class="msg"><div class="msg-head">' +
    '<span class="name">' +
    "YOU" +
    "</span>" +
    '<span class="time">' +
    h +
    ":" +
    m +
    "</span></div>" +
    '<div class="msg-body">' +
    msg +
    "</div></div>";

  chatbody.innerHTML = chatbody.innerHTML + msgbody;
}

function addmsglocalmain(msg) {
  let now = new Date();
  let h = now.getHours();
  let m = addZero(now.getMinutes());
  let s = addZero(now.getSeconds());

  function addZero(t) {
    if (t < 10) t = "0" + t;
    return t;
  }

  let msgbody =
    '<br><div class="msg-main"><div class="msg-head-main">' +
    '<span class="name-main">' +
    "YOU" +
    "</span>" +
    '<span class="time-main">' +
    h +
    ":" +
    m +
    "</span></div>" +
    '<div class="msg-body-main">' +
    msg +
    "</div></div><br>";

  chatbdy.innerHTML = chatbdy.innerHTML + msgbody;
}

function addmsgremote(msg) {
  let now = new Date();
  let h = now.getHours();
  let m = addZero(now.getMinutes());
  let s = addZero(now.getSeconds());

  function addZero(t) {
    if (t < 10) t = "0" + t;
    return t;
  }

  let msgbody =
    '<br><div class="msg-remote"><div class="msg-head">' +
    '<span class="name">' +
    `${remoteid}` +
    "</span>" +
    '<span class="time">' +
    h +
    ":" +
    m +
    "</span></div>" +
    '<div class="msg-body-remote">' +
    msg +
    "</div></div>";

  chatbody.innerHTML = chatbody.innerHTML + msgbody;
}

function addmsgremotemain(msg) {
  let now = new Date();
  let h = now.getHours();
  let m = addZero(now.getMinutes());
  let s = addZero(now.getSeconds());

  function addZero(t) {
    if (t < 10) t = "0" + t;
    return t;
  }

  let msgbody =
    '<br><div class="msg-remote-main"><div class="msg-head-main">' +
    '<span class="name-main">' +
    `${remoteid}` +
    "</span>" +
    '<span class="time-main">' +
    h +
    ":" +
    m +
    "</span></div>" +
    '<div class="msg-body-remote-main">' +
    msg +
    "</div></div>";

  chatbdy.innerHTML = chatbdy.innerHTML + msgbody;
}

function joinChat(id) {
  conn = peer.connect(id, {
    reliable: true,
  });

  conn.on("open", () => {
    document.getElementById(
      "chat-name"
    ).innerHTML = `connected with: ${conn.peer}`;
    document.getElementById("reconnect").style.display = "none";
    document.getElementById("disconnect").disabled = false;
    document.getElementById("clrmsg").disabled = false;
    document.getElementById("onlyvideo").disabled = false;
    document.getElementById("chat-msg").disabled = false;
    document.getElementById("chat-send").disabled = false;
  });

  conn.on("data", (data) => {
    if (toggleNav == false) {
      document.getElementById("chat").className = "fas fa-comment-alt jiggle";
    }
    addmsgremote(data);
    addmsgremotemain(data);
    chatbdy.scrollTo(0, chatbdy.scrollHeight);
    chatbody.scrollTo(0, chatbody.scrollHeight);
  });
  conn.on("close", () => {
    alert("connection closed");
    location.reload();
  });
}

function ready() {
  conn.on("data", (data) => {
    if (toggleNav == false) {
      document.getElementById("chat").className = "fas fa-comment-alt jiggle";
    }
    addmsgremote(data);
    addmsgremotemain(data);
    chatbdy.scrollTo(0, chatbdy.scrollHeight);
    chatbody.scrollTo(0, chatbody.scrollHeight);
  });
  conn.on("close", () => {
    alert("connection closed");
    location.reload();
  });
}
