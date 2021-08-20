const mongoose = require("mongoose");
const Document = require("./document");

mongoose.connect(
	"mongodb+srv://fullstack:fullstack@cluster0.pzh22.mongodb.net/documents?retryWrites=true&w=majority",
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: true,
		useCreateIndex: true,
	}
);

const { Server } = require("socket.io");
//setup the socket server at SERVER_PORT
const io = new Server(3001, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

const defaultValue = "";

// when connection is established to this server from client side, listen to the socket
io.on("connection", (socket) => {
	// we start off by receiving the documentId and sending the document to the client
	socket.on("get-document", async (documentId) => {
		const document = await findOrCreateDocument(documentId);
		const data = document.data;
		// console.log("got document", documentId);
		socket.join(documentId);
		socket.emit("load-document", data);

		// when the socket sends changes broadcast it (sent to all others except this user)
		socket.on("send-changes", (delta) => {
			// console.log(delta);
			socket.broadcast.to(documentId).emit("receive-changes", delta);
		});

		// save the updated document to mongodb
		socket.on("save-document", async (data) => {
			await Document.findByIdAndUpdate(documentId, { data });
		});
	});

	console.log("connected");
});

// this does what it says
async function findOrCreateDocument(id) {
	if (id == null) return;

	const document = await Document.findById(id);

	if (document) return document;

	// create the document if it doesnt exist
	return await Document.create({ _id: id, data: defaultValue });
}
