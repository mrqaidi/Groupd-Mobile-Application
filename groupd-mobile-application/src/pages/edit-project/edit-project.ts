import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Events  } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { ContainsCharacterValidator } from '../../validators/contains-character-validator';

import { ProjectData } from "../../providers/project-data";
import { UserData } from "../../providers/user-data";

import { Proj } from '../../objects/project';
import { User } from "../../objects/user";

import { ProjectPage } from "../project/project";
import { HomePage } from "../home/home";

@Component({
  selector: 'page-edit-project',
  templateUrl: 'edit-project.html'
})
export class EditProjectPage {

  memFound: Boolean = true;

  found: Boolean = false;

  user: User;

  tag: String;

  member: string;

  project: Proj;

  projectId: string

  membersAdded: String[] = [];

  membersRemoved: String[] = [];

  private projectForm : FormGroup;

  constructor(public navCtrl: NavController,  public ProjectData: ProjectData, public events: Events, public UserData: UserData, public navParams: NavParams, private formBuilder: FormBuilder, public alertCtrl: AlertController) {
    this.setProjectNull();
    this.setUserNull();
    this.getUser();
    this.getProject();
    this.projectForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required, ContainsCharacterValidator.hasCharacter])],
      thumb: ['', Validators.compose([Validators.required, ContainsCharacterValidator.hasCharacter])],
      desc: ['', Validators.compose([Validators.required, ContainsCharacterValidator.hasCharacter])],
      maxMembers: ['', Validators.compose([Validators.required])] //check int maybe?
    });
  }
  getUser() {
    this.UserData.getCurrentUser().then((user) => {
      this.user = user;
      //always reload user in the case of changes
      this.UserData.getUser(this.user.username.toString()).subscribe(
            data => {
              if(data.hasOwnProperty('message')){
                //user not found
              }else{
                //user found
                  this.user = data;
                  this.UserData.setCurrentUser(this.user);
              }
            },
            err => console.log("Unsuccessful!" + err),
            () => console.log("Finished")
        );
    });
  }
  getProject(){
      //JSON.parse
      if(this.navParams.get('projectSelected')!=null||this.navParams.get('projectSelected')!=undefined){
        //reload in the case of changes
        this.ProjectData.getProject(this.navParams.get('projectSelected')).subscribe(
            data => {
              //console.log(data);
              if(!data.hasOwnProperty('message')){
                  //project found           
                  this.project=data;
                  this.projectForm.controls['name'].setValue(this.project.projectName);
                  this.projectForm.controls['thumb'].setValue(this.project.projectThumb);
                  this.projectForm.controls['desc'].setValue(this.project.projectDesc);
                  this.projectForm.controls['maxMembers'].setValue(this.project.maxMembers);
                  this.found=true;
              }
            },
            err => console.log("Unsuccessful!" + err),
            () => console.log("Finished")
        );
      }
      else{
        this.found=false;
      }
  }
  deleteMember(i){
    if(this.membersAdded.indexOf(this.project.projectMembers[i])>-1){
      this.membersAdded.splice(this.membersAdded.indexOf(this.project.projectMembers[i]), 1);
    }else{
      this.membersRemoved.push(this.project.projectMembers[i]);
    }
    this.project.projectMembers.splice(i, 1);
  }
  addTag(){
    if(this.tag == null || this.tag ==""){
        console.log("Null String");
      }
      else if(this.tag.trim().length==0){
         console.log("String Full of Spaces");
         this.tag=null;
      }
     else if(!this.project.tags.indexOf(this.tag)){
         this.tag=null;
      }
      else{
      this.project.tags.push(this.tag.replace(/^\s+|\s+$/g, ""));
      this.tag=null;
    }
  }
  addMember(){
    if(this.member == null || this.member ==""){
        console.log("Null String");
      }
      else if(this.member.trim().length==0){
         console.log("String Full of Spaces");
         this.member=null;
      }
     else if(!this.project.projectMembers.indexOf(this.member)){
         this.member=null;
      }
      else{
        this.UserData.getUser(this.member).subscribe(
            data => {
              if(data.hasOwnProperty('message')){
                //user not found
                this.memFound = false;
              }else{
                //user found
                this.memFound = true;
                if(this.membersRemoved.indexOf(this.member)>-1){
                  this.membersRemoved.splice(this.membersRemoved.indexOf(this.member), 1);
                }else{
                  this.membersAdded.push(this.member);
                }
                //this.membersAdded.push(this.member);
                this.project.projectMembers.push(this.member);
                this.member=null;
              }
            },
            err => console.log("Unsuccessful!" + err),
            () => console.log("Finished")
        );
    }
  }
  deleteTag(i){
    this.project.tags.splice(i, 1);
  }
  delete(){
    //pull down latest user doc
    //splice project ID from creator's projects
    //update & refresh global copy of user
    this.UserData.getUser(this.user.username.toString()).subscribe(
            data => {
              if(!data.hasOwnProperty('message')){
                  //user found
                  this.user = data;
                  this.user.projects.splice(this.user.projects.indexOf(this.project.projectName));
                  this.UserData.updateUser(this.user).subscribe(updatedData=>{
                    if(updatedData.hasOwnProperty('message')){
                      console.log("Error removing project from creator");
                    }else{
                      this.UserData.setCurrentUser(this.user);
                    }
                  },      
                  err =>{
                    console.log("Error removing project from creator");
                  }); 
              }
            },
            err => console.log("Unsuccessful!" + err),
            () => console.log("Finished")
        );
    //pull down member docs
    //splice project ID from projects
    //update
    for(var i = 0; i < this.project.projectMembers.length; i++){
      //pull down user
      this.UserData.getUser(this.project.projectMembers[i].toString()).subscribe(data=>{
      //splice project id from list
      data.projects.splice(data.projects.indexOf(this.project.projectId), 1);
      //update user
      this.UserData.updateUser(data).subscribe(updatedData=>{
          if(updatedData.hasOwnProperty('message')){
            console.log("Error removing project from member: " + this.project.projectMembers[i]);
          }
        },      
        err =>{
          console.log("Error removing project from member: " + this.project.projectMembers[i]);;
        });
      },
      err =>{
        console.log("Error removing project from member: " + this.project.projectMembers[i]);
      });
    }
    this.ProjectData.deleteProject(this.project.projectId.toString()).subscribe(
      data =>{
        if(data.hasOwnProperty('message')){
          this.showAlert("Success","Your project has been deleted!");
          this.navCtrl.setRoot(HomePage);
        }
      },
      err => this.showAlert("Whoops","Looks like something went wrong!"),
      () => console.log("Finished")
    );
  }
  save(){

    for(var i = 0; i < this.membersRemoved.length; i++){
      //pull down user
      this.UserData.getUser(this.membersRemoved[i].toString()).subscribe(data=>{
        //splice project id from list
        data.projects.splice(data.projects.indexOf(this.project.projectId), 1);
        //update user
        this.UserData.updateUser(data).subscribe(updatedData=>{
          if(updatedData.hasOwnProperty('message')){
            this.showAlert("Whoops","There was a problem removing the member " + this.membersRemoved[i] + " from " + this.project.projectName);
            this.project.projectMembers.push(this.membersRemoved[i]);
          }
        },      
        err =>{
          this.showAlert("Whoops","There was a problem removing the member " + this.membersRemoved[i] + " from " + this.project.projectName);
          this.project.projectMembers.push(this.membersRemoved[i]);
        });
      },
      err =>{
        this.showAlert("Whoops","There was a problem removing the member " + this.membersRemoved[i] + " from " + this.project.projectName);
        this.project.projectMembers.push(this.membersRemoved[i]);
      });
    }

    for(var i = 0; i < this.membersAdded.length; i++){
      //pull down user
      this.UserData.getUser(this.membersAdded[i].toString()).subscribe(data=>{
         //push project id to list
         data.projects.push(this.project.projectId);
        //update user
        this.UserData.updateUser(data).subscribe(updatedData=>{
          if(updatedData.hasOwnProperty('message')){
            this.showAlert("Whoops","There was a problem adding the member " + this.membersAdded[i] + " to " + this.project.projectName);
            this.project.projectMembers.splice(this.project.projectMembers.indexOf(this.membersAdded[i]), 1);
          }
        },      
        err =>{
          this.showAlert("Whoops","There was a problem adding the member " + this.membersAdded[i] + " to " + this.project.projectName);
          this.project.projectMembers.splice(this.project.projectMembers.indexOf(this.membersAdded[i]), 1);
        });
      },
      err =>{
        this.showAlert("Whoops","There was a problem adding the member " + this.membersAdded[i] + " to " + this.project.projectName);
        this.project.projectMembers.splice(this.project.projectMembers.indexOf(this.membersAdded[i]), 1);
      });
    }
    //prepare data to be sent to server
    this.project.projectName=this.projectForm.value.name.replace(/^\s+|\s+$/g, "");
    this.project.projectThumb=this.projectForm.value.thumb.replace(/^\s+|\s+$/g, "");
    this.project.projectDesc=this.projectForm.value.desc.replace(/^\s+|\s+$/g, "");
    this.project.maxMembers=this.projectForm.value.maxMembers;

    this.ProjectData.updateProject(this.project).subscribe(
      data =>{
        if(data.hasOwnProperty('message')){
          //user wasn't found
          this.showAlert("Whoops","Looks like something went wrong!");
        }else{
          //Successful
          //Save user to storage and trigger event to alert any the app page of the changes
          this.showAlert("Success","Your project has been updated!");
          this.navCtrl.setRoot(ProjectPage, {
            projectSelected: this.project.projectId
          });
        }
      },
      err => this.showAlert("Whoops","Looks like something went wrong!"),
      () => console.log("Finished")
    );
  }
  saveChanges(){
    let alert = this.alertCtrl.create({
      title: 'Just checking',
      subTitle: 'Are you sure you want to save these changes?',
      buttons: [
      {
        text: 'Close',
        role: 'cancel',
        handler: data => {}
      },
      {
        text: 'Save',
        handler: data => {
            this.save();
          }
        }
      ]
    });
    alert.present();
  }
  deleteProject(){
    let alert = this.alertCtrl.create({
      title: 'Whoa, hold up',
      subTitle: 'Are you sure you want to delete this project?',
      buttons: [
      {
        text: 'Close',
        role: 'cancel',
        handler: data => {}
      },
      {
        text: 'Delete',
        handler: data => {
            this.delete();
          }
        }
      ]
    });
    alert.present();
  }
  viewProject(){
      this.navCtrl.setRoot(ProjectPage, {
          projectSelected: this.projectId
      });
  }
  showAlert(t: string, subT: string){
    let alert = this.alertCtrl.create({
      title: t,
      subTitle: subT,
      buttons: ['Dismiss']
    });
    alert.present();
  }
  //reset project object
  setProjectNull(){
    this.project ={
      projectId: null,
      projectName: null,
      projectThumb: null,
      projectCreator: null,
      projectMembers: [],
      maxMembers: null,
      projectDesc: null,
      comments: [{
        username: null,
        comment: null,
        time: null 
      }],
      tags: [],
      time: null
    }
  }
  //reset user object
  setUserNull(){
    this.user = {
        email: null,
        username: null,
        password: null,
        firstName: null,
        surname: null,
        address: null,
        skills: [],
        bio: null,
        occupation: null,
        ratings: {
          rating: 
            {
              sum_of_rates: null,
              rate_count: null
            },
          ratedby: [
            {
              username: null,
              rate: null
            }
          ]
        },
        bookmarks: [],
        projects: []
      }
  }
}
