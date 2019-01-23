"use strict";
const uniqueId = Math.round(Math.random() * 10000000).toString();
setTimeout(() => {
    const socket = io.connect(document.location.origin, {
        query: {
            uniqueId
        }
    });
    function insertNewMsg(msgObj) {
        const messagesDiv = document.querySelector("#messages");
        const newUserElem = document.createElement("b");
        newUserElem.innerHTML = msgObj.user;
        const newMsgElem = document.createElement("p");
        newMsgElem.innerHTML = `[${msgObj.time}]: ${msgObj.message}`;
        messagesDiv.appendChild(newUserElem);
        messagesDiv.appendChild(newMsgElem);
    }
    function insertMsgs(msgs) {
        if (msgs !== "") {
            msgs.forEach((msg) => {
                insertNewMsg(msg);
            });
        }
    }
    function removeMsgs() {
        const messagesDiv = document.querySelector("#messages");
        messagesDiv.innerHTML = "";
    }
    function getUsername(selectId) {
        const select = document.querySelector(`#${selectId}`);
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
        socket.emit("username_change", JSON.stringify(getUserObj()), (prevMsgs) => {
            insertMsgs(prevMsgs);
        });
        removeMsgs();
    }
    function populateSelectInput(selectId, dataArr) {
        const select = document.querySelector("#" + selectId);
        select.innerHTML = "";
        dataArr.forEach((d) => {
            const option = document.createElement("option");
            option.value = d;
            option.innerHTML = d;
            select.appendChild(option);
        });
    }
    const names = {
        user: [],
        group: []
    };
    socket.on("message", (msg) => {
        const msgObj = JSON.parse(msg);
        insertNewMsg(msgObj);
    });
    function initialize() {
        socket.emit("chat_start", {}, (preloadData) => {
            names.user = [];
            names.group = [];
            Object.keys(preloadData).forEach((name) => {
                const key = preloadData[name];
                names[key].push(key !== "group" ? name : name + " [Group]");
            });
            populateSelectInput("userSelect", names.user);
            populateSelectInput("peerSelect", names.user.concat(names.group));
            changeRoom();
            const msgSubmitBtn = document.querySelector("#msgSubmitBtn");
            msgSubmitBtn.disabled = false;
        });
    }
    initialize();
    const submitForm = document.querySelector("#submitForm");
    submitForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const msgBox = document.querySelector("#msgBox");
        const msgObj = getUserObj();
        if (msgObj.user === "" || msgObj.peer === "" || msgBox.value === "") {
            return alert("User or recepient is missing / Text message is empty!");
        }
        msgObj.message = msgBox.value;
        socket.emit("message", JSON.stringify(msgObj));
    });
    function formSubmit(formName, inputName, link) {
        const form = document.querySelector(`#${formName}`);
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const input = document.querySelector(`#${inputName}`);
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
    let timer;
    const searchBox = document.querySelector("#searchBox");
    searchBox.addEventListener("input", (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            socket.emit("search", {
                searchTerm: searchBox.value,
                user: getUsername("userSelect"),
                peer: getUsername("userSelect")
            });
        }, 200);
    });
    socket.on("search", (msg) => {
        const searchResult = document.querySelector("#searchResult");
        searchResult.innerHTML = "";
        const msgObj = JSON.parse(msg);
        msgObj.results.forEach((name) => {
            const newElem = document.createElement("p");
            newElem.innerHTML = name;
            searchResult.appendChild(newElem);
        });
    });
});
