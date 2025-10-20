var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    pingTimeout: 3600000
});

rooms = {
    // "roomName":{
    //     "gameState": "lobby"/"started"
    //     "users":{ "ani": socket, "bob": socket },
    //     "players":["ani", "bob"],
    //     "missions":{
    //          "ani":{
    //              "target":"bob",
    //              "words":["word1","word2","word3"]
    //          }
    //      }
    // },

}

//let users = {}

//let players = [];

var wordList = ["song", "furniture", "cemetery", "acoustics", "moon", "lip", "star", "direction", "pleasure", "cactus", "scarf", "attack", "riddle", "spy", "mass", "face", "thunder", "neck", "book", "oranges", "selection", "talk", "force", "stage", "protest", "worm", "swing", "dog", "town", "respect", "religion", "yam", "toys", "rule", "mine", "toad", "slope", "zebra", "seed", "flesh", "stretch", "nut", "form", "voyage", "truck", "stem", "show", "butter", "elbow", "cannon", "week", "recess", "chance", "hydrant", "scissors", "country", "error", "crown", "thought", "care", "vase", "system", "sky", "snakes", "earthquake", "idea", "income", "profit", "wood", "laborer", "hook", "interest", "monkey", "top", "stick", "oil", "experience", "quiet", "wave", "lamp", "title", "question", "drawer", "snow", "boy", "believe", "underwear", "wash", "airport", "cover", "wax", "bulb", "hole", "hat", "page", "rhythm", "sign", "winter", "nerve", "sweater"];
app.set('view cache', false);
app.use(express.static(__dirname + "/client", {
    extensions: ['html', 'htm']
}));

io.on('connection', (socket) => {

    socket.on('createRoom', (room) => {
        do {
            room["roomID"] = makeid()
        } while (room["roomID"] in rooms)
        // if (room["roomID"] in rooms) {
        //     socket.emit("roomCreated", false);
        //     return;
        // }
        rooms[room["roomID"]] = { "gameState": "lobby", "users": {}, "players": [] }
        socket.join(room["roomID"])
        //users[room["name"]] = socket;
        rooms[room["roomID"]]["users"][room["name"]] = socket;
        rooms[room["roomID"]]["players"].push(room["name"]);
        rooms[room["roomID"]]["missions"] = {}
        //players.push(room["name"]);
        socket.emit("roomCreated", [true, room])
        socket.emit("players", rooms[room["roomID"]]["players"]);

    });

    socket.on('joinRoom', (room) => {
        let roomId = room["roomID"].trim().toUpperCase();
        let name = room["name"]

        if (roomId in rooms == false) {
            socket.emit("roomJoined", false);
            return;
        }


        if (rooms[roomId]["gameState"] == "started" && room["name"] in rooms[roomId]["missions"]) {
            socket.join(roomId)

            rooms[roomId]["users"][room["name"]] = socket;
            socket.emit("roomJoined", [true, room])
            if (name in rooms[roomId]["missions"]) {
                let mission = {
                    "agent": name,
                    "target": rooms[roomId]["missions"][name]["target"],
                    "words": rooms[roomId]["missions"][name]["words"]
                }
                socket.emit("mission", mission);
            }
        }

        socket.join(roomId)
        rooms[roomId]["users"][room["name"]] = socket;
        rooms[roomId]["players"].push(room["name"]);
        socket.emit("roomJoined", [true, room])
        io.to(roomId).emit("players", rooms[roomId]["players"]);
    });

    socket.on('startGame', (roomInfo) => {
        let roomID = roomInfo["roomID"]
        rooms[roomID]["players"] = shuffle(rooms[roomID]["players"]);

        for (let i = 0; i < rooms[roomID]["players"].length; i++) {
            let agent = rooms[roomID]["players"][i]
            rooms[roomID]["missions"][agent] = {
                "target": "",
                "words": []
            }
            let target = rooms[roomID]["players"][(i + 1) % rooms[roomID]["players"].length]
            let words = generateWords()
            let secretMessage = {
                "agent": agent,
                "target": target,
                "words": words
            }

            rooms[roomID]["missions"][agent]["target"] = target;
            rooms[roomID]["missions"][agent]["words"] = words;
            rooms[roomID]["users"][agent].emit("mission", secretMessage);
            rooms[roomID]["gameState"] = "started"
        }
    })

    socket.on("recon", (roomInfo) => {
        console.log("reconnect request recieved: ", roomInfo)
        // Get reconnect request info
        let roomID = roomInfo["roomID"].trim().toUpperCase();
        let name = roomInfo["name"]

        // Validate room exists
        if (roomID in rooms == false) {
            socket.emit("roomJoined", [false]);
            return;
        }

        // If the game has already started
        // and this user wasn't a part of it
        // block they ahh
        if (rooms[roomID].gameState == "started" && !rooms[roomID]["players"].includes(name)) {
            socket.emit("roomJoined", [false]);
            return;
        }

        // Rejoin the rooms
        socket.join(roomID)
        rooms[roomID]["users"][name] = socket;
        rooms[roomID]["players"].push(name);
        socket.emit("roomJoined", [true, roomInfo])

        if (rooms[roomID]["gameState"] == "lobby") {
            io.to(roomID).emit("players", rooms[roomID]["players"])
            return;
        }


        if (name in rooms[roomID]["missions"]) {
            let mission = {
                "agent": name,
                "target": rooms[roomID]["missions"][name]["target"],
                "words": rooms[roomID]["missions"][name]["words"]
            }
            socket.emit("mission", mission);
        }
    });

    socket.on('execution', (playerInfo) => {
        let agent = playerInfo.name
        let roomID = playerInfo.roomID
        let executed = rooms[roomID]["missions"][agent]["target"]


        let executedsTarget = rooms[roomID]["missions"][executed]["target"]
        let executedWords = rooms[roomID]["missions"][executed]["words"]

        let executedSocket = rooms[roomID]["users"][executed]
        let agentSocket = rooms[roomID]["users"][agent]

        if (executedsTarget == agent) {
            agentSocket.emit("winner", agent);
            if (executedSocket) {
                executedSocket.emit("executed", (agent))
            }
        }

        let mission = {
            "target": executedsTarget,
            "words": executedWords
        }

        rooms[roomID]["missions"][agent]["target"] = executedsTarget
        rooms[roomID]["missions"][agent]["words"].push(...executedWords)

        agentSocket.emit("mission", mission);
        if (executedSocket) {
            executedSocket.emit("executed", (agent))
        }
    })

    socket.on('disconnecting', () => {
        if (Object.keys(socket.rooms).length > 1) {

            let roomID = Object.keys(socket.rooms)[1]

            if (rooms[roomID]["gameState"] == "started") {
                return;
            }

            let playerToRemove = getKeyByValue(rooms[roomID]["users"], socket)
            //delete users.socket;
            delete rooms[roomID]["users"][playerToRemove];
            rooms[roomID]["players"].splice(rooms[roomID]["players"].indexOf(playerToRemove), 1);
            if (rooms[roomID]["players"].length < 1) {
                delete rooms[roomID];
            } else {
                io.to(roomID).emit("players", rooms[roomID]["players"])
            }
        }
    })
})


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('listening on *:3000');
});


function generateWords() {
    var word1 = wordList[Math.floor(Math.random() * wordList.length)];
    wordList.splice(wordList.indexOf(word1), 1);
    var word2 = wordList[Math.floor(Math.random() * wordList.length)];
    wordList.splice(wordList.indexOf(word2), 1);
    var word3 = wordList[Math.floor(Math.random() * wordList.length)];
    wordList.splice(wordList.indexOf(word3), 1)

    return [word1, word2, word3]
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function makeid() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for (var i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}