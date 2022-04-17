var socket = io()

let roomID, name

function changeColourBack(ele) {
    document.querySelector("#nameInput").style.border = "3px solid #555"
}

function createRoom(ele) {
    // if (event.key === "Enter") {
    //     if (document.getElementById("nameInput").value != "") {
    //         let roomName = {
    //             name: document.getElementById("nameInput").value,
    //             roomID: document.getElementById("hostID").value,
    //         }
    //         socket.emit("createRoom", roomName)
    //     } else {
    //         document.querySelector("#nameInput").style.border =
    //             "3px solid #FC100D"
    //     }
    // }

    if (document.getElementById("nameInput").value != "") {
        let roomName = {
            name: document.getElementById("nameInput").value,
            roomID: "",
        }
        socket.emit("createRoom", roomName)
    } else {
        document.querySelector("#nameInput").style.border =
            "3px solid #FC100D"
    }
}

function generateDeadpool(missions) {
    //"missions":{
    //          "agent":{
    //              "target":"",
    //              "words":[]
    //          }
    //      }

    console.log("mission")
    console.log(missions)
    
    let deadpoolDiv = document.createElement('div')
    deadpoolDiv.className = "deadpoolDiv"
    missionDivs = []
    Object.keys(missions).forEach((key) => {
        missionElements = []
        let target = missions[key]['target']
        let words = missions[key]['words']
        missionDiv = document.createElement('div')
        missionDiv.className = "deadpoolMission"
        
        let playerName = document.createElement('h3')
        playerName.innerText = key
        missionElements.push(playerName)
        
        let targetName = document.createElement('h4')
        targetName.innerText = "Target: " + target
        missionElements.push(targetName)
        
        words.forEach( word => {
            wordElement = document.createElement('p')
            wordElement.innerHTML = word
            missionElements.push(wordElement)
        })

        console.log("missionElements")
        console.log(missionElements)
        missionDiv.replaceChildren(...missionElements)
        missionDivs.push(missionDiv)
    })

    deadpoolDiv.replaceChildren(...missionDivs)
    return deadpoolDiv
}

socket.on("roomCreated", (ack) => {
    console.log(ack)
    let roomName = ack[1]
    if (ack[0]) {
        document.querySelector("#roomCode").innerHTML =
            "Room Code: " + roomName["roomID"]
        document.querySelector("#login").style.display = "none"
        document.querySelector("#waitForStart").style.display = "block"
        roomID = roomName["roomID"]
        name = roomName["name"]
    } else {
        document.querySelector("#createError").innerHTML =
            "That room was already created!"
    }
})

function joinRoom(ele) {
    if (event.key === "Enter") {
        if (document.getElementById("nameInput").value != "") {
            let roomName = {
                name: document.getElementById("nameInput").value,
                roomID: document.getElementById("joinID").value,
            }
            socket.emit("joinRoom", roomName)
        } else {
            document.querySelector("#nameInput").style.border =
                "3px solid #FC100D"
        }
    }
}

socket.on("roomJoined", (ack) => {
    console.log(ack)
    let roomName = ack[1]
    if (ack[0]) {
        document.querySelector("#roomCode").innerHTML =
            "Room Code: " + roomName["roomID"]
        document.querySelector("#login").style.display = "none"
        document.querySelector("#waitForStart").style.display = "block"
        roomID = roomName["roomID"]
        name = roomName["name"]
    } else {
        document.querySelector("#joinError").innerHTML =
            "Couldn't find that room!"
    }
})

function startGame() {
    socket.emit("startGame", { name: name, roomID: roomID })
}

socket.on("players", (players) => {
    document.querySelector("#playerList").innerHTML = ""
    for (var player of players) {
        var playerName = document.createElement("p")
        playerName.innerHTML = player
        document.querySelector("#playerList").appendChild(playerName)
    }
})

socket.on("mission", (mission) => {
    document.querySelector("#waitForStart").style.display = "none"
    document.querySelector("#gameBoard").style.display = "block"
    document.querySelector("#agent").innerHTML = document.getElementById("nameInput").value
    document.querySelector("#target").innerHTML = mission["target"]
    console.log(mission)
    let wordsDiv = document.querySelector("#words")

    for (const [key, value] of Object.entries(mission.words)) {
        var label = document.createElement("p")
        label.innerHTML = value
        label.classList.add("container")
        wordsDiv.appendChild(label)
    }
})

function changeHostToInput() {
    document.getElementById("host-wrapper").innerHTML =
        '<h3 style="margin-top:0px">Enter a Room ID</h3><input id="hostID" onkeydown="createRoom(this)" style=" width:100% height: 35px font-size: 30px border: 3px solid #555" type="text" /><p id="createError"></p>'
    document.getElementById("hostID").focus()
}

function changeJoinToInput() {
    document.getElementById("join-wrapper").innerHTML =
        '<h3 style="margin-top:0px">Enter a Room ID</h3><input id="joinID" onkeydown="joinRoom(this)" style=" width:100% height: 35px font-size: 30px border: 3px solid #555" type="text" /><p id="joinError"></p>'
    document.getElementById("joinID").focus()
}

function killConfirm() {
    document.querySelector("#execute").style.display = "none"
    document.querySelector("#confirm").style.display = "inline-flex"
}

function execution() {
    document.querySelector("#confirm").style.display = "none"
    document.querySelector("#execute").style.display = "inline-flex"
    socket.emit("execution", { name: name, roomID: roomID })
}

socket.on('executed', (mission) => {
    document.querySelector("#execute").style.display = "none"
    document.querySelector("#confirm").style.display = "none"
    console.log("OOWOO")
    //document.querySelector("#notepadContent").innerHTML = "<h3>You've been hit by, you've been struck by</h3><h3>Agent " + killer + "</h3><h3><a style='color:black text-decoration: underline black' href='/'>Play Again</a></h3>"
    document.querySelector("#notepad").replaceChildren(generateDeadpool(mission))
})

socket.on('winner', (agent) => {
    document.querySelector("#execute").style.display = "none"
    document.querySelector("#confirm").style.display = "none"
    document.querySelector("#notepadContent").innerHTML = "<h3 style='padding: 0px 50px 0px 50px'>Congratulations Agent " + agent + ", you've proven yourself as the top agent 😎</h3><h3 style='padding: 0px 50px 0px 50px'> Please use this opportunity to flex on your friends!</h3><h3><a style = 'color:black text-decoration: underline black' href = '/'>Play Again</a></h3> "
})