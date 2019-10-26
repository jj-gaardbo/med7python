import React from "react";
import DataHandler from "./DataHandler";
import P5Sketch from './sketch.js';
import P5FreeSketch from './sketchFree.js';
import ReactFileDrop from "./FileDrop";
import {B4, SETAWAY, SETHOME} from "./Constants";
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
            paused: null,
            newframe: false,
            ball_action: null,
            actions: {
                b4: 0,
                set_away: 0,
                set_home: 0
            }
        };

        this.openFreeHandSketch = this.openFreeHandSketch.bind(this);
    }

    handleChange = (frameData) => {
        let parsed = JSON.parse(frameData);
        if(parsed.ball.hasOwnProperty("action")){
            switch(parsed.ball.action){
                case B4:
                    this.state.actions.b4++;
                case SETAWAY:
                    this.state.actions.set_away++;
                case SETHOME:
                    this.state.actions.set_home++;
            }
            this.setState({ball_action: parsed.ball.action});
        }
        this.setState({current_frame:parsed,status:parsed.ball.status,possession:parsed.ball.possession});
    };

    handlePause = (paused, newframe=false) => {
        this.setState({paused:paused})
        if(newframe){
            this.setState({newframe:newframe})
        }
    };

    handleMeta = (metaData) => {
        if(metaData !== null){
            this.setState({meta_data:metaData})
        }
    };

    handleFileUploaded = (msg, timer = 0) => {
        if(msg === "xml"){
            this.setState({has_meta_file:true})
        } else if (msg === "dat"){
            this.setState({has_data_file:true})
            if(timer !== 0){
                clearInterval(timer);
            }
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
                    <P5FreeSketch possession={this.state.possession}/>
                </div>
                ) : (
                    <div>
                    {!this.state.has_files ? (
                        <ReactFileDrop callback={this.handleFileUploaded} freehandSketch={this.openFreeHandSketch}></ReactFileDrop>
                    ) : (
                        <div className='header-contents'>
                            <DataHandler callback={this.handleChange} metaCallback={this.handleMeta} pauseCallback={this.handlePause}/>
                            {this.state.meta_data !== null &&
                                <div>
                                    <P5Sketch meta_data={this.state.meta_data} current_frame={this.state.current_frame} paused={[this.state.paused, this.state.newframe]}></P5Sketch>
                                </div>
                            }
                            <div className="match-details">
                                <h2>Details:</h2>
                                {this.state.current_frame &&
                                    <p>TimeFrame: {this.state.current_frame.timestamp}</p>
                                }
                                <p>Status: {this.state.status}</p>
                                <p>Possession: {this.state.possession}</p>
                                {this.state.ball_action !== null &&
                                    <p>Action: {this.state.ball_action}</p>
                                }
                                <p>B4: {this.state.actions.b4}</p>
                                <p>SetAway: {this.state.actions.set_away}</p>
                                <p>SetHome: {this.state.actions.set_home}</p>
                            </div>
                        </div>
                    )}
                    </div>
                )}
            </div>
        )
    }
}
