import { Component, OnInit } from '@angular/core';
import { User } from '../user.interface';
import { Player } from '../player.interface';
import { Router } from '@angular/router';
import {NgForm} from '@angular/forms';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.css']
})
export class EntryComponent implements OnInit {

  public user: User;//represents a user
  submitType: string;// possible values: 'login' or 'signup'
  nameExists: boolean;

  constructor(private router:Router,private http: Http){}
   //
   submit(user: User) {
     //http post request
     this.http.post('/', [user,this.submitType])
     .map(res => res.json())
     .subscribe(//get the user full data from the server
       (data) => { 
           this.nameExists = false;
           if(data === 'nameExists'){//
             this.nameExists = true;
           }else{//navigate to rooms lobby
             this.router.navigate(['/lobby'],{ queryParams: data });
           }
       },
       (error) => { console.log(error);}
     );
   }
    //determine submit type by the user: log in or sign up
    determineSubmit(str:string):void{
      this.submitType = str;
    }

    ngOnInit() {
      //init the form fields
      this.user = {
        username: '',
        password: ''
    }
    this.nameExists = false;
    this.submitType = '';
  }

}
