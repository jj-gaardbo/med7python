export default class Ball {
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.max = 2000;
        this.min = 0;
        this.r = 10;
        this.id = "ball";
        this.is_clicked = false;
        this.is_dragged = false;
        this.is_pressed = false;
    }

    scaleR = function(val) {
        return (val - this.min) / (this.max - this.min);
    };

    display = function(p5){
        let scaled = this.r+this.scaleR(this.z)*20;
        p5.strokeWeight(1);
        p5.stroke(0);
        p5.fill(255);
        p5.ellipse(this.x, this.y, scaled, scaled);

    };

    pressing = function(p5){
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_pressed = true;
            return this.id;
        }
    };

    clicked = function(p5){
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_clicked = true;
            return this.id;
        }
    };

    dragged = function(p5){
        this.r = 30;
        if(p5.mouseX > this.x-this.r+5 && p5.mouseX < this.x + this.r+5 && p5.mouseY > this.y-this.r+5 && p5.mouseY < this.y + this.r+5){
            this.is_dragged = true;
            this.x = p5.mouseX;
            this.y = p5.mouseY;
            return this.id;
        }
    };
}
