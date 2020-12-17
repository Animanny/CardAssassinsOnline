var socket = io();

let roomID, name;

function changeColourBack(ele) {
    document.querySelector("#nameInput").style.border = "3px solid #555";
}

function createRoom(ele) {
    if (event.key === "Enter") {
        if (document.getElementById("nameInput").value != "") {
            let roomName = {
                name: document.getElementById("nameInput").value,
                roomID: document.getElementById("hostID").value,
            };
            socket.emit("createRoom", roomName);
        } else {
            document.querySelector("#nameInput").style.border =
                "3px solid #FC100D";
        }
    }
}

socket.on("roomCreated", (ack) => {
    console.log(ack);
    let roomName = ack[1];
    if (ack[0]) {
        document.querySelector("#roomCode").innerHTML =
            "Room Code: " + roomName["roomID"];
        document.querySelector("#login").style.display = "none";
        document.querySelector("#waitForStart").style.display = "block";
        roomID = roomName["roomID"];
        name = roomName["name"];
    } else {
        document.querySelector("#createError").innerHTML =
            "That room was already created!";
    }
});

function joinRoom(ele) {
    if (event.key === "Enter") {
        if (document.getElementById("nameInput").value != "") {
            let roomName = {
                name: document.getElementById("nameInput").value,
                roomID: document.getElementById("joinID").value,
            };
            socket.emit("joinRoom", roomName);
        } else {
            document.querySelector("#nameInput").style.border =
                "3px solid #FC100D";
        }
    }
}

socket.on("roomJoined", (ack) => {
    console.log(ack);
    let roomName = ack[1];
    if (ack[0]) {
        document.querySelector("#roomCode").innerHTML =
            "Room Code: " + roomName["roomID"];
        document.querySelector("#login").style.display = "none";
        document.querySelector("#waitForStart").style.display = "block";
        roomID = roomName["roomID"];
        name = roomName["name"];
    } else {
        document.querySelector("#joinError").innerHTML =
            "Couldn't find that room!";
    }
});

function startGame() {
    socket.emit("startGame", { name: name, roomID: roomID });
}

socket.on("players", (players) => {
    document.querySelector("#playerList").innerHTML = "";
    for (var player of players) {
        var playerName = document.createElement("p");
        playerName.innerHTML = player;
        document.querySelector("#playerList").appendChild(playerName);
    }
});

socket.on("mission", (mission) => {
    document.querySelector("#waitForStart").style.display = "none";
    document.querySelector("#gameBoard").style.display = "block";
    document.querySelector("#agent").innerHTML = document.getElementById(
        "nameInput"
    ).value;
    document.querySelector("#target").innerHTML = mission["target"];
    console.log(mission);
    let wordsDiv = document.querySelector("#words");

    for (const [key, value] of Object.entries(mission.words)) {
        var label = document.createElement("p");
        label.innerHTML = value;
        label.classList.add("container");
        wordsDiv.appendChild(label);
    }
});

function changeHostToInput() {
    document.getElementById("host-wrapper").innerHTML =
        '<h3 style="margin-top:0px;">Enter a Room ID</h3><input id="hostID" onkeydown="createRoom(this)" style=" width:100%; height: 35px; font-size: 30px; border: 3px solid #555;" type="text" /><p id="createError"></p>';
    document.getElementById("hostID").focus();
}

function changeJoinToInput() {
    document.getElementById("join-wrapper").innerHTML =
        '<h3 style="margin-top:0px;">Enter a Room ID</h3><input id="joinID" onkeydown="joinRoom(this)" style=" width:100%; height: 35px; font-size: 30px; border: 3px solid #555;" type="text" /><p id="joinError"></p>';
    document.getElementById("joinID").focus();
}

function killConfirm() {
    document.querySelector("#execute").style.display = "none";
    document.querySelector("#confirm").style.display = "inline-flex";
}

function execution() {
    document.querySelector("#confirm").style.display = "none";
    document.querySelector("#execute").style.display = "inline-flex";
    socket.emit("execution", { name: name, roomID: roomID });
}

socket.on('executed', (killer) => {
    document.querySelector("#execute").style.display = "none";
    document.querySelector("#confirm").style.display = "none";
    document.querySelector("#notepadContent").innerHTML = "<h3>You've been hit by, you've been struck by</h3><h3>Agent " + killer + "</h3><h3><a style='color:black; text-decoration: underline black;' href='/'>Play Again</a></h3>";
})

socket.on('winner', (agent) => {
    document.querySelector("#execute").style.display = "none";
    document.querySelector("#confirm").style.display = "none";
    document.querySelector("#notepadContent").innerHTML = "<h3>Congratulations " + agent + ", you've proven yourself as the top agent 😎</h3><h3> Please use this opportunity to flex on your friends!</h3><h3><a style = 'color:black; text-decoration: underline black;' href = '/'>Play Again</a></h3> ";
})