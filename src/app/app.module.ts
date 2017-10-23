import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {HttpClientModule} from '@angular/common/http';


import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { EntryComponent } from './entry/entry.component';
import { LobbyComponent } from './lobby/lobby.component';

import { appRouterModule } from "./app.routes";
import { DataService } from './dataService.service';




@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    EntryComponent,
    LobbyComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    appRouterModule
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
