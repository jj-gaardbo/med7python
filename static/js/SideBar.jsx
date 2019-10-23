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
            showVoronoi : false,
            showConvex : false,
            showConvexH : false,
            showConvexA : false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.placePlayers = this.placePlayers.bind(this);
        this.toggleVoronoi = this.toggleVoronoi.bind(this);
        this.toggleConvex = this.toggleConvex.bind(this);
        this.toggleConvexH = this.toggleConvexH.bind(this);
        this.toggleConvexA = this.toggleConvexA.bind(this);
    }

    componentDidMount() {
        this.setState({sketch:this.props.sketchStates});
        this.props.callback(this.state);
    }

    handleChange(){
        this.props.callback(this.state);
    }

    handleStateChange (state) {
        this.setState({menuOpen: state.isOpen});
        this.props.callback(this.state);
    }

    closeMenu () {
        this.setState({menuOpen: false})
    }

    placePlayers () {
        this.setState({placePlayers : !this.state.placePlayers});
        this.closeMenu();
        this.props.callback(this.state);
    }

    toggleVoronoi(){
        this.setState({showVoronoi:!this.state.showVoronoi});
        this.props.callback(this.state);
    }

    toggleConvex(){
        this.setState({showConvex:!this.state.showConvex});
        this.props.callback(this.state);
    }

    toggleConvexH(){
        this.setState({showConvexH:!this.state.showConvexH});
        this.props.callback(this.state);
    }

    toggleConvexA(){
        this.setState({showConvexA:!this.state.showConvexA});
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
                        Place players
                    </button>
                ) : (
                    <div></div>
                )}

                <button className={"btn btn-block menu "+ (this.state.showVoronoi ? "btn-primary":"btn-secondary")} onClick={ this.toggleVoronoi }>
                    <i className="fa fa-user"></i>
                    Show voronoi
                </button>

                <button className={"btn btn-block menu "+ (this.state.showConvex ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvex }>
                    <i className="fa fa-user"></i>
                    Show Convex hull
                </button>

                <button className={"btn btn-block menu "+ (this.state.showConvexH ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvexH }>
                    <i className="fa fa-user"></i>
                    Show Convex hull (Home)
                </button>

                <button className={"btn btn-block menu "+ (this.state.showConvexA ? "btn-primary":"btn-secondary")} onClick={ this.toggleConvexA }>
                    <i className="fa fa-user"></i>
                    Show Convex hull (Away)
                </button>

            </Menu>
        );
    }
}
