const { spawn } = require("child_process")
const path = require("path")
const cmd = spawn(path.join(__dirname, "proc"), ["arg1", "arg2"]) // Change this...
const net = require("net")

const name = "Modfinity Console"
const ver = "1.0.0"

let users = require("./users.json")

var clients = []

cmd.stdout.on("data", e => {
    process.stdout.write(e.toString())
    if(clients.length >= 1) {
        clients.forEach(t => {
                if(t.isLoggedin) {
                        t.write(e.toString() + "\r")
                }
        })
    }
})

process.stdin.on("data", data => {
    cmd.stdin.write(data)
})

var server = net.createServer((socket) => {
    socket.isLoggedin = false
    socket.username = ""
    socket.isUsername = false
    clients.push(socket)
    console.log("[TCPStream] " + socket.localAddress + ":" + socket.localPort + " has connected")
    socket.write("Connected to " + name + " v" + ver + "\r\nUsername: ")
    socket.on('end', () => {
        clients.splice(clients.indexOf(socket), 1)
    })
    socket.on("data", data => {
        if(socket.isLoggedin) {
            if(("" + data.toString()).replace("\r", "").replace("\n", "") == "quit") {
                socket.end()
            } else {
                cmd.stdin.write(data)
            }
        } else if(!socket.isUsername) {
            var user_contain = false
            users.forEach(user => {
                if(user.user == data.toString().replace("\r", "").replace("\n", "")) {
                    user_contain = true
                }
            })
            if(!user_contain) {
                socket.write("User not found...\r\nUsername: ")
            } else {
                socket.username = data.toString().replace("\r", "").replace("\n", "")
                socket.isUsername = true
                socket.write("Password: ")
            }
        } else if (socket.isUsername) {
            var auth = false
            users.forEach(user => {
                if(user.user == socket.username && user.pass == data.toString().replace("\r", "").replace("\n", "")) { auth = true }
            })
            socket.isLoggedin = auth
            if(!auth) {
                socket.isUsername = false
                socket.write("Incorrect Password...\r\nUsername: ")
            }
        }
    })
})

server.listen(1337)