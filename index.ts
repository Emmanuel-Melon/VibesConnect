const express = require("express");
const cors = require("cors");
const path = require("path");

export const app = express();


const http = require("http");
const { Server } = require("socket.io");


const server = http.createServer(app);
const io = new Server(server);

const members = [];

// app.use(cors());
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.set("trust proxy", "loopback");
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const port = 8000;

app.get("/", (req, res) => {
    // This route is not strictly necessary, but you can use it for additional logic if needed
    res.sendFile(__dirname + '/index.html');
});

io.on("connection", (socket) => {

    socket.emit("user", {
        user: socket.rooms.values().next().value,
        
    });

    socket.on("save-name", arg => {
        const clients = io.sockets.adapter.rooms.get(socket.id);
        console.log("clients", clients);
        console.log("members", Array.from(clients));
        socket.emit("member-joined", {
            members: Array.from(clients).map(member => {
                return {
                    type: "user",
                    ...arg
                }
            })
        });
        
    });

    socket.on("init-call", (arg) => {
        console.log("init-call", arg);
        // socket.rooms.values().next().value,
        members.push({
            callerId: arg,
            offer: arg.offer
        })
        socket.broadcast.emit("call-initiated", {
            callerId: arg,
            offer: arg.offer
        });
    });

    socket.on("call-accepted", (arg) => {
        socket.emit("call-accepted", {
            userId: arg,
            members
        });
    });


    socket.on("media-stream-success", (arg) => {

    });

    socket.on("create-local-peer", (arg) => {
        console.log("create-local-peer", arg?.localPeer);
    });

    socket.on("received-offer", (arg) => {
        socket.emit("offer-received", {
            user: socket.rooms.values().next().value,
            offer: arg
        });
    });

    socket.on("answer-created", (arg) => {
        socket.broadcast.emit("answer-received", {
            answer: arg
        });
    });

    socket.on("negotiation-needed", (arg) => {
        socket.emit("negotiation-completed", {
            ...arg
        });
    });

    socket.on("new-ice-candidate", (arg) => {
        console.log(arg.candidate);
        socket.broadcast.emit("ice-candidate-received", {
            ...arg.candidate
        });
    });
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});

