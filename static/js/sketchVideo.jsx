import React, { Component } from 'react'
import Sketch from 'react-p5'
import {freeDraw} from "./Common";

export default class P5SketchVideo extends Component {

    constructor(props){
        super(props);
        this.state = {

        }

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    mouseClicked = (p5) => {

    };

    mouseDragged = (p5) => {

    };

    mouseReleased = (p5) => {
        this.state.mouseIsPressed = false;
    };

    mousePressed = (p5) => {
        this.state.mouseIsPressed = true;
    };

    setup = (p5, canvasParentRef) => {
        this.canvas = p5.createCanvas(window.innerWidth, window.innerHeight).parent(canvasParentRef);
    };

    draw = p5 => {
        if(this.props.paused && this.props.minify){
            freeDraw(p5, true, this.state.mouseIsPressed);
        } else {
            p5.clear()
        }
    };

    render() {
        return (
            <Sketch className={"video-sketch"} setup={this.setup} draw={this.draw} mouseClicked={this.mouseClicked} mouseReleased={this.mouseReleased} mousePressed={this.mousePressed} mouseDragged={this.mouseDragged} />
        );
    }
}
