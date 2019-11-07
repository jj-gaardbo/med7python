import React from "react";
import DataHandler from "./DataHandler";
import ReactPlayer from 'react-player'
import P5Sketch from './sketch.js';
import P5FreeSketch from './sketchFree.js';
import ReactFileDrop from "./FileDrop";
import {B4, SETAWAY, SETHOME} from "./Constants";

let $ = require('jquery');

require('../css/fullstack.css');

export default class App extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            playing: false,
            playbackRate: 0.75,
            timeout:2000,
            finetune:0,
            current_frame: null,
            frame_index: 0,
            status: "",
            possession: "",
            meta_data: null,
            has_files:false,
            has_data_file: false,
            has_meta_file:false,
            has_video: false,
            periods_lengths:"",
            freehand: false,
            paused: null,
            newframe: false,
            ball_action: null,
            minify: false,
            time: 0,
            video_details: [],
            actions: {
                b4: 0,
                set_away: 0,
                set_home: 0
            },
            intervalID:0
        };

        this.openFreeHandSketch = this.openFreeHandSketch.bind(this);
        this.checkIfServerHasData = this.checkIfServerHasData.bind(this);
        this.toggleSize = this.toggleSize.bind(this);
        this.seekVideo = this.seekVideo.bind(this);
        this.ref = this.ref.bind(this)
    }

    handleVideos = (details) => {
        if(details.length === 0){return;}
        this.setState({has_video:true,video_details:details});
    };

    handlePeriodLengths = (resp) => {
        if(resp.length === 0){return;}
        this.setState({periods_lengths: resp});
    }

    handleFineTune = (e) => {
        this.setState({finetune:e.target.value})
    }

    handlePlaybackRate = (e) => {
        this.setState({playbackRate:e.target.value})
    }

    seekVideo(){
        this.player.seekTo(parseFloat(this.state.current_frame.period_seconds+parseInt(this.state.finetune)),'seconds');
    }

    handleChange = (frameData, index, timeline = false) => {
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
        this.setState({current_frame:parsed,status:parsed.ball.status,possession:parsed.ball.possession, time:parsed.time, frame_index: index});

        if(timeline){
            this.stopVideo();
            console.log("Stopping")
        }
        else if(this.state.has_video){
            this.playVideo();
        }
    };

    playVideo(){
        if(this.state.playing){return;}
        this.setState({intervalID: setInterval(this.seekVideo, this.state.timeout),playing:true})
    }

    stopVideo(){
        clearInterval(this.state.intervalID);
        this.setState({intervalID:0,playing:false})
    }

    handlePause = (paused, newframe=false) => {
        this.setState({paused:paused,playing:false})
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

    checkIfServerHasData = () => {
        $.get(window.location.href + 'has_data', (response) => {
            if(response == "1"){
                this.setState({has_files: true});
            }
        });
    };

    componentDidMount() {
        this.checkIfServerHasData()
    }

    toggleSize() {
        this.setState({minify:!this.state.minify})
    }

    ref = player => {
        this.player = player
    };

    render() {
        return(
            <div className={"main " + (this.state.minify ? 'minify' : '')} id="page-wrap">
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
                            <DataHandler callback={this.handleChange} metaCallback={this.handleMeta} pauseCallback={this.handlePause} videocallback={this.handleVideos} videoperiodcallback={this.handlePeriodLengths}/>
                            {this.state.meta_data !== null &&
                                <div>
                                    <span className={"time"}>
                                        {this.state.time}
                                    </span>

                                    {this.state.has_video &&
                                        <div className={"video-container"}>
                                            <label htmlFor="finetunerange">
                                                Seconds
                                                <input id="finetunerange" type="range" min={-4} max={4} step={1} value={this.state.finetune} onChange={this.handleFineTune}/>
                                                <p>{this.state.finetune}</p>
                                            </label>

                                            <label htmlFor="playbackrate">
                                                Playback rate
                                                <input id="playbackrate" type="range" min={0} max={2} step={0.01} value={this.state.playbackRate} onChange={this.handlePlaybackRate}/>
                                                <p>{this.state.playbackRate}</p>
                                            </label>
                                            <ReactPlayer
                                                width={"100%"}
                                                ref={this.ref}
                                                url={'./dist/static/'+this.state.video_details[0][0]}
                                                onSeek={e => console.log('onSeek', e)}
                                                playing={this.state.playing}
                                                playbackRate={this.state.playbackRate}
                                            />
                                        </div>
                                    }
                                    
                                    <P5Sketch meta_data={this.state.meta_data} frame_index={this.state.frame_index} current_frame={this.state.current_frame} paused={[this.state.paused, this.state.newframe]}></P5Sketch>
                                </div>
                            }
                            <div className="match-details hidden">
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

                            <button className={"fullscreen"} onClick={this.toggleSize}>Full screen</button>
                        </div>
                    )}
                    </div>
                )}
            </div>
        )
    }
}
