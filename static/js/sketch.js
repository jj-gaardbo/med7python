import React, { Component } from 'react'
import Sketch from 'react-p5'
import {Delaunay} from "d3-delaunay";

const HOME = "H";
const AWAY = "A";

let delaunay = null;
let delaunay_h = null;
let delaunay_a = null;
let voronoi = null;
let voronoi_h = null;
let voronoi_a = null;

export default class P5Sketch extends Component {
    bg;
    data;
    canvas;
    playerObjects = [];
    ball;
    show_voronoi = false;
    show_convex_hull = false;
    show_convex_hull_h = false;
    show_convex_hull_a = false;

    constructor(props){
        super(props);
        this.state = {
            players: [],
            ball:null,
            data: [],
            delaunay: null,
            points: [],
            points_h: [],
            points_a: [],
            voronoi: null,
            sidebar:{}
        }
    }

    componentDidMount = () => {
        this.setState({sidebar:this.props.sidebarStates});
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updatePoints();
        this.show_voronoi = this.props.sidebarStates.showVoronoi
        this.show_convex_hull = this.props.sidebarStates.showConvex
        this.show_convex_hull_h = this.props.sidebarStates.showConvexH
        this.show_convex_hull_a = this.props.sidebarStates.showConvexA
    }

    updatePoints(){
        if(this.props.current_frame === null || this.props.current_frame.length === 0){return;}

        this.state.players = this.props.current_frame.players;
        this.state.ball = this.props.current_frame.ball;

        this.state.points = [];
        this.state.points_h = [];
        this.state.points_a = [];
        for(let i = 0; i < this.state.players.length; i++){
            let position = [this.state.players[i].x_pos, this.state.players[i].y_pos];
            if(position[0] > (1360-47) || position[0] < (47) || position[1] > (916-47) || position[1] < (0+47)){
                continue;
            }

            if(this.state.players[i].team === HOME){
                this.state.points_h.push(position);
            } else {
                this.state.points_a.push(position);
            }
            this.state.points.push(position);
        }

        delaunay = Delaunay.from(this.state.points);
        voronoi = delaunay.voronoi([0, 0, 1360, 916]);
        voronoi.update();

        delaunay_h = Delaunay.from(this.state.points_h);
        voronoi_h = delaunay_h.voronoi([0, 0, 1360, 916]);
        voronoi_h.update();

        delaunay_a = Delaunay.from(this.state.points_a);
        voronoi_a = delaunay_a.voronoi([0, 0, 1360, 916]);
        voronoi_a.update();
    }

    checkteam(){
        if(this.h_team.length < 11){
            return HOME;
        } else if(this.a_team.length < 11){
            return AWAY
        }
    }

    mouseClicked = (p5) => {

    };

    mouseDragged = (p5) => {

    };

    mousePressed = (p5) => {

    };

    setup = (p5, canvasParentRef) => {
        this.canvas = p5.createCanvas(1360, 916).parent(canvasParentRef);
        this.bg = p5.loadImage("dist/6ce1c9bce4091f1e0a741dea7c4d2564.png");
    };

    draw = p5 => {
        if(this.bg){
            p5.background(this.bg);
        }

        if(this.state.ball){
            p5.stroke(0)
            p5.fill(255)
            p5.ellipse(this.state.ball.x_pos, this.state.ball.y_pos, 10, 10);
        }

        if(this.state.players.length > 0){
            for(let i = 0; i < this.state.players.length; i++){
                let players = this.state.players;
                if(players[i].team === HOME){
                    p5.fill("blue");
                } else {
                    p5.fill("red");
                }
                p5.stroke(255)
                p5.ellipse(players[i].x_pos, players[i].y_pos, 20, 20);
            }
        }

        this.updatePoints();

        let context = p5.canvas.getContext("2d");

        this.displayVoronoi(p5, context);

        this.convexHull_H(p5, context);

        this.convexHull_A(p5, context);
    };

    displayVoronoi(p5, context){
        if(this.show_voronoi && delaunay != null){
            p5.strokeWeight(2);
            p5.fill("#00000033");
            p5.stroke(255);
            context.beginPath();
            voronoi.update().render(context);
            voronoi.renderBounds(context);
            context.stroke();

            context.beginPath();
            voronoi.delaunay.renderPoints(context, 4);
            context.fill();

            if(this.show_convex_hull){
                context.beginPath();
                voronoi.delaunay.renderHull(context);
                context.fill();
            }
        }
    }

    convexHull_H(p5, context){
        if(this.show_convex_hull_h && delaunay_h != null){
            context.fillStyle = "#ffffff44";
            context.beginPath();
            voronoi_h.delaunay.renderHull(context);
            context.fill();
        }
    }

    convexHull_A(p5, context){
        if(this.show_convex_hull_a && delaunay_a != null){
            context.fillStyle = "#ff000044";
            context.beginPath();
            voronoi_a.delaunay.renderHull(context);
            context.fill();
        }
    }

    render() {
        return (
            <Sketch setup={this.setup} draw={this.draw} mouseClicked={this.mouseClicked} mousePressed={this.mousePressed} mouseDragged={this.mouseDragged}/>
        );
    }
}
