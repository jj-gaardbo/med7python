import React from "react";
import { slide as Menu } from 'react-burger-menu'

export default class SideBar extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            freehand: this.props.freehand,
            sketch: {},
            menuOpen: false,
            placePlayers : false,
            show_voronoi : false,
            show_convex : false,
            show_convexH : false,
            show_convexA : false,
            show_cuardiola: false,
            show_trail:false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.placePlayers = this.placePlayers.bind(this);
        this.toggleVoronoi = this.toggleVoronoi.bind(this);
        this.toggleConvex = this.toggleConvex.bind(this);
        this.toggleConvexH = this.toggleConvexH.bind(this);
        this.toggleConvexA = this.toggleConvexA.bind(this);
        this.toggleGuardiola = this.toggleGuardiola.bind(this);
        this.toggleTrail = this.toggleTrail.bind(this);
    }

    componentDidMount() {
        this.setState({sketch:this.props.sketchStates});
        this.props.callback(this.state);
    }

    handleChange(){
        console.log("CHANGE");
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

    toggleVoronoi(){
        this.state.show_voronoi = !this.state.show_voronoi;
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.sketchStates.placePlayers === false){
            this.state.placePlayers = false;
        }
    }

    render () {
        let self = this;
        // NOTE: You also need to provide styles, see https://github.com/negomi/react-burger-menu#styling
        return (
            <Menu isOpen={self.state.menuOpen} onChange={this.handleChange} onStateChange={(state) => this.handleStateChange(state)} pageWrapId={ "page-wrap" } outerContainerId={ "content" }>
                {this.state.freehand ? (
                    <button className={"btn btn-block menu btn-secondary"} onClick={ this.placePlayers }>
                        <i className="fa fa-user"></i>
                        Place players (P)
                    </button>
                ) : (
                    <button className={"btn btn-block menu "+ (this.state.show_trail ? "btn-primary":"btn-secondary")} onClick={ this.toggleTrail }>
                        <i className="fas fa-wave-square"></i>
                        Trails (T)
                    </button>
                )}

                <button className={"btn btn-block menu "+ (this.state.show_voronoi ? "btn-primary":"btn-secondary")} onClick={ this.toggleVoronoi }>
                    <i className="fas fa-gem"></i>
                    Voronoi (V)
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

            </Menu>
        );
    }
}
