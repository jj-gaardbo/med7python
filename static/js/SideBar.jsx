import React from "react";
import { slide as Menu } from 'react-burger-menu'
import KeyboardEventHandler from "react-keyboard-event-handler";

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
            show_convex_exclude_keeper: false,
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
        this.toggleExcludeKeeper = this.toggleExcludeKeeper.bind(this);
        this.toggleConvexH = this.toggleConvexH.bind(this);
        this.toggleConvexA = this.toggleConvexA.bind(this);
        this.toggleGuardiola = this.toggleGuardiola.bind(this);
        this.toggleTrail = this.toggleTrail.bind(this);
        this.toggleDist = this.toggleDist.bind(this);
        this.toggleDraw = this.toggleDraw.bind(this);
        this.togglePlacePlayers = this.togglePlacePlayers.bind(this);
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
        this.setState({show_voronoi: !this.state.show_voronoi}, () => this.props.callback(this.state))
    }

    toggleVoronoiDanger(){
        this.setState({show_voronoi_danger: !this.state.show_voronoi_danger}, () => this.props.callback(this.state))
    }

    toggleConvex(){
        this.setState({show_convex: !this.state.show_convex}, () => this.props.callback(this.state))
    }

    toggleExcludeKeeper(){
        this.setState({show_convex_exclude_keeper: !this.state.show_convex_exclude_keeper}, () => this.props.callback(this.state));
    }

    toggleConvexH(){
        this.setState({show_convexH: !this.state.show_convexH}, () => this.props.callback(this.state));
    }

    toggleConvexA(){
        this.setState({show_convexA: !this.state.show_convexA}, () => this.props.callback(this.state));
    }

    toggleGuardiola(){
        this.setState({show_guardiola: !this.state.show_guardiola}, () => this.props.callback(this.state));
    }

    toggleTrail(){
        this.setState({show_trail: !this.state.show_trail}, () => this.props.callback(this.state));
    }

    toggleDist(){
        this.setState({show_dist: !this.state.show_dist}, () => this.props.callback(this.state));
    }

    toggleDraw(){
        this.setState({free_draw: !this.state.free_draw}, () => this.props.callback(this.state));
    }

    togglePlacePlayers(){
        this.setState({placePlayers: !this.state.placePlayers}, () => this.props.callback(this.state));
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
                    <button title={"Shows a small trail for the players and ball"} className={"btn btn-block menu "+ (this.state.show_trail ? "btn-primary":"btn-secondary")} onClick={ this.toggleTrail }>
                        <i className="fas fa-wave-square"></i>
                        Trails (T)
                    </button>
                )}

                <button title={"Enables a measuring tool between chosen players"} className={"btn btn-block menu "+ (this.state.show_dist ? "btn-primary":"btn-secondary")} onClick={ this.toggleDist }>
                    <i className="fas fa-ruler"></i>
                    Distances
                </button>

                <hr/>

                <button title={"Displays a Voronoi Diagram of the players"} className={"btn btn-block menu "+ (this.state.show_voronoi ? "btn-primary":"btn-secondary")} onClick={ this.toggleVoronoi }>
                    <i className="fas fa-gem"></i>
                    Spaces (V)
                </button>

                <button title={"Higlights potential danger zones in the voronoi diagram"} className={"btn btn-block menu "+ (this.state.show_voronoi_danger ? "btn-primary":"btn-secondary")} onClick={ this.toggleVoronoiDanger }>
                    <i className="fa fa-warning"></i>
                    Highlight danger zones (Z)
                </button>

                <button title={"Displays a Convex Hull for all players"} className={"btn btn-block menu "+ (this.state.show_convex ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvex }>
                    <i className="fas fa-draw-polygon"></i>
                    Shape (C)
                </button>

                <button title={"Displays a Convex Hull for the home team"} className={"btn btn-block menu "+ (this.state.show_convexH ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvexH }>
                    <i className="fas fa-draw-polygon"></i>
                    (Home) Shape (H)
                </button>

                <button title={"Displays a Convex Hull for the away team"} className={"btn btn-block menu "+ (this.state.show_convexA ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvexA }>
                    <i className="fas fa-draw-polygon"></i>
                    (Away) Shape (A)
                </button>

                {this.state.show_convexA || this.state.show_convexH &&
                <button title={"Excludes the keeper from the teams Convex Hull"} className={"btn btn-block menu "+ (this.state.show_convex_exclude_keeper ? "btn-primary":"btn-info")} onClick={ this.toggleExcludeKeeper }>
                    Exclude keeper (X)
                </button>
                }

                <hr/>

                <button title={"Shows Guardiola zones on the pitch"} className={"btn btn-block menu "+ (this.state.show_guardiola ? "btn-primary":"btn-secondary")} onClick={ this.toggleGuardiola }>
                    <i className="fas fa-th"></i>
                    Guardiola Zones (G)
                </button>

                <hr/>

                <button title={"Enables free drawing mode on the pitch"} className={"btn btn-block menu "+ (this.state.free_draw ? "btn-primary":"btn-secondary")} onClick={ this.toggleDraw }>
                    <i className="fas fa-pencil-alt"></i>
                    Draw (Q)
                </button>

                <hr/>

                <button title={"Shutdown the program and the server"} className={"btn btn-block menu shutdown btn-danger align-self-end"} onClick={ this.terminate }>
                    <i className="fas fa-close"></i>
                    Shutdown
                </button>

                <KeyboardEventHandler
                    handleKeys={['v','c','h','a','g','t', 'd', 'q','z','x', 'p']}
                    onKeyEvent={(key, e) => {{
                        switch(key){
                            case 'v':
                                this.toggleVoronoi()
                                return;
                            case 'z':
                                this.toggleVoronoiDanger()
                                return;
                            case 'c':
                                this.toggleConvex()
                                return;
                            case 'h':
                                this.toggleConvexH()
                                return;
                            case 'a':
                                this.toggleConvexA()
                                return;
                            case 'g':
                                this.toggleGuardiola()
                                return;
                            case 't':
                                this.toggleTrail()
                                return;
                            case 'd':
                                this.toggleDist()
                                return;
                            case 'q':
                                this.toggleDraw()
                                return;
                            case 'x':
                                this.toggleExcludeKeeper()
                                return;
                            case 'p':
                                this.togglePlacePlayers()
                                return;
                        }
                    }}
                    } />
            </Menu>
        );
    }
}
