var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require("body-parser");
//DB config
var pgp = require('pg-promise')();
const connection = 'postgres://postgres:postgres@localhost:5432/tictactoeDB';
var db = pgp(connection);
//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':true}));
app.use(express.static(path.join(__dirname, 'dist')));
//socket var's
var gameRooms = [];
var players = [];
var removeEmptyRoomsID;
//removes rooms without plyers
function removeEmptyRooms(){
  var modified = false;
  for(let i in gameRooms){
    if(gameRooms[i].players.length === 0){//if the room is empty
      //remove the room from the gameRooms array
      console.log(gameRooms);
      gameRooms.splice(i,1);
      modified = true;
    }
  }
  if(modified)
    io.emit('createRoom',gameRooms);
}
//if table "users" dosent exists, create one
db.query('CREATE TABLE IF NOT EXISTS users('
+ 'username character varying(20) NOT NULL,'
+ 'password character varying(20) NOT NULL,'
+ 'wins integer NOT NULL,'
+ 'PRIMARY KEY (username))'
)
.then((data)=>{})
.catch((error)=>{console.log(error);});
//
app.get('/',function(req,res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});
//determine the op type and handle it respectively
app.post('/',function(req,res){
  var response;
  //determine the client's op
  if(req.body[1] == 'login'){
    db.oneOrNone('SELECT * FROM users WHERE username = $1 AND password = $2',[req.body[0].username,req.body[0].password])
    .then( (data)=>{
      response = {name: data.username,wins: data.wins}
      res.json(response);
    })
    .catch( (err)=>{ console.log(err); });
  }
  //if sign-up op
  else {
    //insert a new signed-up user to users table
     db.query('INSERT INTO users(username,password,wins) VALUES($1,$2,$3)',[req.body[0].username,req.body[0].password,0])
    .then(()=>{
      //construct a response as player obj
      response = {
        name: req.body[0].username,
        wins: 0}
      res.json(response);
    })
    .catch((error)=>{
      console.log(error);
      if(error.code === '23505')//username already exists in the users table
        response = 'nameExists';
        res.json(response);//send undefined
    })
  }
})//end of post
//
app.get('/gameRooms',function(req,res){
  res.json(gameRooms);
});
//
app.post('/game',function(req,res){
  db.query('UPDATE users SET wins = $2 WHERE username = $1 ',[req.body.name,req.body.wins])
          .then(function(data) {console.log('win update success');})
          .catch(function(error) {console.log(error);});
});
//update user's wins
app.get('/topPlayers',function(req,res){
  db.query('SELECT username,wins FROM users ORDER BY wins DESC LIMIT 10')
      .then(function(data) {res.json(data);})
      .catch(function(error) {console.log('error: ' + error);});
});
//
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io').listen(server);
//sockt io code
io.on('connection', function(socket){
  console.log('connected: ' + socket.id);
  removeEmptyRoomsID = setInterval(removeEmptyRooms,10000);
  //
  socket.on('updateBoard',function(data){
    if(data.type === 'init'){
      var randShape = (Math.random() >= 0.5)?'X':'O';
      io.sockets.in(data.roomName).emit('updateBoard', {board:data.board,type:'init',shape:randShape} );
    }
    else {//type : update
      var currentShape = (data.currentShape === 'X')?'O':'X';//switch shape
      io.sockets.in(data.roomName).emit('updateBoard',{board:data.board, shape: currentShape} );
    }
  });
  //create a room
  socket.on('createRoom',function(data){
    clearInterval(removeEmptyRoomsID);
    gameRooms.push(data);//push a new room Obj to gameRooms
    io.emit('createRoom',gameRooms);
  });
  // join a room
  socket.on('joinRoom',function(data){
    clearInterval(removeEmptyRoomsID);
    var currentPlayer = data.players[data.players.length-1];
    //get the cuurent room form the rooms list
    var currentRoom = gameRooms.find(function(room){
       if(room.name === data.name){
         room.players.push(currentPlayer);//push the last player to the room players
         return room;
      }
    });
    //join the current player to the room
    socket._rooms.push({roomName: currentRoom.name, playerName: currentPlayer.name});
    //join the current socket to the room
    socket.join(data.name);
    //inc the number of players in the current room
    io.sockets.in(data.name).emit('message',{msg:'player joined ' + currentRoom.name + ' room ',numOcfPlayers: currentRoom.players.length });
    io.sockets.in(data.name).emit('gameData',currentRoom);
    io.emit('createRoom',gameRooms);
  });

  socket.on('leaveRoom',function(data){
    removeEmptyRoomsID = setInterval(removeEmptyRooms,10000);
    io.sockets.in(data.roomName).emit('endOfGame',{state:data.state,winner:data.winner});
    socket.leave(data.roomName);
    //find the current room and clear the players
    gameRooms.find(function(room){
      if(data.roomName === room.name)
        room.players = [];
    });
    io.emit('createRoom',gameRooms);
  });

  socket.on('disconnect', function(){
    //find the room of the current player and alter the players array
    clearInterval(removeEmptyRoomsID);
    if(socket._rooms.length > 0){
      var temp = gameRooms.find(function(room){
       return room.name === socket._rooms[0].roomName;
      });
      //find the index of the current player/socket
      var index = temp.players.findIndex(function(player){
        return player.name === socket._rooms[0].playerName;
      });
      temp.players.splice(index,1);
      socket.leave(temp.name);
      io.sockets.in(temp.name).emit('gameData',temp);
      io.emit('createRoom',gameRooms);
    }
  });
});//end of sockets section
