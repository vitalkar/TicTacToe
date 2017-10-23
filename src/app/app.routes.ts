import { Routes, RouterModule } from '@angular/router';
import { LobbyComponent } from './lobby/lobby.component';
import { GameComponent } from './game/game.component';
import { EntryComponent } from './entry/entry.component';


// Route config let's you map routes to components
const routes: Routes = [
  {
    path: 'game',
    component: GameComponent,
  },
  // map '/persons' to the people list component
  {
    path: 'lobby',
    component: LobbyComponent,
  },
  // map '/' to '/' as our default route
  {
    path: '',
    component: EntryComponent
    // redirectTo: '/',
    // pathMatch: 'full'
  },
];

export const appRouterModule = RouterModule.forRoot(routes);
