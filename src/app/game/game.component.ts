import { Component, OnInit , OnDestroy } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { Player } from '../player.interface';
import { Room } from '../room.interface';
import { DataService } from '../dataService.service';
import { Http, Response } from '@angular/http';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit , OnDestroy {

  //players data
  player:Player;//player's info : name & wins
  opponent:Player;//opponent's info
  //game data var's
  routeData:any;//data from prev route
  room:Room;//room's info : name & numOfPlayers
  //game logic var's
  boardCells:Array<string> ;
  currentShape:string;
  winSequences:number[][];
  EMPTY:string = '';//const
  //game state var's
  winner:Player;
  start:boolean;
  endOfGame:boolean;
  draw:boolean;
  //data service subscriptions
  playersSubscription:any;//on player join
  gameDataSubscription:any;
  gameplaySubscription:any;
  gameStateSubscription:any;//on game state chnge

  constructor(private router:Router,private activatedRoute: ActivatedRoute,private dataService:DataService,private http:Http) {}
  //fill the current cell with current shape
  move(index:number):void{
    if(this.start){//
      if(this.boardCells[index] === this.EMPTY && this.endOfGame !== true && this.player.shape === this.currentShape){
        this.boardCells[index] = this.currentShape;
        this.checkForWin(index);//from step 4
        this.checkForDraw();//on last move
        this.updateBoard(this.boardCells,'update');
      }
    }
  }

  //track the index
  trackByIndex(index: number, obj: any): any{
    return index;
  }

  //checks the game state after the 4th  move in the game
  checkForWin(cell:number){
    for(let i in this.winSequences){
      //if the current cell index included in the current sequence
      if(this.winSequences[i].includes(cell)){
        //check if the current sequence cells contain the same shape
        if(this.boardCells[this.winSequences[i][0]] === this.boardCells[this.winSequences[i][1]]
           && this.boardCells[this.winSequences[i][0]] === this.boardCells[this.winSequences[i][2]]){
             //winner determination
             this.winner = (this.currentShape === this.room.players[0].shape)?this.room.players[0]:this.room.players[1];
             let temp = this.winner.wins;
             temp++;//inc winner's wins
             //update win on the server
             this.updateWin(this.winner.name,temp);
             //remove the player from the active players array in the lobby component & endOfGame state
             this.dataService.leaveRoom({roomName:this.room.name,winner:this.winner,state:'win'});
        }
      }
    }
  }

  //
  checkForDraw(){
    //check if the board is full
    this.draw = (!(this.boardCells.includes(this.EMPTY))) && (this.winner.name === this.EMPTY);
    if(this.draw)
      this.dataService.leaveRoom({roomName:this.room.name,winner:this.winner,state:'draw'});
  }

  //
  updateBoard(board,type){
    this.dataService.updateBoard({board: board,roomName: this.room.name ,currentShape: this.currentShape ,type: type});
  }
  //initalize game
  startGame(){
    this.start = true;
    //determine players shapes
    this.room.players[0].shape = 'X';
    this.room.players[1].shape = 'O';
    //assign players data
    this.room.players.forEach((player)=>{
      if(player.name === this.player.name)
        this.player = player;
      else
        this.opponent = player;
    });
    this.updateBoard(this.boardCells,'init');//init game
  }

  //update through http request
  updateWin(name,wins){
    this.http.post('/game',{name: name , wins: wins})
    .map(res => res.json())
    .subscribe(
      (data)=>{console.log("win updated")},
      (error)=>{console.log(error)});
  }
  ngOnInit(){
    this.routeData = this.activatedRoute.queryParams;
    this.start = false;
    this.endOfGame = false;
    this.draw = false;
    this.currentShape = this.EMPTY;
    this.room = {name:this.routeData._value.roomName,players:[]} ;
    //init players data
    this.player = {name:this.routeData._value.playerName,wins:this.routeData._value.playerWins,shape:''};
    this.opponent = {name:this.EMPTY,wins:0,shape:this.EMPTY};
    this.winner = {name:this.EMPTY,wins:0,shape:this.EMPTY};
    this.boardCells = ['','','','','','','','',''];
    //potential winning sequences
    this.winSequences = [
      [0,1,2],
      [3,4,5],
      [6,7,8],
      [0,3,6],
      [1,4,7],
      [2,5,8],
      [0,4,8],
      [2,4,6]
    ];
//**********************************************************************************
//SUBSCRIPTIONS
//**********************************************************************************
//get the players of the current room
this.gameDataSubscription = this.dataService.getGameData().subscribe( (data:any)=>{
    this.room = data;// assign room Obj
    if(this.room.players.length === 2){//if there are 2 players
      this.startGame();//initialize Game
    }
  });
  //observable of common data during the game
  this.gameplaySubscription = this.dataService.getBoardUpdates().subscribe((data:any)=>{
      this.boardCells = data.board;
      this.currentShape = data.shape;
  });
  //observable that get's data on the end of game
  this.gameStateSubscription = this.dataService.getGameState().subscribe((data:any)=>{
    this.endOfGame = true;
    let wins = this.player.wins;
    if(data.state === 'win'){//win
      this.winner = data.winner;
      //updating user wins on view
      if(this.player.name === this.winner.name)
        wins++;
    }  //determine winner or draw
    else{//draw
      this.draw = true;
    }
    //wait 5 sec before the redirction to lobby
    setTimeout(()=>{this.router.navigate(['/lobby'],{ queryParams: {name: this.player.name , wins: wins }});},5000);
  });
}//end of OnInit

  ngOnDestroy() {
    this.gameplaySubscription.unsubscribe();
    this.gameDataSubscription.unsubscribe();
    this.gameStateSubscription.unsubscribe();
  }

}
