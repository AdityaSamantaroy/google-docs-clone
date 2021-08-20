const { Server } = require("socket.io");
//setup the socket server at SERVER_PORT
const io = new Server(3001, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

// when connection is established to this server from client side, listen to the socket
io.on("connection", (socket) => {
	// we start off by receiving the documentId and sending the document to the client
	socket.on("get-document", (documentId) => {
		const data = "";
		// console.log("got document", documentId);
		socket.join(documentId);
		socket.emit("load-document", data);

		// when the socket sends changes broadcast it (sent to all others except this user)
		socket.on("send-changes", (delta) => {
			// console.log(delta);
			socket.broadcast.to(documentId).emit("receive-changes", delta);
		});
	});

	console.log("connected");
});
