var socket = io();

let roomID, name;

function createRoom(ele) {
    if(event.key === 'Enter') {
        let roomName = {
            "name":document.getElementById("nameInput").value,
            "roomID":document.getElementById("hostID").value
        }
        socket.emit("createRoom", roomName);
    }
}

socket.on("roomCreated", (ack)=>{
    console.log(ack)
    let roomName = ack[1]
    if(ack[0]){
        document.querySelector("#roomCode").innerHTML = "Room Code: "+ roomName["roomID"];
        document.querySelector("#login").style.display = "none";
        document.querySelector("#waitForStart").style.display = "block";
        roomID = roomName["roomID"];
        name = roomName["name"]
    } else {
        document.querySelector("#createError").innerHTML = "That room was already created!"
    }
})

function joinRoom(ele) {
    if(event.key === 'Enter') {
        let roomName = {
            "name":document.getElementById("nameInput").value,
            "roomID":document.getElementById("joinID").value
        }
        socket.emit("joinRoom", roomName);
    }
}

socket.on("roomJoined", (ack)=>{
    console.log(ack)
    let roomName = ack[1]
    if(ack[0]){
        document.querySelector("#roomCode").innerHTML = "Room Code: "+ roomName["roomID"];
        document.querySelector("#login").style.display = "none";
        document.querySelector("#waitForStart").style.display = "block";
        roomID = roomName["roomID"];
        name = roomName["name"]
    } else {
        document.querySelector("#joinError").innerHTML = "Couldn't find that room!"
    }
})

function startGame(){
    socket.emit("startGame", {"name": name,"roomID":roomID})
}

socket.on('wordPack', function(msg){
  //  $('#messages').append($('<li>').text(msg));
  document.getElementById("word1").childNodes[2].textContent = msg['word1'];
  document.getElementById("word2").childNodes[2].textContent = msg['word2'];
  document.getElementById("word3").childNodes[2].textContent = msg['word3'];

});

socket.on("players", (players) => {
    document.querySelector("#playerList").innerHTML = "";
    for(var player of players){
        var playerName = document.createElement("p");
        playerName.innerHTML = player;
        document.querySelector("#playerList").appendChild(playerName)
    }
})

socket.on("mission", (mission) => {
    document.querySelector("#waitForStart").style.display = "none";
    document.querySelector("#gameBoard").style.display = "grid";
    document.querySelector("#agent").innerHTML = document.getElementById("nameInput").value;
    document.querySelector("#target").innerHTML = mission["target"];
    console.log(mission)
    document.querySelector("#word1").innerHTML = "<input type='checkbox'>"+mission.words[0]+"<span class='checkmark'></span>"
    document.querySelector("#word2").innerHTML = "<input type='checkbox'>"+mission.words[1]+"<span class='checkmark'></span>"
    document.querySelector("#word3").innerHTML = "<input type='checkbox'>"+mission.words[2]+"<span class='checkmark'></span>"

})

function changeHostToInput(){
    document.getElementById("host-wrapper").innerHTML = '<h3>Enter a Room ID</h3><input id="hostID" onkeydown="createRoom(this)" style=" width:100%; height: 35px; font-size: 30px; border: 3px solid #555;" type="text" /><p id="createError"></p>';
    document.getElementById("hostID").focus();
}

function changeJoinToInput(){
    document.getElementById("join-wrapper").innerHTML = '<h3>Enter a Room ID</h3><input id="joinID" onkeydown="joinRoom(this)" style=" width:100%; height: 35px; font-size: 30px; border: 3px solid #555;" type="text" /><p id="joinError"></p>';
    document.getElementById("joinID").focus();
}
