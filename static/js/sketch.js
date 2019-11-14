import React, { Component } from 'react'
import Sketch from 'react-p5'
import {Delaunay} from "d3-delaunay";
import SideBar from "./SideBar";
import Player from "./Player"
import Ball from "./Ball"
import {HOME, AWAY, HEIGHT, WIDTH} from "./Constants"
import KeyboardEventHandler from 'react-keyboard-event-handler';
import {
    checkPossession,
    displayBall,
    displayConvexHull, displayDangerZones,
    displayDist,
    displayGuardiolaZones,
    displayPlayers,
    displayVoronoi, drawGrid,
    freeDraw, scaleCoords, setupGrid
} from "./Common";
import Draggable from 'react-draggable';

let delaunay = null;
let delaunay_h = null;
let delaunay_a = null;
let voronoi = null;
let voronoi_h = null;
let voronoi_a = null;
let context = null;

export default class P5Sketch extends Component {
    bg;
    data;
    canvas;
    playerObjects = [];
    ball;
    show_voronoi = false;
    show_voronoi_danger = false;
    show_convex_hull = false;
    show_convex_hull_h = false;
    show_convex_hull_a = false;
    show_convex_hull_exclude = false;
    show_guardiola = false;
    show_dist = false;
    free_draw = false;
    show_trail = false;
    first_period_start = 0;
    first_period_end = 0;
    second_period_start = 0;
    second_period_end = 0;
    third_period_start = 0;
    third_period_end = 0;
    fourth_period_start = 0;
    fourth_period_end = 0;
    trails = []


    constructor(props){
        super(props);
        this.state = {
            players: [],
            allSet: false,
            paused:null,
            edited: false,
            dragging:false,
            ball:null,
            data: [],
            meta_data: null,
            points: [],
            points_h: [],
            points_a: [],
            timestamp: 0,
            period:0,
            dist_players: [],
            mouseIsPressed: false,
            zones: [],
            team_data: []
        }
    }

    componentDidMount = () => {
        this.setState({paused:this.props.paused});
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.state.team_data.length === 0){
            this.state.team_data = this.props.team_data
        }
        this.updatePoints();
        if(!this.state.paused){
            this.free_draw = false;
        }
    }

    getPlayerTeam(teamLetter){
        if(this.state.team_data.length === 0){ return; }
        for(let i = 0; i<this.state.team_data.length;i++){
            if(this.state.team_data[i].team_letter === teamLetter){
                return this.state.team_data[i];
            }
        }
        return []
    }

    getPlayerDetails(shirtNumber, team){
        if(team.length === 0){return []}
        for(let j = 0; j<team.players.length;j++){
            let player = team.players[j];
            if(parseInt(player.shirt_number) === parseInt(shirtNumber)){
                return player;
            }
        }
    }

    setupPlayers(players){
        for(let i = 0; i < players.length; i++){
            if(this.validatePlayer(players[i])){
                let team = this.getPlayerTeam(players[i].team);
                let playerDetails = this.getPlayerDetails(players[i].shirt_number, team);
                this.state.players.push(new Player(players[i].x_pos, players[i].y_pos, players[i].team, players[i].tag_id, players[i].shirt_number, playerDetails, team.color_primary, team.color_secondary, team.name));
            }
        }
        this.state.allSet = true;
    }

    search(shirtNum, id, team, array){
        for (let i=0; i < array.length; i++) {
            if ( array[i].team === team && parseInt(array[i].shirtNum) === parseInt(shirtNum) ) {
                return {"index":i,"player":array[i]};
            }
        }
        return null;
    }

    validatePlayer(player){
        let isValid = true;

        //Player does not have a team
        if(!player.team.match((/^([HA])$/))){
            isValid = false;
        }

        //Person is not a player
        if(parseInt(player.shirt_number) === -1){
            isValid = false;
        }

        return isValid;
    }

    cleanPlayers(p5){
        let size = this.state.players.length;
        for(let i = 0; i < size; i++) {
            if(typeof this.state.players[i] !== "undefined"){
                this.state.players[i].checkMovement();
                if (this.state.players[i].exclude) {
                    this.state.players.splice(i, 1);
                    continue;
                }
            }
        }
    }

    updatePlayers(newFramePlayers, p5, clearTrails = false){
        for(let p = 0; p < newFramePlayers.length; p++){
            let results = this.search(newFramePlayers[p].shirt_number, newFramePlayers[p].tag_id, newFramePlayers[p].team, this.state.players);
            if(results){
                this.state.players[results.index].update(newFramePlayers[p], this.state.paused);
            } else {
                if(this.validatePlayer(newFramePlayers[p])){
                    let team = this.getPlayerTeam(newFramePlayers[p].team);
                    let playerDetails = this.getPlayerDetails(newFramePlayers[p].shirt_number, team);
                    this.state.players.push(new Player(newFramePlayers[p].x_pos, newFramePlayers[p].y_pos, newFramePlayers[p].team, newFramePlayers[p].tag_id, newFramePlayers[p].shirt_number, playerDetails, team.color_primary, team.color_secondary, team.name));
                }
            }
        }
    }

    check_timestamp(){
        if(this.state.timestamp > this.first_period_start && this.state.timestamp < this.first_period_end){
            this.state.period = 1;
        } else if(this.state.timestamp > this.second_period_start && this.state.timestamp < this.second_period_end){
            this.state.period = 2;
        } else if(this.state.timestamp > this.third_period_start && this.state.timestamp < this.third_period_end){
            this.state.period = 3;
        } else if(this.state.timestamp > this.fourth_period_start && this.state.timestamp < this.fourth_period_end){
            this.state.period = 4;
        }
    }

    updatePoints(p5){
        if(this.props.current_frame === null || this.props.current_frame.length === 0){return;}

        if(!this.state.allSet){
            this.setupPlayers(this.props.current_frame.players);
        }

        this.state.timestamp = parseInt(this.props.current_frame.timestamp);
        this.check_timestamp();

        if(!this.state.paused){
            this.state.edited = false;
            this.updatePlayers(this.props.current_frame.players, p5);
            let ballCoords = scaleCoords(this.props.current_frame.ball.x_pos, this.props.current_frame.ball.y_pos);
            this.state.ball.x = ballCoords[0];
            this.state.ball.y = ballCoords[1];
            this.state.ball.z = this.props.current_frame.ball.z_pos;
        }
        this.state.paused = this.props.paused[0];
        if(this.props.paused[1] && !this.state.edited){
            this.updatePlayers(this.props.current_frame.players,p5, true);
            this.props.paused[1] = false;
            this.state.ball.trail = [];
            this.state.ball.edited = false;
            this.state.free_draw = false;
        }

        this.state.points = [];
        this.state.points_h = [];
        this.state.points_a = [];
        for(let i = 0; i < this.state.players.length; i++){
            if(this.state.players[i].team !== HOME && this.state.players[i].team !== AWAY){continue;}
            let position = [this.state.players[i].x, this.state.players[i].y];
            if(position[0] > (WIDTH-47) || position[0] < (47) || position[1] > (HEIGHT-47) || position[1] < (47)){
                continue;
            }

            this.state.points.push(position);

            if(this.state.players[i].position === "Goalkeeper" && this.show_convex_hull_exclude){continue;}

            if(this.state.players[i].team === HOME){
                this.state.points_h.push(position);
            } else if(this.state.players[i].team === AWAY) {
                this.state.points_a.push(position);
            }
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

    mouseClicked = (p5) => {
        if(!this.state.paused){return;}
        if(this.free_draw){return;}

        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].clicked(p5);
            if(this.show_dist && this.state.players[i].is_clicked){
                let results = this.search(this.state.players[i].shirtNum, this.state.players[i].id, this.state.players[i].team, this.state.dist_players);
                if(results !== null){

                }
                this.state.dist_players.push(this.state.players[i]);
            }
        }
        this.state.ball.clicked(p5);
    };

    mouseDragged = (p5) => {
        if(!this.state.paused){return;}
        if(this.free_draw){return;}

        for(let i = 0; i < this.state.players.length; i++){
            if(!this.state.players[i].is_pressed){continue;}
            this.state.edited = true;
            this.state.players[i].r = 30;
            this.state.players[i].dragged(p5);
        }
        if(this.state.ball.is_pressed){
            this.state.ball.dragged(p5);
            this.state.edited = true;
        }


    };

    mouseReleased = (p5) => {
        if(!this.state.paused){return;}
        this.state.mouseIsPressed = false;

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
        if(!this.state.paused){return;}
        this.state.mouseIsPressed = true;

        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].pressing(p5);
        }

        this.state.ball.pressing(p5);
    };

    mouseMoved = (p5) => {
        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].hover(p5);
        }
    };

    setup = (p5, canvasParentRef) => {
        let self = this;
        this.canvas = p5.createCanvas(WIDTH, HEIGHT).parent(canvasParentRef);
        this.bg = p5.loadImage("dist/6ce1c9bce4091f1e0a741dea7c4d2564.png");
        this.setState({ball: new Ball(WIDTH/2, HEIGHT/2, 0), meta_data:this.props.meta_data}, function(){
            let periods = this.state.meta_data.periods;
            self.first_period_start = parseInt(periods['1'].start_frame);
            self.first_period_end = parseInt(periods['1'].end_frame);
            self.second_period_start = parseInt(periods['2'].start_frame);
            self.second_period_end = parseInt(periods['2'].end_frame);
            self.third_period_start = parseInt(periods['3'].start_frame);
            self.third_period_end = parseInt(periods['3'].end_frame);
            self.fourth_period_start = parseInt(periods['4'].start_frame);
            self.fourth_period_end = parseInt(periods['4'].end_frame);
        });
        context = p5.canvas.getContext("2d");
        this.state.zones = setupGrid(p5);
    };

    draw = p5 => {
        if(this.bg && !this.free_draw){
            //p5.background(this.bg);
        }

        if(!this.free_draw){
            p5.clear();
        }

        this.updatePoints(p5);

        displayVoronoi(p5, context, voronoi, delaunay, this.show_voronoi);

        displayDangerZones(p5, voronoi, this.show_voronoi_danger);

        displayConvexHull(p5, context, voronoi, delaunay, this.show_convex_hull, "#00ff0044");

        displayConvexHull(p5, context, voronoi_h, delaunay, this.show_convex_hull_h, "#ffffff44");

        displayConvexHull(p5, context, voronoi_a, delaunay, this.show_convex_hull_a, "#ff000044");

        displayGuardiolaZones(p5, this.show_guardiola);

        displayDist(p5, this.state.dist_players, this.show_dist);

        freeDraw(p5, this.free_draw, this.state.mouseIsPressed);

        if(this.show_trail){
            for(let i = 0; i<this.trails.length;i++){
                p5.ellipse(this.trails[i][0], this.trails[i][1],5, 5);
            }
        }

        displayPlayers(p5, this.state.players, this.show_trail, this.state.paused, this.state.edited, this.show_dist);

        displayBall(p5, this.state.ball, this.show_trail, this.state.paused, this.state.edited);

        checkPossession(this.state.ball, this.state.players, this.props.possessioncb);

        //drawGrid(p5, this.state.zones);
    };

    handleSidebarStates = (sidebarStates) => {
        this.state.menuOpen = sidebarStates.menuOpen;
        this.show_voronoi = sidebarStates.show_voronoi;
        this.show_voronoi_danger = sidebarStates.show_voronoi_danger;
        this.show_convex_hull = sidebarStates.show_convex;
        this.show_convex_hull_h = sidebarStates.show_convexH;
        this.show_convex_hull_a = sidebarStates.show_convexA;
        this.show_convex_hull_exclude = sidebarStates.show_convex_exclude_keeper;
        this.show_guardiola = sidebarStates.show_guardiola;
        this.show_trail = sidebarStates.show_trail;
        this.show_dist = sidebarStates.show_dist;
        this.free_draw = sidebarStates.free_draw;
        if(!this.show_dist){
            this.state.dist_players = [];
        }
    };

    handleDragging(bool){
        this.state.dragging = bool
        this.props.dragCallback(bool)
        return true;
    }

    render() {
        return (
            <div>
                <SideBar freehand={false} callback={this.handleSidebarStates} sketchStates={this.state} />

                <Draggable
                    onMouseDown={(e) => this.handleDragging(true)}
                    onStop={() => this.handleDragging(false)}
                    handle=".handle">
                    <div className={"drag-handle " + (this.props.minify ? 'minify handle ' : 'reset ') + (this.props.larger ? 'larger' : '')}>
                        <Sketch setup={this.setup} draw={this.draw} mouseMoved={this.mouseMoved} mouseClicked={this.mouseClicked} mousePressed={this.mousePressed} mouseDragged={this.mouseDragged} mouseReleased={this.mouseReleased}/>
                    </div>
                </Draggable>
                <KeyboardEventHandler
                    handleKeys={['v','c','h','a','g','t', 'd', 'q','z']}
                    onKeyEvent={(key, e) => {{
                        switch(key){
                            case 'v':
                                this.show_voronoi = !this.show_voronoi
                                return;
                            case 'z':
                                this.show_voronoi_danger = !this.show_voronoi_danger
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
                            case 't':
                                this.show_trail = !this.show_trail
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
