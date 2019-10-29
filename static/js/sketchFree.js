import React, { Component } from 'react'
import Sketch from 'react-p5'
import {Delaunay} from "d3-delaunay";
import SideBar from "./SideBar";
import Player from "./Player"
import Ball from "./Ball"
import {HOME, AWAY, HEIGHT, WIDTH} from "./Constants"
import KeyboardEventHandler from "react-keyboard-event-handler";
import {
    displayBall,
    displayConvexHull,
    displayDist,
    displayGuardiolaZones,
    displayPlayers,
    displayVoronoi,
    freeDraw
} from "./Common";

let delaunay = null;
let delaunay_h = null;
let delaunay_a = null;
let voronoi = null;
let voronoi_h = null;
let voronoi_a = null;
let context = null;

export default class P5FreeSketch extends Component {
    bg;
    canvas;
    player_iter = -1;
    h_team = [];
    a_team = [];
    playerObjects = [];
    show_voronoi = false;
    show_convex_hull = false;
    show_convex_hull_h = false;
    show_convex_hull_a = false;
    show_guardiola = false;
    show_dist = false;
    free_draw = false;

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
            dist_players: [],
            mouseIsPressed: false
        }

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updatePoints();
    }

    updatePoints(){
        this.state.points = [];
        this.state.points_h = [];
        this.state.points_a = [];
        for(let i = 0; i < this.state.players.length; i++){
            let position = [this.state.players[i].x, this.state.players[i].y];
            if(position[0] > (WIDTH-47) || position[0] < (47) || position[1] > (HEIGHT-47) || position[1] < (0+47)){
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
        voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
        voronoi.update();

        delaunay_h = Delaunay.from(this.state.points_h);
        voronoi_h = delaunay_h.voronoi([0, 0, WIDTH, HEIGHT]);
        voronoi_h.update();

        delaunay_a = Delaunay.from(this.state.points_a);
        voronoi_a = delaunay_a.voronoi([0, 0, WIDTH, HEIGHT]);
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
        if(this.free_draw){return;}

        if(this.player_iter === 22){
            this.setState({placePlayers:false});
            return;
        }
        let team = this.checkteam();
        let player = new Player(x, y, team, this.player_iter, 0);
        this.state.players.push(player);
        this.player_iter++;
        if(team === HOME){
            this.h_team.push(player);
        } else {
            this.a_team.push(player);
        }

    }

    mouseClicked = (p5) => {
        if(this.free_draw){return;}

        if(this.state.placePlayers && !this.state.menuOpen){
            if(this.player_iter === -1){
                this.player_iter++;
                return;
            }
            this.placePlayer(p5.mouseX, p5.mouseY)
        }
        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].clicked(p5);
            if(this.show_dist && this.state.players[i].is_clicked){
                this.state.dist_players.push(this.state.players[i]);
            }
        }
        this.state.ball.clicked(p5);
    };

    mouseDragged = (p5) => {
        if(this.free_draw){return;}

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
        this.state.mouseIsPressed = false;
        if(this.free_draw){return;}
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
        this.state.mouseIsPressed = true;

        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].pressing(p5);
        }

        this.state.ball.pressing(p5);
    };

    setup = (p5, canvasParentRef) => {
        this.canvas = p5.createCanvas(WIDTH, HEIGHT).parent(canvasParentRef);
        this.bg = p5.loadImage("dist/6ce1c9bce4091f1e0a741dea7c4d2564.png");
        this.setState({players:[]});
        this.setState({ball: new Ball(WIDTH/2, HEIGHT/2, 0)});
        context = p5.canvas.getContext("2d");
    };

    draw = p5 => {
        if(this.bg && !this.free_draw){
            p5.background(this.bg);
        }

        displayPlayers(p5, this.state.players, false, true, false);

        displayBall(p5, this.state.ball, false, true, false);

        this.updatePoints();

        displayVoronoi(p5, context, voronoi, delaunay, this.show_voronoi);

        displayConvexHull(p5, context, voronoi, delaunay, this.show_convex_hull, "#00ff0044");

        displayConvexHull(p5, context, voronoi_h, delaunay, this.show_convex_hull_h, "#ffffff44");

        displayConvexHull(p5, context, voronoi_a, delaunay, this.show_convex_hull_a, "#ff000044");

        displayGuardiolaZones(p5, this.show_guardiola);

        displayDist(p5, this.state.dist_players, this.show_dist);

        freeDraw(p5, this.free_draw, this.state.mouseIsPressed);
    };

    handleSidebarStates = (sidebarStates) => {
        this.state.placePlayers = sidebarStates.placePlayers;
        this.state.menuOpen = sidebarStates.menuOpen;
        this.show_voronoi = sidebarStates.show_voronoi;
        this.show_convex_hull = sidebarStates.show_convex;
        this.show_convex_hull_h = sidebarStates.show_convexH;
        this.show_convex_hull_a = sidebarStates.show_convexA;
        this.show_guardiola = sidebarStates.show_guardiola;
        this.show_dist = sidebarStates.show_dist;
        this.free_draw = sidebarStates.free_draw;
        if(!this.show_dist){
            this.state.dist_players = [];
        }

        if(sidebarStates.formation_home.length !== 0 || sidebarStates.formation_away.length !== 0){
            this.player_iter = 0;
            if(sidebarStates.formation_home.length !== 0){
                if(this.state.players.length > 0){
                    this.state.players.splice(0,11);
                }
                for(let i = 0; i < sidebarStates.formation_home.length; i++){
                    this.placePlayer(sidebarStates.formation_home[i][0], sidebarStates.formation_home[i][1]);
                }
                this.player_iter += 11
            }
            if(sidebarStates.formation_away.length !== 0){
                if(this.state.players.length > 0){
                    this.state.players.splice(11,11);
                }
                for(let i = 0; i < sidebarStates.formation_away.length; i++){
                    this.placePlayer(sidebarStates.formation_away[i][0], sidebarStates.formation_away[i][1]);
                }
                this.player_iter += 11
            }
        }
    };

    render() {
        return (
            <div>
                <SideBar freehand={true} callback={this.handleSidebarStates} sketchStates={this.state} />
                <Sketch setup={this.setup} draw={this.draw} mouseClicked={this.mouseClicked} mouseReleased={this.mouseReleased} mousePressed={this.mousePressed} mouseDragged={this.mouseDragged} />
                <KeyboardEventHandler
                    handleKeys={['v','c','h','a','g','p', 'd', 'q']}
                    onKeyEvent={(key, e) => {{
                        switch(key){
                            case 'v':
                                this.show_voronoi = !this.show_voronoi
                                return;
                            case 'c':
                                this.show_convex_hull = !this.show_convex_hull
                                return;
                            case 'h':
                                this.show_convex_hull_h = !this.show_convex_hull_h
                                return;
                            case 'a':
                                this.show_convex_hull_a = !this.show_convex_hull_a
                                return;
                            case 'g':
                                this.show_guardiola = !this.show_guardiola
                                return;
                            case 'p':
                                this.state.placePlayers = !this.state.placePlayers
                                return;
                            case 'd':
                                this.show_dist = !this.show_dist
                                return;
                            case 'q':
                                this.free_draw = !this.free_draw
                                return;
                        }
                    }}
                    } />
            </div>
        );
    }
}
