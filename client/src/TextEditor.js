import { useState, useEffect, useCallback } from "react";
import React from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

export default function TextEditor() {
	const { id: documentId } = useParams();
	const [socket, setSocket] = useState();
	const [quill, setQuill] = useState();
	console.log(documentId);
	// setup the socket connection from client side
	useEffect(() => {
		//setup socket on client side to listen to the SERVER_PORT
		const s = io("http://localhost:3001");
		setSocket(s);

		//disconnect socket from client side
		return () => {
			s.disconnect();
		};
	}, []);

	// for emitting document id to the socket whenever documentId or socket or quill changes
	// handling different rooms on the client side
	useEffect(() => {
		if (socket == null || quill == null) return;

		//listen to the server when it sends a document
		// we only want to do this once, ie once the correct document has been loaded we dont need it
		socket.once("load-document", (document) => {
			// load editor with this document
			quill.setContents(document);
			// the editor is disabled till we load the correct document
			quill.enable();
		});

		//send the id of current room to the server
		socket.emit("get-document", documentId);
	}, [socket, quill, documentId]);

	// callback to add the editor to the wrapper div
	const wrapperRef = useCallback((wrapper) => {
		if (wrapper == null) return;

		wrapper.innerHTML = "";
		const editor = document.createElement("div");
		wrapper.append(editor);
		const q = new Quill(editor, { theme: "snow" });
		q.disable();
		q.setText("Loading");
		setQuill(q);
	}, []);

	// for updating changes from another user into quill
	useEffect(() => {
		if (socket == null || quill == null) return;
		const handler = (delta, oldDelta, source) => {
			// quill updates content only when it receives some changes from another user
			if (source !== "user") {
				console.log("received-changes");
				quill.updateContents(delta);
			}
		};

		socket.on("receive-changes", handler);

		return () => {
			quill.off("text-change", handler);
		};
	}, [socket, quill]);

	// for emitting changes made by this user to the socket
	useEffect(() => {
		if (socket == null || quill == null) return;
		const handler = (delta, oldDelta, source) => {
			if (source !== "user") return;
			// emit to socket from client side to server
			socket.emit("send-changes", delta);
		};

		quill.on("text-change", handler);

		return () => {
			quill.off("text-change", handler);
		};
	}, [socket, quill]);

	// the wrapper div containing the editor space
	return <div id="container" ref={wrapperRef}></div>;
}
