import React, { Component } from 'react'
import Sketch from 'react-p5'
import {Delaunay} from "d3-delaunay";
import SideBar from "./SideBar";
import Player from "./Player"
import Ball from "./Ball"
import {HOME, AWAY} from "./Constants"
import KeyboardEventHandler from 'react-keyboard-event-handler';

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
    show_guardiola = false;
    show_dist = false;
    width = 1360;
    height = 916;
    show_trail = false;
    first_period_start = 0;
    first_period_end = 0;
    second_period_start = 0;
    second_period_end = 0;
    third_period_start = 0;
    third_period_end = 0;
    fourth_period_start = 0;
    fourth_period_end = 0;


    constructor(props){
        super(props);
        this.state = {
            players: [],
            paused:null,
            edited: false,
            ball:null,
            data: [],
            meta_data: null,
            delaunay: null,
            points: [],
            points_h: [],
            points_a: [],
            voronoi: null,
            timestamp: 0,
            period:0,
            dist_players: []
        }
    }

    componentDidMount = () => {
        this.setState({paused:this.props.paused});
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updatePoints();
    }

    setupPlayers(players){
        for(let i = 0; i < players.length; i++){
            this.state.players.push(new Player(players[i].x_pos, players[i].y_pos, players[i].team, players[i].tag_id));
        }
    }

    search(key, array){
        for (let i=0; i < array.length; i++) {
            if (parseInt(array[i].id) === parseInt(key)) {
                return {"index":i,"player":array[i]};
            }
        }
        return null;
    }

    updatePlayers(newFramePlayers, clearTrails = false){
        for(let i = 0; i < newFramePlayers.length; i++){
            let searchResult = this.search(newFramePlayers[i].tag_id, this.state.players);
            if(searchResult !== null){
                this.state.players[searchResult.index].x = newFramePlayers[i].x_pos;
                this.state.players[searchResult.index].y = newFramePlayers[i].y_pos;
                this.state.players[searchResult.index].team = newFramePlayers[i].team;
            }
        }
        if(clearTrails){
            for(let i = 0; i < this.state.players.length; i++) {
                this.state.players[i].trail = [];
                this.state.players[i].edited = false;
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

    updatePoints(){
        if(this.props.current_frame === null || this.props.current_frame.length === 0){return;}

        this.state.timestamp = parseInt(this.props.current_frame.timestamp);
        this.check_timestamp();

        if(!this.state.paused){
            this.state.edited = false;
            if(this.state.players.length === 0){
                this.setupPlayers(this.props.current_frame.players);
            } else {
                this.updatePlayers(this.props.current_frame.players);
            }
            this.state.ball.x = this.props.current_frame.ball.x_pos;
            this.state.ball.y = this.props.current_frame.ball.y_pos;
            this.state.ball.z = this.props.current_frame.ball.z_pos;
        }
        this.state.paused = this.props.paused[0];
        if(this.props.paused[1] && !this.state.edited){
            this.updatePlayers(this.props.current_frame.players,true);
            this.props.paused[1] = false;
            this.state.ball.trail = [];
            this.state.ball.edited = false;
        }

        this.state.points = [];
        this.state.points_h = [];
        this.state.points_a = [];
        for(let i = 0; i < this.state.players.length; i++){
            if(this.state.players[i].team !== HOME && this.state.players[i].team !== AWAY){continue;}
            let position = [this.state.players[i].x, this.state.players[i].y];
            if(position[0] > (1360-47) || position[0] < (47) || position[1] > (916-47) || position[1] < (0+47)){
                continue;
            }

            if(this.state.players[i].team === HOME){
                this.state.points_h.push(position);
            } else if(this.state.players[i].team === AWAY) {
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
        if(!this.state.paused){return;}

        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].clicked(p5);
            if(this.show_dist && this.state.players[i].is_clicked){
                this.state.dist_players.push(this.state.players[i]);
            }
        }
        this.state.ball.clicked(p5);
    };

    mouseDragged = (p5) => {
        if(!this.state.paused){return;}

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

        for(let i = 0; i < this.state.players.length; i++){
            this.state.players[i].pressing(p5);
        }

        this.state.ball.pressing(p5);
    };

    setup = (p5, canvasParentRef) => {
        let self = this;
        this.canvas = p5.createCanvas(1360, 916).parent(canvasParentRef);
        this.bg = p5.loadImage("dist/6ce1c9bce4091f1e0a741dea7c4d2564.png");
        this.setState({ball: new Ball(1360/2, 916/2, 0), meta_data:this.props.meta_data}, function(){
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
    };

    draw = p5 => {
        if(this.bg){
            p5.background(this.bg);
        }

        if(this.state.players.length > 0 || typeof this.state.players[0] !== 'undefined'){
            for(let i = 0; i < this.state.players.length; i++){
                this.state.players[i].display(p5, this.show_trail, this.state.paused, this.state.edited);
            }
        }

        if(this.state.ball !== null){
            this.state.ball.display(p5, this.show_trail, this.state.paused, this.state.edited);
        }

        this.updatePoints();

        let context = p5.canvas.getContext("2d");

        this.displayVoronoi(p5, context);

        this.convexHull(p5, context);

        this.convexHull_H(p5, context);

        this.convexHull_A(p5, context);

        this.guardiolaZones(p5);

        this.dist(p5);
    };

    dist(p5){
        if(!this.show_dist || this.state.dist_players.length < 2){return;}

        for(let i = 0; i < this.state.dist_players.length; i++){
            p5.strokeWeight(2);
            p5.fill("#00000033");
            p5.stroke(255);
            if(this.state.dist_players[i] && this.state.dist_players[i-1]){
                p5.line(this.state.dist_players[i].x, this.state.dist_players[i].y, this.state.dist_players[i-1].x, this.state.dist_players[i-1].y);
                let distance = p5.dist(this.state.dist_players[i].x, this.state.dist_players[i].y, this.state.dist_players[i-1].x, this.state.dist_players[i-1].y)/12;

                let midX=this.state.dist_players[i].x+((this.state.dist_players[i-1].x-this.state.dist_players[i].x)/2.0);
                let midY=this.state.dist_players[i].y+((this.state.dist_players[i-1].y-this.state.dist_players[i].y)/2.0);
                p5.fill("#000000");
                p5.noStroke();
                p5.text(distance.toFixed(2)+"m", midX, midY)
            }
        }
    }

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
        }
    }

    convexHull(p5, context){
        if(this.show_convex_hull && delaunay != null){
            context.fillStyle = "#00ff0044";
            context.beginPath();
            voronoi.delaunay.renderHull(context);
            context.fill();
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

    guardiolaZones(p5){
        if(this.show_guardiola){
            p5.strokeWeight(3);
            p5.stroke("#00009933")
            let padding = 45;
            p5.line(padding, 354, this.width-padding, 354);
            p5.line(padding, 574, this.width-padding, 574);

            p5.line(padding, 223, this.width-padding, 223);
            p5.line(padding, 705, this.width-padding, 705);

            p5.line(244, padding, 244, this.height-padding);
            p5.line(1116, padding, 1116, this.height-padding);

            p5.line(this.width/2-1, padding, this.width/2-1, this.height-padding);

            p5.line(this.width/3-20, padding, this.width/3-20, padding+178);
            p5.line(this.width/3-20, this.height-(164+padding), this.width/3-20, this.height-padding);

            p5.line(this.width-(this.width/3)+20, padding, this.width-(this.width/3)+20, padding+178);
            p5.line(this.width+20-(this.width/3), this.height-(164+padding), this.width+20-(this.width/3), this.height-padding);
        }
    }

    handleSidebarStates = (sidebarStates) => {
        this.state.menuOpen = sidebarStates.menuOpen;
        this.show_voronoi = sidebarStates.show_voronoi;
        this.show_convex_hull = sidebarStates.show_convex;
        this.show_convex_hull_h = sidebarStates.show_convexH;
        this.show_convex_hull_a = sidebarStates.show_convexA;
        this.show_guardiola = sidebarStates.show_guardiola;
        this.show_trail = sidebarStates.show_trail;
        this.show_dist = sidebarStates.show_dist;
        if(!this.show_dist){
            this.state.dist_players = [];
        }
    };

    render() {
        return (
            <div>
                <SideBar freehand={false} callback={this.handleSidebarStates} sketchStates={this.state} />
                <Sketch setup={this.setup} draw={this.draw} mouseClicked={this.mouseClicked} mousePressed={this.mousePressed} mouseDragged={this.mouseDragged} mouseReleased={this.mouseReleased}/>
                <KeyboardEventHandler
                    handleKeys={['v','c','h','a','g','t', 'd']}
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
                            case 't':
                                this.show_trail = !this.show_trail
                                return;
                            case 'd':
                                this.show_dist = !this.show_dist
                                return;
                        }
                    }}
                    } />
            </div>
        );
    }
}
