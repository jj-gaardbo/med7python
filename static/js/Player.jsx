import {AWAY, HOME} from "./Constants";
import {scaleCoords} from "./Common";

const allEqual = arr => arr.every( v => v === arr[0] );

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
        this.exclude = false;
    }

    checkMovement(){
        if(this.trail.length > 0 && allEqual(this.trail)){
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
        if(typeof this.shirtNum !== "undefined"){
            p5.text(this.shirtNum, this.x-5, this.y+5);
        } else {
            p5.text(this.id, this.x-5, this.y+5);
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
}
