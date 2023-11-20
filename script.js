const callButon = document.querySelector("#call");
const callAlert = document.querySelector("#call-alert");
const callStatus = document.querySelector("#call-status");
const id = document.querySelector("#userId");
const hangupButton = document.querySelector("#hangupButton");
const answerButton = document.querySelector("#answerButton");

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
    peerConnection.addTrack(track, mediaStream);
  });
  socket.emit("call-accepted", { userId: socket.id });
});

hangupButton.addEventListener("click", () => {
  localStream.getTracks().forEach((track) => track.stop());
  localPeerConnection.close();
  peerConnection.close();
  localPeerConnection = null;
  peerConnection = null;
});

const socket = io();

let localPeerConnection;
let peerConnection;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false,
};

const RTCPeerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

socket.on("connect", function () {
  id.innerHTML = `Connected to the server: ${socket.id}`;
});

socket.on("user", function (args) {
  console.log("user", args);
});

socket.on("call-initiated", function (args) {
  callAlert.innerHTML = "Incoming call from " + args.callerId?.callerId;
});

socket.on("call-initiated", function (args) {
  callAlert.innerHTML = "Incoming call from " + args.callerId?.callerId;
});

socket.on("call-accepted", async function (args) {
  callStatus.innerHTML = "Connecting " + args.userId?.userId;
  peerConnection.setRemoteDescription(
    new RTCSessionDescription(args.members[0].offer)
  );
  const answer = await peerConnection.createAnswer(offerOptions);
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  // Send the answer to the caller.
  socket.emit("answer-created", {
    answer: answer,
  });
});

socket.on("answer-received", function (args) {
  localPeerConnection.setRemoteDescription(
    new RTCSessionDescription(args?.answer?.answer)
  );
});

socket.on("ice-candidate-received", async function (args) {
  console.log(localPeerConnection);
  if (localPeerConnection && localPeerConnection.remoteDescription !== null) {
    await localPeerConnection.addIceCandidate(args);
  }
  // console.log(args);
  if (peerConnection && peerConnection.remoteDescription !== null) {
    await peerConnection.addIceCandidate(args);
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
      });
      // await localPeerConnection.addIceCandidate(iceCandidate);
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
      });
      // await peerConnection.addIceCandidate(iceCandidate);
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
  if (peerConnection.connectionState === "connected") {
    console.log("connected");
    if (!socket) return;
    socket.emit("connection-established", {
      hello: "world",
    });
  }
}

function onICECandidateConnectionChange(event) {
  console.log(event);
  if (peerConnection.connectionState === "connected") {
    console.log("connected");
    if (!socket) return;
    socket.emit("connection-established", {
      hello: "world",
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
  console.log("onNegotiationNeeded: ", event);
  try {

  } catch (error) {
    console.log(error);
  }
}

async function onLocalNegotiationNeeded(event) {
  try {
      // const offer = await localPeerConnection.createOffer(offerOptions);
      // await localPeerConnection.setLocalDescription(new RTCSessionDescription(offer));
  } catch (error) {
    console.log(error);
  }
}

async function initRTCPeerConnection() {
  peerConnection = new RTCPeerConnection(RTCPeerConnectionConfig);

  peerConnection.onicecandidate = onICECandidate;
  peerConnection.onconnectionstatechange = onICECandidateConnectionChange;
  peerConnection.onicecandidateerror = onICECandidateConnectionError;
  peerConnection.onnegotiationneeded = onNegotiationNeeded;
  peerConnection.ontrack = onRemoteTrack;
}

async function onTrack(event) {
  const localAudio = document.querySelector("#localAudio");
  localAudio.srcObject = event.streams[0];
}

async function onRemoteTrack(event) {
  const remoteAudio = document.querySelector("#remoteAudio");
  remoteAudio.srcObject = event.streams[0];
}

async function initRTCLocalPeerConnection() {
  localPeerConnection = new RTCPeerConnection(RTCPeerConnectionConfig);
  socket.emit("create-local-peer", {
    localPeer: JSON.stringify(localPeerConnection),
  });

  const offer = await localPeerConnection.createOffer(offerOptions);
  await localPeerConnection.setLocalDescription(offer);

  localPeerConnection.onicecandidate = onLocalICECandidate;
  localPeerConnection.onconnectionstatechange =
    onLocalICECandidateConnectionChange;
  localPeerConnection.onicecandidateerror = onLocalICECandidateConnectionError;
  localPeerConnection.onnegotiationneeded = onLocalNegotiationNeeded;
  localPeerConnection.ontrack = onTrack;

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
      localPeerConnection.addTrack(track, localStream);
    });
    if (socket) {
      socket.emit("media-stream-success", {
        e: `Using Audio device: ${audioTracks[0].label}`,
      });
    }
  }

  return stream;
}

callButon.addEventListener("click", initCallProcess);
