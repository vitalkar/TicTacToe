import { Component, OnInit ,OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {NgForm} from '@angular/forms';
import { Player } from '../player.interface';
import { Room } from '../room.interface';
import { DataService } from '../dataService.service';



@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {

  activeRooms:any;//active game rooms
  routeData:any;//data from entry route
  player:Player;//player's details
  roomsSubscription:any;//
  room:Room;//current room
  duplicateRoomName:boolean;
  topPlayers:Array<Player>;//array of top players

  constructor(private router:Router,private activatedRoute:ActivatedRoute,private dataService:DataService) {}

  //create a game room
  createRoom(roomData: NgForm){
      //construct a room obj based on user's values
      this.room = {
        name : roomData.value.newRoomName,
        players : []
      };
      this.dataService.createRoom(this.room);//send the room obj via dataService to server
      this.joinRoom(this.room);//join the new room
  }

  //join to an active game room
  joinRoom(room){
      room.players.push(this.player);//push player to the current room players array
      this.dataService.joinRoom(room);//send & update the room data on server
      //pass the player info via query params
      this.router.navigate(['/game'], {queryParams: { roomName: room.name , playerName : this.player.name , playerWins: this.player.wins }});

  }

  //get the roomsList via http get request on init
  getRoomsList(){
    this.dataService.getRoomsList().subscribe((roomsList) => {
      this.activeRooms = roomsList;
    });
  }

  //http request for 10 best players
  getTopPlayersList(){
    this.dataService.getTopPlayersList().subscribe((playersList)=>{
      this.topPlayers = playersList;
    });
  }

  //check if the room name is already taken
  checkForDuplicity(roomName:string){
    this.duplicateRoomName = this.activeRooms.some((room)=>{
      return room.name === roomName;
    });
      return this.duplicateRoomName;
  }

  ngOnInit() {
    this.duplicateRoomName = false;
    this.activeRooms = [];//init active rooms
    this.topPlayers = [];
    this.getRoomsList();//pull active game rooms
    this.getTopPlayersList();
    this.routeData = this.activatedRoute.queryParams;
    this.player = {name: this.routeData._value.name ,wins: this.routeData._value.wins, shape:''}
    //subscribe to an observable of "game rooms" via data service
    this.roomsSubscription = this.dataService.getRooms().subscribe( (data)=>{
      this.activeRooms = data;
    });
  }

  ngOnDestroy(){
    this.roomsSubscription.unsubscribe();
    // this.topPlayersSubscription.unsubscribe();
  }

}
