const callButton = document.querySelector("#call");
const callAlert = document.querySelector("#call-alert");
const callStatus = document.querySelector("#call-status");
const id = document.querySelector("#userId");
const hangupButton = document.querySelector("#hangupButton");
const answerButton = document.querySelector("#answerButton");
const peerConnections = new Map();
let myPeerConnection;
let localStream;

function updateUI(members) {
  console.log(members);
  const roomMemberElement = document.getElementById("room-member");
  roomMemberElement.innerHTML = "";
 
  if (members.length === 0) {
    roomMemberElement.innerHTML = "Room is empty";
  } else {
    members.forEach((member) => {
      const memberElement = document.createElement("div");
      memberElement.innerHTML = `
        <div class="flex">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content rounded-full w-12">
              <span>${member.userName.charAt(0)}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 class="card-title text-sm">${member.userName}</h3>
          <div class="badge badge-success gap-2">Connected: ${member.id}</div>
        </div>
      `;
      roomMemberElement.appendChild(memberElement);
    });
  }
 }

document.getElementById("saveName").addEventListener("click", function() {
  const userName = document.getElementById("userName").value;
  socket.emit("save-name", { userName, id: socket.id });
 });

answerButton.addEventListener("click", async () => {
  const mediaStreamConstraints = {
    audio: true,
  };

  // Get the media stream.
  const mediaStream = await navigator.mediaDevices.getUserMedia(
    mediaStreamConstraints
  );
  1;
  await initRTCPeerConnection();

  // Add tracks from the media stream to the peer connection.
  mediaStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, mediaStream);
  });
  socket.emit("call-accepted", { userId: socket.id });
});

hangupButton.addEventListener("click", () => {
  // localStream.getTracks().forEach((track) => track.stop());
  myPeerConnection.close();
  myPeerConnection = null;
});

const socket = io();

// let myPeerConnection;
// let myPeerConnection;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false,
};

const RTCPeerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

socket.on("connect", function () {
  
});

socket.on("user", function (args) {
  console.log("user", args.users);
  myPeerConnection = new RTCPeerConnection();
  peerConnections.set(args.user, myPeerConnection);
  console.log(peerConnections);
});

socket.on("call-initiated", function (args) {
  callAlert.innerHTML = "Incoming call from " + args.callerId?.callerId;
});


socket.on("call-accepted", async function (args) {
  callStatus.innerHTML = "Connecting " + args.userId?.userId;
  myPeerConnection.setRemoteDescription(
    new RTCSessionDescription(args.members[args.members.length - 1].offer)
  );
  const answer = await myPeerConnection.createAnswer();
  await myPeerConnection.setLocalDescription(new RTCSessionDescription(answer));

  // Send the answer to the caller.
  socket.emit("answer-created", {
    answer: answer,
    userId: args.userId?.userId
  });
});

socket.on("answer-received", function (args) {
  myPeerConnection.setRemoteDescription(
    new RTCSessionDescription(args?.answer?.answer)
  );
});


socket.on("member-joined", function (args) {
  console.log(args.members);
  const members = [];
  members.push();
  updateUI(members.concat(args.members));
});

socket.on("ice-candidate-received", async function (args) {
  if (myPeerConnection && myPeerConnection.remoteDescription !== null) {
    await myPeerConnection.addIceCandidate(args);
    console.log(myPeerConnection.getSenders());
  }
  // console.log(args);
  if (myPeerConnection && myPeerConnection.remoteDescription !== null) {
    await myPeerConnection.addIceCandidate(args);
    console.log(myPeerConnection.getSenders());
  }
});

socket.on("negotiation-completed", function (args) {});

async function onLocalICECandidate(event) {
  try {
    if (event.candidate) {
      const iceCandidate = new RTCIceCandidate({
        candidate: event?.candidate?.candidate,
        sdpMLineIndex: event?.candidate?.sdpMLineIndex,
        sdpMid: event?.candidate?.sdpMid,
        ...event.candidate
      });
      // await myPeerConnection.addIceCandidate(iceCandidate);
      // console.log(
      //   `Added received ICE candidate: ${event.candidate.candidate}`,
      // );
      // console.log("mansss", event.candidate)
      socket.emit("new-ice-candidate", {
        candidate: iceCandidate,
      });
    }
  } catch (e) {
    console.error("Error adding received ice candidate", e);
  }
}

async function onICECandidate(event) {
  try {
    if (event.candidate) {
      // console.log("man", event.candidate)
      const iceCandidate = new RTCIceCandidate({
        candidate: event?.candidate?.candidate,
        sdpMLineIndex: event?.candidate?.sdpMLineIndex,
        sdpMid: event?.candidate?.sdpMid,
        ...event.candidate
      });
      // await myPeerConnection.addIceCandidate(iceCandidate);
      // console.log(
      //   `Added received ICE candidate: ${event.candidate.candidate}`,
      // );
      socket.emit("new-ice-candidate", {
        candidate: iceCandidate,
      });
    }
  } catch (e) {
    console.error("Error adding received ice candidate", e);
  }
}

function onLocalICECandidateConnectionChange(event) {
  console.log(event);
  console.log(myPeerConnection.connectionState);
  if (myPeerConnection.connectionState === "connected") {
    console.log("wlllll");
    if (!socket) return;
    socket.emit("connection-established", {
      peer: socket.id,
      connectionState: event.targetconnectionState,
    });
  }
}

function onICECandidateConnectionChange(event) {
  console.log("hllll");
  if (myPeerConnection.connectionState === "connected") {
    if (!socket) return;
    socket.emit("connection-established", {
      peer: socket.id,
      connectionState: event.targetconnectionState,
    });
  }
}

function onICECandidateConnectionError(event) {
  console.log("onICECandidateConnectionError: ", event);
}

function onLocalICECandidateConnectionError(event) {
  console.log("onLocalICECandidateConnectionError: ", event);
}
async function onNegotiationNeeded(event) {
  console.log("onNegotiationNeeded: ", event?.target.currentRemoteDescription
  );
  try {
    // const answer = await myPeerConnection.createAnswer();
    // await myPeerConnection.setLocalDescription(new RTCSessionDescription(answer));

  
    // Send the answer to the caller.
    // socket.emit("answer-created", {
    //  answer,
    //   // userId: args.userId?.userId
    // });
  } catch (error) {
    console.log(error);
  }
}

async function onLocalNegotiationNeeded(event) {
  try {
    const offer = await myPeerConnection.createOffer(offerOptions);
    await myPeerConnection.setLocalDescription(offer);
    socket.emit("init-call", { callerId: socket.id, offer });
  } catch (error) {
    console.log(error);
  }
}

async function initRTCPeerConnection() {
  myPeerConnection = new RTCPeerConnection(RTCPeerConnectionConfig);

  myPeerConnection.onicecandidate = onICECandidate;
  myPeerConnection.onconnectionstatechange = onICECandidateConnectionChange;
  myPeerConnection.onicecandidateerror = onICECandidateConnectionError;
  myPeerConnection.onnegotiationneeded = onNegotiationNeeded;
  myPeerConnection.ontrack = onRemoteTrack;
}

async function onTrack(event) {
  const localAudio = document.querySelector("#localAudio");
  localAudio.srcObject = event.streams[0];
}

async function onRemoteTrack(event) {
  console.log(event);
  const remoteAudio = document.querySelector("#remoteAudio");
  remoteAudio.srcObject = event.streams[0];
}

async function initRTCLocalPeerConnection() {
  myPeerConnection = new RTCPeerConnection(RTCPeerConnectionConfig);
  socket.emit("create-local-peer", {
    localPeer: JSON.stringify(myPeerConnection),
  });

  const offer = await myPeerConnection.createOffer(offerOptions);
  await myPeerConnection.setLocalDescription(offer);

  myPeerConnection.onicecandidate = onLocalICECandidate;
  myPeerConnection.onconnectionstatechange =
    onLocalICECandidateConnectionChange;
  myPeerConnection.onicecandidateerror = onLocalICECandidateConnectionError;
  myPeerConnection.onnegotiationneeded = onLocalNegotiationNeeded;
  myPeerConnection.ontrack = onTrack;

  socket.emit("init-call", { callerId: socket.id, offer });
}

const initCallProcess = async () => {
  await initRTCLocalPeerConnection();
  const mediaStreamConstraints = {
    audio: true,
  };

  // Initializes media stream.
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(onMediaStreamActivation)
    .catch(onLocalMediaStreamError);
};

// Handles error by logging a message to the console with the error message.
function onLocalMediaStreamError(error) {
  if (socket) {
    socket.emit("media-stream-error", {
      e: `navigator.getUserMedia error:`,
    });
  }
}

// Handles success by adding the MediaStream to the audio element.
function onMediaStreamActivation(stream) {
  localStream = stream;
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length > 0) {
    localStream.getTracks().forEach((track) => {
      myPeerConnection.addTrack(track, localStream);
    });
    if (socket) {
      socket.emit("media-stream-success", {
        e: `Using Audio device: ${audioTracks[0].label}`,
      });
    }
  }

  return stream;
}

callButton.addEventListener("click", initCallProcess);
