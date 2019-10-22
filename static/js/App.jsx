import React from "react";
import DataHandler from "./DataHandler";
import P5Sketch from './sketch.js';
import ReactFileDrop from "./FileDrop";
require('../css/fullstack.css');

export default class App extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            current_frame: null,
            status: "",
            possession: "",
            meta_data: null,
            has_files:true
        };
    }

    handleChange = (frameData) => {
        let parsed = JSON.parse(frameData);
        this.setState({current_frame:parsed,status:parsed.ball.status,possession:parsed.ball.possession});
    };

    handleMeta = (metaData) => {
        if(metaData !== null){
            this.setState({meta_data:metaData})
            console.log("ONCE CALLED METHOD", metaData);
        }
    };

    handleFileUploaded = () => {
        this.setState({has_files:true})
    };

    render() {
        return(
            <div>
                {!this.state.has_files ? (
                    <ReactFileDrop callback={this.handleFileUploaded}></ReactFileDrop>
                ) : (
                    <div className='header-contents'>
                        <DataHandler callback={this.handleChange} metaCallback={this.handleMeta} />
                        {this.state.meta_data !== null &&
                        <P5Sketch current_frame={this.state.current_frame}></P5Sketch>
                        }
                        <h2>Details:</h2>
                        <p>Status: {this.state.status}</p>
                        <p>Possession: {this.state.possession}</p>
                    </div>
                )}
            </div>
        )
    }
}
