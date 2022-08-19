const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/src/index.html')
})




let users = []
let socketToRoom = {}

io.on('connection', socket => {
  //websocket kopunca yeni gelen kullanıcı dahil olamıyor hafızada tut
  socket.on('join', room => {
      if (users[room]) {
          users[room].push({id: socket.id})
      } else {
          users[room] = [{id: socket.id}]
      }
      socketToRoom[socket.id] = room

      socket.join(room)
      console.log(`[${socketToRoom[socket.id]}]: ${socket.id} enter`)

      const usersInThisRoom = users[room].filter(user => user.id !== socket.id)
      socket.emit('users',usersInThisRoom)
  })

  socket.on('offer', data => {
      socket.to(data.offerReceiveID).emit('offer', {sdp: data.sdp, offerSendID: data.offerSendID})
  })

  socket.on('answer', data => {
      socket.to(data.answerReceiveID).emit('answer', {sdp: data.sdp, answerSendID: data.answerSendID})
  })

  socket.on('candidate', data => {
      socket.to(data.candidateReceiveID).emit('candidate', {candidate: data.candidate, candidateSendID: data.candidateSendID})
  })

  socket.on('disconnect', () => {
      console.log(`[${socketToRoom[socket.id]}]: ${socket.id} exit`)
      const roomID = socketToRoom[socket.id]
      let room = users[roomID]
      if (room) {
          room = room.filter(user => user.id !== socket.id)
          users[roomID] = room
          if (room.length === 0) {
              delete users[roomID]
              return
          }
      }
      socket.to(roomID).emit('user_exit', {id: socket.id})
  })
})

server.listen(process.env.port || 3000, () => {
  console.log('dinleme başlasın:3000')
});
