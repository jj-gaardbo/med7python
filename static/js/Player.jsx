import {AWAY, HOME} from "./Constants";
import {scaleCoords} from "./Common";

//const allEqual = arr => arr.every( v => v === arr[0] );

function allEqual(arr) {
    if(!arr.length) return true;
    return arr.reduce(function(a, b) {return (a === b)?a:(!b);}) === arr[0];
}

export default class Player {
    constructor(x, y, team, id, shirt){
        let coords = scaleCoords(x, y);
        this.x = coords[0];
        this.y = coords[1];
        this.r = 20;
        this.team = team;
        this.shirtNum = shirt;
        this.id = id;
        this.is_clicked = false;
        this.is_dragged = false;
        this.is_pressed = false;
        this.edited = false;
        this.trail = [];
        this.recentMovement = [];
        this.exclude = false;
    }

    checkMovement = function(){
        if(this.recentMovement.length >= 20 && allEqual(this.recentMovement)){
            this.exclude = true;
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
        p5.stroke(255);
        if(this.team === HOME){
            p5.fill("blue")
        }
        else if(this.team === AWAY){
            p5.fill("red")
        }
        else {
            p5.noStroke();
            p5.fill("#00000011")
        }
        p5.ellipse(this.x, this.y, this.r, this.r);
        p5.fill(255);


        p5.text(this.shirtNum, this.x-5, this.y+5);
        p5.fill(p5.color(255,255,0));
        p5.text(this.id, this.x-5, this.y+25);
        p5.text(this.team, this.x-5, this.y+45);

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
