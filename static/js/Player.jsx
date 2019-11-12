import {AWAY, HOME} from "./Constants";
import {scaleCoords} from "./Common";

//const allEqual = arr => arr.every( v => v === arr[0] );

function allEqual(arr) {
    if(!arr.length) return true;
    return arr.reduce(function(a, b) {return (a === b)?a:(!b);}) === arr[0];
}

export default class Player {
    constructor(x, y, team, id, shirt, teamDetails, color1, color2, teamName){
        let coords = scaleCoords(x, y);
        this.x = coords[0];
        this.y = coords[1];
        this.r = 20;
        this.team = team;
        this.team_name = "";
        this.shirtNum = shirt;
        this.id = id;
        this.is_clicked = false;
        this.is_dragged = false;
        this.is_pressed = false;
        this.is_hovered = false;
        this.has_ball = false;
        this.edited = false;
        this.trail = [];
        this.recentMovement = [];
        this.exclude = false;
        this.firstname = "";
        this.lastname = "";
        this.knownname = "";
        this.ref = "";
        this.position = "";
        this.sub_pos = "ss";
        this.status = "";
        this.color1 = "";
        this.color2 = "";
        if(typeof teamDetails !== "undefined" && teamDetails !== ""){
            this.firstname = teamDetails.first_name;
            this.lastname = teamDetails.last_name;
            this.knownname = teamDetails.known_name;
            this.ref = teamDetails.player_reference;
            this.position = teamDetails.position;
            this.sub_pos = teamDetails.sub_position;
            this.status = teamDetails.status;
        }

        if(color1 !== ""){this.color1 = color1}
        if(color2 !== null){this.color2 = color2}

        if(teamName !== ""){this.team_name = teamName}
    }

    checkMovement = function(){
        if(this.recentMovement.length >= 20 && allEqual(this.recentMovement)){
            this.exclude = true;
        }
    }

    check_possession = function(ballX, ballY, ballZ){
        let buffer = 2;
        if(ballZ > 900){
            this.has_ball = false;
            return;
        }
        if(ballX > this.x-this.r+buffer && ballX < this.x + this.r+buffer && ballY > this.y-this.r+buffer && ballY < this.y + this.r+buffer){
            this.has_ball = true;
        } else {
            this.has_ball = false;
        }
    }

    display = function(p5, trails=null, paused=false){
        if(this.exclude){ return; }

        if(!paused){
            this.trail.push(p5.createVector(this.x, this.y));
            if(this.trail.length >= 20) this.trail.shift();
        }

        if(trails && !this.edited){
            for(let i = 0; i < this.trail.length; i++){
                p5.ellipse(this.trail[i].x, this.trail[i].y, i, i);
            }
        }

        p5.strokeWeight(1);
        if(this.position === "Goalkeeper") {
            p5.stroke("#000000");
            p5.fill("#ffff00")
        }
        else if(this.color1 !== ""){
            p5.noStroke();
            p5.fill(this.color1);
            if(this.color2 !== ""){
                p5.stroke(this.color2);
            }
        }
        else if(this.team === HOME){
            p5.fill("blue")
        }
        else if(this.team === AWAY){
            p5.fill("red")
        }

        p5.textAlign(p5.LEFT);
        p5.ellipse(this.x, this.y, this.r, this.r);
        p5.strokeWeight(2);
        p5.stroke(255);
        p5.fill(255);
        p5.text(this.shirtNum, this.x-6, this.y+4);
        p5.strokeWeight(1);
        p5.stroke(0);
        p5.fill(0);
        p5.text(this.shirtNum, this.x-6, this.y+5);

        if(this.is_hovered){
            p5.textAlign(p5.CENTER);
            p5.text(this.firstname + " " + this.lastname, this.x-6, this.y+25);
            p5.text(this.position, this.x-6, this.y+45);
            if(this.sub_pos !== ""){
                p5.text(this.sub_pos, this.x-6, this.y+65);
            }
        }
    };

    hover = function(p5){
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_hovered = true;
        } else {
            this.is_hovered = false;
        }
    };

    pressing = function(p5){
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_pressed = true;
            this.edited = true;
            return this.id;
        }
    };

    clicked = function(p5){
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_clicked = true;
            this.edited = true;
            return this.id;
        }
    };

    dragged = function(p5){
        this.edited = true;
        this.r = 30;
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_dragged = true;
            this.x = p5.mouseX;
            this.y = p5.mouseY;
            return this.id;
        }
    };

    update = function(data, paused, p5){
        let coords = scaleCoords(data.x_pos, data.y_pos);
        this.x = coords[0];
        this.y = coords[1];
        this.id = data.tag_id;
        this.team = data.team;
        this.shirtNum = data.shirt_number;
 
        if(!paused){
            this.recentMovement.push(""+Math.floor(this.x)+" "+Math.floor(this.y));
            if(this.recentMovement.length >= 25){
                this.recentMovement.shift();
            }
        }
    }
}
