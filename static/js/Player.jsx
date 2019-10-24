export default class Player {
    constructor(x, y, team, id){
        this.x = x;
        this.y = y;
        this.r = 20;
        this.originalTeam = team;
        this.team = team;
        this.id = id;
        this.is_clicked = false;
        this.is_dragged = false;
        this.is_pressed = false;
        this.edited = false;
        this.trail = [];
    }

    display = function(p5, trails=null, paused=false){
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
        if(this.team === "H"){
            p5.fill("blue")
        } else {
            p5.fill("red")
        }
        p5.ellipse(this.x, this.y, this.r, this.r);

        p5.fill(255);
        p5.text(this.id, this.x, this.y);
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
