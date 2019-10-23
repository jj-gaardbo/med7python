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

export class Ball {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.r = 10;
        this.id = "ball";
        this.is_clicked = false;
        this.is_dragged = false;
        this.is_pressed = false;
    }

    display = function(p5){
        p5.stroke(0);
        p5.fill(255);
        p5.ellipse(this.x, this.y, this.r, this.r);
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

export class Player {
    constructor(x, y, team, id){
        this.x = x;
        this.y = y;
        this.r = 20;
        this.team = team;
        this.id = id;
        this.is_clicked = false;
        this.is_dragged = false;
        this.is_pressed = false;
    }

    display = function(p5){
        p5.stroke(255);
        if(this.team === "H"){
            p5.fill("blue")
        } else {
            p5.fill("red")
        }
        p5.ellipse(this.x, this.y, this.r, this.r);
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

export default class P5FreeSketch extends Component {
    bg;
    canvas;
    player_iter = -1;

    h_team = [];
    a_team = [];
    playerObjects = [];
    show_voronoi = true;
    show_convex_hull = false;
    show_convex_hull_h = true;
    show_convex_hull_a = false;

    constructor(props){
        super(props);
        this.state = {
            players: [],
            ball: null,
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
        this.state.points = [];
        this.state.points_h = [];
        this.state.points_a = [];
        for(let i = 0; i < this.state.players.length; i++){
            let position = [this.state.players[i].x, this.state.players[i].y];
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

    placePlayer(x, y){
        if(this.player_iter === 22){
            this.setState({placePlayers:false});
            this.props.callback(this.state);
            return;
        }
        let team = this.checkteam();
        let player = new Player(x, y, team, this.player_iter);
        this.state.players.push(player);
        this.player_iter++;
        if(team === HOME){
            this.h_team.push(player);
        } else {
            this.a_team.push(player);
        }

    }

    mouseClicked = (p5) => {
        let toolstate = this.props.sidebarStates;
        if(toolstate.placePlayers && !toolstate.menuOpen){
            if(this.player_iter === -1){
                this.player_iter++;
                return;
            }
            this.placePlayer(p5.mouseX, p5.mouseY)
        }
        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].clicked(p5);
        }
        this.state.ball.clicked(p5);
    };

    mouseDragged = (p5) => {
        for(let i = 0; i < this.state.players.length; i++){
            if(!this.state.players[i].is_pressed){continue;}
                this.state.players[i].r = 30;
                this.state.players[i].dragged(p5);
        }
        if(this.state.ball.is_pressed){
            this.state.ball.dragged(p5);
        }
    };

    mouseReleased = (p5) => {
        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].r = 20;
            this.state.players[i].is_clicked = false;
            this.state.players[i].is_dragged = false;
            this.state.players[i].is_pressed = false;
        }
        this.state.ball.r = 10;
        this.state.ball.is_clicked = false;
        this.state.ball.is_dragged = false;
        this.state.ball.is_pressed = false;
    };

    mousePressed = (p5) => {
        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].pressing(p5);
        }

        this.state.ball.pressing(p5);
    };

    setup = (p5, canvasParentRef) => {
        this.canvas = p5.createCanvas(1360, 916).parent(canvasParentRef);
        this.bg = p5.loadImage("dist/6ce1c9bce4091f1e0a741dea7c4d2564.png");
        this.setState({players:[]});
        this.setState({ball: new Ball(1360/2, 916/2)});
    };

    draw = p5 => {
        if(this.bg){
            p5.background(this.bg);
        }
        if(this.state.ball !== null){
            this.state.ball.display(p5);
        }

        if(this.state.players.length > 0 || typeof this.state.players[0] !== 'undefined'){
            for(let i = 0; i < this.state.players.length; i++){
                this.state.players[i].display(p5);
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
            <Sketch setup={this.setup} draw={this.draw} mouseClicked={this.mouseClicked} mouseReleased={this.mouseReleased} mousePressed={this.mousePressed} mouseDragged={this.mouseDragged} />
        );
    }
}
