import {GRIDPADDING_H, GRIDPADDING_W, GRIDSIZE_H, GRIDSIZE_W} from "./Constants";

export default class QuantificationZone{
    constructor(p5, x, y, value){
        this.x = x;
        this.y = y;
        this.pixel = p5.createVector(x+(GRIDSIZE_W*0.5), y+(GRIDSIZE_H*0.5));
        this.value = value;
    }

    //Only for debugging (Heavy)
    display(p5){
        if(this.value !== 0){
            p5.fill(p5.color(255*this.value, 0, 0, 100*this.value));
            p5.noStroke(0);
            p5.rectMode(p5.CORNER);
            p5.rect(this.x-1, this.y-1, GRIDSIZE_W, GRIDSIZE_H);

            p5.ellipseMode(p5.CENTER);
            p5.ellipse(this.pixel.x, this.pixel.y, 2, 2);
            /*p5.stroke(0);
            p5.textAlign(p5.CENTER);
            p5.text(this.value, this.centerX, this.centerY);*/
        }
    }

}
