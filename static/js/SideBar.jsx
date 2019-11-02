import React from "react";
import { slide as Menu } from 'react-burger-menu'

let $ = require('jquery');

export default class SideBar extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            freehand: this.props.freehand,
            sketch: {},
            menuOpen: false,
            placePlayers : false,
            show_voronoi : false,
            show_voronoi_danger: false,
            show_convex : false,
            show_convexH : false,
            show_convexA : false,
            show_cuardiola: false,
            show_trail:false,
            show_dist:false,
            free_draw:false,
            formation_home:[],
            formation_away:[]
        };

        this.handleChange = this.handleChange.bind(this);
        this.placePlayers = this.placePlayers.bind(this);
        this.selectFormation = this.selectFormation.bind(this);
        this.toggleVoronoi = this.toggleVoronoi.bind(this);
        this.toggleVoronoiDanger = this.toggleVoronoiDanger.bind(this);
        this.toggleConvex = this.toggleConvex.bind(this);
        this.toggleConvexH = this.toggleConvexH.bind(this);
        this.toggleConvexA = this.toggleConvexA.bind(this);
        this.toggleGuardiola = this.toggleGuardiola.bind(this);
        this.toggleTrail = this.toggleTrail.bind(this);
        this.toggleDist = this.toggleDist.bind(this);
        this.toggleDraw = this.toggleDraw.bind(this);
        this.terminate = this.terminate.bind(this);
    }

    componentDidMount() {
        this.setState({sketch:this.props.sketchStates});
        this.props.callback(this.state);
    }

    terminate(){
        $.post(window.location.href + 'terminate', (resp) => {
            alert("Server terminated. Goodbye!");
        });
    }

    handleChange(){
        this.props.callback(this.state);
    }

    handleStateChange (state) {
        this.setState({menuOpen: state.isOpen});
    }

    closeMenu () {
        this.setState({menuOpen: false})
    }

    placePlayers () {
        this.state.placePlayers = !this.state.placePlayers;
        this.state.menuOpen = false;
        this.props.callback(this.state);
        this.closeMenu();
    }

    selectFormation(event){
        let formation = JSON.parse(event.target.value);
        let team = event.target.name;
        if(team === "H"){
            this.state.formation_home = formation;
        } else {
            this.state.formation_away = formation;
        }
        this.props.callback(this.state);
        this.state.formation_home = [];
        this.state.formation_away = [];
    }

    toggleVoronoi(){
        this.state.show_voronoi = !this.state.show_voronoi;
        this.props.callback(this.state);
    }

    toggleVoronoiDanger(){
        this.state.show_voronoi_danger = !this.state.show_voronoi_danger;
        this.props.callback(this.state);
    }

    toggleConvex(){
        this.state.show_convex = !this.state.show_convex;
        this.props.callback(this.state);
    }

    toggleConvexH(){
        this.state.show_convexH = !this.state.show_convexH;
        this.props.callback(this.state);
    }

    toggleConvexA(){
        this.state.show_convexA = !this.state.show_convexA;
        this.props.callback(this.state);
    }

    toggleGuardiola(){
        this.state.show_guardiola = !this.state.show_guardiola;
        this.props.callback(this.state);
    }

    toggleTrail(){
        this.state.show_trail = !this.state.show_trail;
        this.props.callback(this.state);
    }

    toggleDist(){
        this.state.show_dist = !this.state.show_dist;
        this.props.callback(this.state);
    }

    toggleDraw(){
        this.state.free_draw = !this.state.free_draw;
        this.props.callback(this.state);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.sketchStates.placePlayers === false){
            this.state.placePlayers = false;
        }
    }

    render () {
        let self = this;
        return (
            <Menu isOpen={self.state.menuOpen} onChange={this.handleChange} onStateChange={(state) => this.handleStateChange(state)} pageWrapId={ "page-wrap" } outerContainerId={ "content" }>
                {this.state.freehand ? (
                    <div>

                        <button className={"btn btn-block menu btn-secondary"} onClick={ this.placePlayers }>
                            <i className="fa fa-user"></i>
                            Place players (P)
                        </button>

                        <hr/>
                        <label htmlFor="formation-h">
                            <select name="H" id="formation-h" onChange={this.selectFormation} defaultValue={0}>
                                <option disabled value={0}>Formation Home</option>
                                <option value={"[[112,462],[296,336],[296,586],[296,778],[296,142],[435,142],[435,337],[435,584],[435,778],[570,242],[570,683]]"}>4-4-2</option>
                                <option value={"[[112,462],[295,145],[295,336],[295,587],[295,779],[537,464],[611,464],[537,190],[537,729],[412,683],[412,241]]"}>4-2-3-1</option>
                            </select>
                        </label>

                        <label htmlFor="formation-a">
                            <select name="A" id="formation-a" onChange={this.selectFormation} defaultValue={0}>
                                <option disabled value={0}>Formation Away</option>
                                <option value={"[[1247,464],[1066,336],[1066,586],[1066,778],[1066,142],[929,142],[929,337],[929,584],[929,778],[823,242],[824,683]]"}>4-4-2</option>
                                <option value={"[[1248,463],[1067,338],[1068,586],[1066,776],[1067,145],[750,462],[823,461],[961,240],[964,683],[825,730],[821,189]]"}>4-2-3-1</option>
                            </select>
                        </label>

                    </div>
                ) : (
                    <button className={"btn btn-block menu "+ (this.state.show_trail ? "btn-primary":"btn-secondary")} onClick={ this.toggleTrail }>
                        <i className="fas fa-wave-square"></i>
                        Trails (T)
                    </button>
                )}

                <button className={"btn btn-block menu "+ (this.state.show_dist ? "btn-primary":"btn-secondary")} onClick={ this.toggleDist }>
                    <i className="fas fa-ruler"></i>
                    Distances
                </button>

                <button className={"btn btn-block menu "+ (this.state.show_voronoi ? "btn-primary":"btn-secondary")} onClick={ this.toggleVoronoi }>
                    <i className="fas fa-gem"></i>
                    Voronoi (V)
                </button>

                <button className={"btn btn-block menu "+ (this.state.show_voronoi_danger ? "btn-primary":"btn-secondary")} onClick={ this.toggleVoronoiDanger }>
                    <i className="fa fa-warning"></i>
                    Highlight danger zones (Z)
                </button>

                <button className={"btn btn-block menu "+ (this.state.show_convex ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvex }>
                    <i className="fas fa-draw-polygon"></i>
                    Convex hull (C)
                </button>

                <button className={"btn btn-block menu "+ (this.state.show_convexH ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvexH }>
                    <i className="fas fa-draw-polygon"></i>
                    (Home) Convex hull (H)
                </button>

                <button className={"btn btn-block menu "+ (this.state.show_convexA ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvexA }>
                    <i className="fas fa-draw-polygon"></i>
                    (Away) Convex hull (A)
                </button>

                <button className={"btn btn-block menu "+ (this.state.show_guardiola ? "btn-primary":"btn-secondary")} onClick={ this.toggleGuardiola }>
                    <i className="fas fa-th"></i>
                    Guardiola Zones (G)
                </button>

                <hr/>

                <button className={"btn btn-block menu "+ (this.state.free_draw ? "btn-primary":"btn-secondary")} onClick={ this.toggleDraw }>
                    <i className="fas fa-pencil-alt"></i>
                    Draw (Q)
                </button>

                <hr/>

                <button className={"btn btn-block menu shutdown btn-danger align-self-end"} onClick={ this.terminate }>
                    <i className="fas fa-close"></i>
                    Shutdown
                </button>

            </Menu>
        );
    }
}
