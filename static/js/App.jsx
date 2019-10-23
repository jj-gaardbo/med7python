import React from "react";
import DataHandler from "./DataHandler";
import P5Sketch from './sketch.js';
import P5FreeSketch from './sketchFree.js';
import ReactFileDrop from "./FileDrop";
import SideBar from "./SideBar";
require('../css/fullstack.css');

export default class App extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            current_frame: null,
            status: "",
            possession: "",
            meta_data: null,
            has_files:false,
            has_data_file: false,
            has_meta_file:false,
            freehand: false,
            sidebar: {},
            sketch: {}
        };

        this.openFreeHandSketch = this.openFreeHandSketch.bind(this);
    }

    handleSidebarStates = (sidebarStates) => {
        this.setState({sidebar:sidebarStates});
    };

    handleSketchChanges = (sketchStates) => {
        this.setState({sketch:sketchStates});
    };

    handleChange = (frameData) => {
        let parsed = JSON.parse(frameData);
        this.setState({current_frame:parsed,status:parsed.ball.status,possession:parsed.ball.possession});
    };

    handleMeta = (metaData) => {
        if(metaData !== null){
            this.setState({meta_data:metaData})
        }
    };

    handleFileUploaded = (msg) => {
        if(msg === "xml"){
            this.setState({has_meta_file:true})
        } else if (msg === "dat"){
            this.setState({has_data_file:true})
        }

        if(this.state.has_meta_file && this.state.has_data_file){
            this.setState({has_files:true})
        }
    };

    openFreeHandSketch = () => {
        this.setState({freehand:true});
    };

    render() {
        return(
            <div className={"main"} id="page-wrap">
                {this.state.freehand ? (
                <div className='header-contents freehand-sketch'>
                    <SideBar freehand={true} callback={this.handleSidebarStates} sketchStates={this.state.sketch}></SideBar>
                    <P5FreeSketch sidebarStates={this.state.sidebar} callback={this.handleSketchChanges}/>
                </div>
                ) : (
                    <div>
                    {!this.state.has_files ? (
                        <ReactFileDrop callback={this.handleFileUploaded} freehandSketch={this.openFreeHandSketch}></ReactFileDrop>
                    ) : (
                        <div className='header-contents'>
                            <DataHandler callback={this.handleChange} metaCallback={this.handleMeta} />
                            {this.state.meta_data !== null &&
                                <div>
                                    <SideBar freehand={false} callback={this.handleSidebarStates} sketchStates={this.state.sketch}></SideBar>
                                    <P5Sketch sidebarStates={this.state.sidebar} callback={this.handleSketchChanges} current_frame={this.state.current_frame}></P5Sketch>
                                </div>
                            }
                            <div className="match-details">
                                <h2>Details:</h2>
                                <p>Status: {this.state.status}</p>
                                <p>Possession: {this.state.possession}</p>
                            </div>
                        </div>
                    )}
                    </div>
                )}
            </div>
        )
    }
}
