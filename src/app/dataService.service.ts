import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class DataService {
//
private url = 'http://localhost:3000';
private socket;
//
gameBoardState:Array<string>;

constructor(private http:Http) {
   this.socket = io(this.url);
}

//*********************************************************************************************************
//PLAYER DATA
//*********************************************************************************************************
//

//
getGameData(){
  let observable = new Observable(observer => {

    this.socket.on('gameData', (data) => {
      observer.next(data);
    });
  });
  return observable;
}

//*********************************************************************************************************
//GAME DATA
//*********************************************************************************************************

//update the board state
updateBoard(data:any){
  this.socket.emit('updateBoard',data);
}
//observable for board updates
getBoardUpdates(){
  let observable = new Observable(observer => {
    this.socket.on('updateBoard', (data) => {
      observer.next(data);
    });
    // return () => {
    //   this.socket.disconnect();
    // };
  });
  return observable;
}

//emit on end of game state
endOfGame(){
  this.socket.emit('endOfGame','endOfGame');
}

//observable for determine the game state end type
getGameState(){
  let observable = new Observable(observer => {
    this.socket.on('endOfGame',(data) => {
      observer.next(data);
    });
  });
  return observable;
}

//*********************************************************************************************************
//GAME ROOMS DATA
//*********************************************************************************************************

//send a room Obj to server
joinRoom(data:any){
  this.socket.emit('joinRoom',data);
}

//send a room Obj to server
createRoom(data:any){
  this.socket.emit('createRoom',data);
}

leaveRoom(data:any){
  this.socket.emit('leaveRoom',data);
}

//return the current active rooms from server`
getRooms(){
  let observable = new Observable(observer => {
    this.socket.on('createRoom', (data) => {
      observer.next(data);
    });
  });
  return observable;
}

//*****************************************************************************
//
//*****************************************************************************




// http reuest
getRoomsList(){
  return this.http.get(this.url+'/gameRooms')
  .map((response) => response.json())
  .catch((error)=>{return Observable.throw(error || 'server error')} );
}

getTopPlayersList(){
  return this.http.get(this.url+'/topPlayers')
  .map((response) =>  response.json() )
  .catch((error)=>{ return Observable.throw(error || 'server error')} );
}


//use sockets without a service

}
