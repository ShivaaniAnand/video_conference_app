{
  //Connection variables below
  /**
   * conn: used to start a data connection channel to the destination peer.
   * call: used to start a media connection to the destination peer.
   * mystream: local stream.
   * peer: creates a WebRTC peer connection object
   */
  let conn = null;
  let call = null;
  let mystream = null;
  let name = null;
  let peer = null;

  document.getElementById("disconnect").disabled = true;
  document.getElementById("clrmsg").disabled = true;
  document.getElementById("onlyvideo").disabled = true;
  document.getElementById("chat-msg").disabled = true;
  document.getElementById("chat-send").disabled = true;

  //user input has been taken below and used to generte a unique id below.

  const land_name = document.getElementById("land-name");
  land_name.addEventListener("keyup", (event) => {
    name = land_name.value.trim();
    if (event.keyCode === 13 && name != "") {
      peer = new Peer(`${name}${Math.floor(Math.random() * 2 ** 8)}`); //name converted to unique id and stored in peer object.
      document.getElementById("chat-name").innerHTML = `${name} (id: ${peer.id})`;
      document.getElementById("land-name-div").style.display = "none";
      land_name.value = "";
      init();
    }
  });


  /**
   * remoteid: stores remote peer id taken from input.
   * currentPear: WebRTC object  created on local peer.
   */
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


  // to initialize the peer and start listening WebRTC peer events below
  function init() {
    peer.on("open", (id) => { //listens to open events which starts once peer is successfully connected to the signalling sever.
      console.log(`connected to peer server with ID: ${id}`);
    });
    peer.on("connection", (c) => { //listents to incoming connection events from remote peer.
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
      ready(); // initializes remote peer listening
    });
    peer.on("call", (c) => { // listens to incoming call events from remote peer.
      document.getElementById("mute-audio").innerHTML =
        "<i class='fas fa-microphone'></i>"
      document.getElementById("mute-video").innerHTML =
        "<i class='fas fa-video'></i>"
      navigator.mediaDevices //gets user media stream from remote
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => { //stores into stream object through a promise
          videoframe.style.display = "inline";
          mystream = stream;
          addLocalVideo(stream); //adds remote peer stream to local stream
          c.answer(stream); //sends answer to requested offer
          c.on("stream", (remoteStream) => { //listens to incoming stream event from local peer
            addRemoteVideo(remoteStream); //adds local stream to remote peer.
            currentPear = c.peerConnection; //initializes a WebRTC peer object for remote stream
            call = c;
          });
        })
        .catch((err) => { //catches the error in promise
          console.log(err);
        });

      c.on("close", () => { //closes the media connection on close event
        mystream.getVideoTracks()[0].disabled = true
        videoframe.style.display = "none";
        c.close();
      });
    });
    peer.on("close", function () { //disconnects the peer connection object on the close event
      console.log("connection closed");
    });

    peer.on("error", function (err) { //different errors encountered
      switch (err.type) {
        case "peer-unavailable": //error occurred when a remote peer id entered does not connect
          alert("Entered ID Doesnt Exist or is invalid.\n Please re-enter");
          document.getElementById("connect-with-someone").click();
          document.getElementById("reconnect").style.display = "inline";
          document.getElementById("disconnect").disabled = true;
          document.getElementById("clrmsg").disabled = true;
          document.getElementById("onlyvideo").disabled = true;
          document.getElementById("chat-msg").disabled = true;
          document.getElementById("chat-send").disabled = true;
          break;
        case "unavailable-id": //error occurred when id entered is not found
          alert("ID not found or Unavailable.\n Please try again");
          location.reload();
          break;
        case "webrtc": //SDP transaction error or ICE candidate not found
          alert("please enter peer's ID")
          document.getElementById("connect-with-someone").click();
          document.getElementById("reconnect").style.display = "inline";
          document.getElementById("disconnect").disabled = true;
          document.getElementById("clrmsg").disabled = true;
          document.getElementById("onlyvideo").disabled = true;
          document.getElementById("chat-msg").disabled = true;
          document.getElementById("chat-send").disabled = true;
          break
        case "browser-incompatible": //when the client's browser does not support some or all WebRTC features
          alert("Browser incompatible.Please switch to Chrome")
          location.reload();
          break;
        case "network": //lost or cannot establish a connection to the signalling server
          alert("Network connection lost.")
          peer.reconnect();
          break;
        case "invalid-id": //when the id contains illegal characters
          alert("Invalid ID")
          location.reload();
          break;
        case "invalid-key": //when API key passed into the Peer constructor contains illegal characters 
          alert("Invalid ID")
          location.reload();
          break;
        default:
          alert("Error occurred. Please try again");
          console.log(err.type);
          location.reload();
      }
    });
  }

  connecttopeer.addEventListener("click", () => {
    remoteid = input_remote_id.value;
    remoteid = remoteid.trim();
    if (remoteid != "") {
      document.getElementById("connect-with-someone").click();
      joinChat(remoteid); //connects to remote peer when button is clicked
      cover.style.display = "none";
    }
  });

  //handling calls below

  const videobtn = document.getElementById("onlyvideo");
  videobtn.addEventListener("click", () => {
    document.getElementById("mute-audio").innerHTML =
      "<i class='fas fa-microphone'></i>"
    document.getElementById("mute-video").innerHTML =
      "<i class='fas fa-video'></i>"
    videoframe.style.display = "inline";
    startvideocall(remoteid); //starts the media connection by taking local user media
  });


  function startvideocall(id) {
    navigator.mediaDevices //takes local video stream
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        mystream = stream;
        addLocalVideo(stream); //add the local stream to the local video element
        call = peer.call(id, stream); //initializing a media connection object with target id and local stream
        call.on("stream", (remoteStream) => { //listens on incoming stream 
          addRemoteVideo(remoteStream); //adds the incoming stream to the local video object
          currentPear = call.peerConnection; //initializes a WebRTC peer object on the local stream
          callstart(call); //starts listening to call events
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function callstart(call) {
    console.log(call.peer);
    call.on("close", () => { //listens to close event from the remote peer
      mystream.getVideoTracks()[0].disabled = true;
      videoframe.style.display = "none";
      call.close(); //closes the media connection of the media connection
    });
  }

  function addRemoteVideo(stream) {
    document.getElementById("remote-video").srcObject = stream; //adds incoming remote stream to local video element
  }

  function addLocalVideo(stream) {
    document.getElementById("local-video").srcObject = stream; //adds outgoing local stream to remote video element
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

  //code for screenshare below

  sharescreen.addEventListener("click", (e) => { //gets display media
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
        let sender = currentPear.getSenders().find((s) => { //gets the senders media data
          return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack); //replaces the video track with display media
      })
      .catch((err) => {
        alert("did not get permissions for screen share");
      });
  });

  function stopScreenShare() { //stops screenshare
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
    call.close(); //closes media connection between peers
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

  clearchat.addEventListener("click", () => { //clears chat for local
    chatbdy.innerHTML = "";
    chatbody.innerHTML = "";
  });

  disconnectchatbtn.addEventListener("click", () => { //disconnects clients will the signalling server
    alert("disconnected with peer");
    conn.close();
    location.reload();
  });

  msginput.addEventListener("keyup", (event) => { //takes input message from main chat window
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
        conn.send(m); //sends data through the data connection channel
        chatbdy.scrollTo(0, chatbdy.scrollHeight); //adjusts the chat so that incoming messages are visible
        chatbody.scrollTo(0, chatbody.scrollHeight);
      }
    }
  };

  msginput_incall.addEventListener("keypress", (event) => {
    if (event.keyCode === 13) {
      document.getElementById("send").click();
      msginput_incall.value = ""; //takes input from the main chat window
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
        conn.send(m); //sends data through the data connection channel
        chatbdy.scrollTo(0, chatbdy.scrollHeight);
        chatbody.scrollTo(0, chatbody.scrollHeight);
      }
    }
  };

  //code for displaying messages in local body inside the vid call chat
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


  //code for displaying messages in local body in the main chat window
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

  //code for displaying messages in remote body inside the vid call chat
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

  //code for displaying messages in remote body in the main chat window
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

  //initializes listening on the the data connection 
  function joinChat(id) {
    conn = peer.connect(id, { //declaring a data connection with the remote peer through it's id
      reliable: true,
    });

    conn.on("open", () => { //listens to open event which starts once peer is successfully connected to the remote peer.
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

    conn.on("data", (data) => { //listens to data event from remote peer 
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
    conn.on("data", (data) => { //listens to data events from local peer
      if (toggleNav == false) {
        document.getElementById("chat").className = "fas fa-comment-alt jiggle";
      }
      addmsgremote(data);
      addmsgremotemain(data);
      chatbdy.scrollTo(0, chatbdy.scrollHeight);
      chatbody.scrollTo(0, chatbody.scrollHeight);
    });
    conn.on("close", () => { //Listens to close connection event from remote peer
      alert("connection closed");
      location.reload();
    });
  }
}