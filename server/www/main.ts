const uniqueId = Math.round(Math.random() * 10000000).toString();

const socket = io.connect(
	document.location.origin,
	{
		query: {
			uniqueId
		}
	}
);

function insertNewMsg(msgObj: {[key: string]: any}) {
	const messagesDiv = document.querySelector("#messages") as HTMLDivElement;
	const newUserElem = document.createElement("b") as HTMLElement;
	newUserElem.innerHTML = msgObj.user;
	const newMsgElem = document.createElement("p") as HTMLParagraphElement;
	newMsgElem.innerHTML = `[${msgObj.time}]: ${msgObj.message}`;
	messagesDiv.appendChild(newUserElem);
	messagesDiv.appendChild(newMsgElem);
}

function insertMsgs(msgs: {[key: string]: any}[] | string) {
	if (msgs !== "") {
		(msgs as {[key: string]: any}[]).forEach((msg) => {
			insertNewMsg(msg);
		});
	}
}

function removeMsgs() {
	const messagesDiv = document.querySelector("#messages") as HTMLDivElement;
	messagesDiv.innerHTML = "";
}

function getUsername(selectId: string) {
	const select = document.querySelector(`#${selectId}`) as HTMLSelectElement;
	return select.options[select.selectedIndex]
		? select.options[select.selectedIndex].value
		: "";
}

function getUserObj() {
	return {
		user: getUsername("userSelect"),
		peer: getUsername("peerSelect").split(" ")[0],
		group: names.group.indexOf(getUsername("peerSelect")) > -1
	};
}

function changeRoom() {
	socket.emit(
		"username_change",
		JSON.stringify(getUserObj()),
		(prevMsgs: {[key: string]: any}[]) => {
			insertMsgs(prevMsgs);
		}
	);
	removeMsgs();
}

function populateSelectInput(selectId: string, dataArr: string[]) {
	const select = document.querySelector("#" + selectId) as HTMLSelectElement;
	select.innerHTML = "";
	dataArr.forEach((d) => {
		const option = document.createElement("option") as HTMLOptionElement;
		option.value = d;
		option.innerHTML = d;
		select.appendChild(option);
	});
}

const names = {
	user: [] as string[],
	group: [] as string[]
};

socket.on("message", (msg: string) => {
	const msgObj = JSON.parse(msg);
	insertNewMsg(msgObj);
});

function initialize() {
	socket.emit("chat_start", {}, (preloadData: {[key: string]: any}) => {
		names.user = [];
		names.group = [];
		Object.keys(preloadData).forEach((name) => {
			const key = preloadData[name];
			names[key].push(key !== "group" ? name : name + " [Group]");
		});
		populateSelectInput("userSelect", names.user);
		populateSelectInput("peerSelect", names.user.concat(names.group));
		changeRoom();
		const msgSubmitBtn = document.querySelector(
			"#msgSubmitBtn"
		) as HTMLButtonElement;
		msgSubmitBtn.disabled = false;
	});
}
initialize();
// socket.emit(
// 	"chat_start",
// 	JSON.stringify(getUserObj()),
// 	(prevMsgs: {[key: string]: any}[][]) => {
// 		insertMsgs(prevMsgs);
// 		const msgSubmitBtn = document.querySelector(
// 			"#msgSubmitBtn"
// 		) as HTMLButtonElement;
// 		msgSubmitBtn.disabled = false;
// 	}
// );

const submitForm = document.querySelector("#submitForm") as HTMLFormElement;
submitForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const msgBox = document.querySelector("#msgBox") as HTMLInputElement;
	const msgObj = getUserObj() as any;
	if (msgObj.user === "" || msgObj.peer === "" || msgBox.value === "") {
		return alert("User or recepient is missing / Text message is empty!");
	}
	msgObj.message = msgBox.value;
	socket.emit("message", JSON.stringify(msgObj));
});

function formSubmit(formName: string, inputName: string, link: string) {
	const form = document.querySelector(`#${formName}`) as HTMLFormElement;
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const input = document.querySelector(`#${inputName}`) as HTMLInputElement;
		const newName = input.value;
		if (newName === "") {
			return alert("Name is missing!");
		}
		input.innerHTML = "";

		fetch(link, {
			method: "POST",
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify({
				name: newName
			})
		})
			.then((res) => {
				return res.json();
			})
			.then((result) => {
				alert(result.status);
				initialize();
			});
	});
}

formSubmit("userRegForm", "newUsernameInput", "/regUser");
formSubmit("groupRegForm", "newGroupnameInput", "/regGroup");
