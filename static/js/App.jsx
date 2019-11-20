import React from "react";
import DataHandler from "./DataHandler";
import ReactPlayer from 'react-player'
import P5Sketch from './sketch.js';
import P5FreeSketch from './sketchFree.js';
import ReactFileDrop from "./FileDrop";
import {B4, SETAWAY, SETHOME} from "./Constants";
import P5SketchVideo from "./sketchVideo";

let $ = require('jquery');

require('../css/fullstack.css');

export default class App extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            playing: false,
            playbackRate: 1,
            currentVideo: "",
            timeout:5000,
            finetune:0,
            current_frame: null,
            possession_player:null,
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
            larger: false,
            time: 0,
            video_details: [],
            dragging: false,
            actions: {
                b4: 0,
                set_away: 0,
                set_home: 0
            },
            intervalID:0,
            team_data: []
        };

        this.openFreeHandSketch = this.openFreeHandSketch.bind(this);
        this.checkIfServerHasData = this.checkIfServerHasData.bind(this);
        this.toggleSize = this.toggleSize.bind(this);
        this.toggleSizeLarger = this.toggleSizeLarger.bind(this);
        this.seekVideo = this.seekVideo.bind(this);
        this.ref = this.ref.bind(this)
        this.possession = this.possession.bind(this)
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

    handleResyncRate = (e) => {
        this.stopVideo();
        this.setState({timeout:e.target.value})
        this.playVideo();
    }

    seekVideo(){
        this.player.seekTo(parseFloat(this.state.current_frame.period_seconds+parseInt(this.state.finetune)),'seconds');
    }

    handleTeams = (teamData) => {
        if(teamData.length > 0){
            this.setState({team_data: teamData})
        }
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
            this.seekVideo();
            if(this.state.paused){
                this.stopVideo();
                this.handlePause(true, false)
            }
        }
        else if(this.state.has_video){
            this.playVideo();
        }
    };

    handleVideoFilename(){
        this.state.currentVideo = this.state.meta_data.match_id+"_"+this.state.current_frame.period+".mp4";
    }

    playVideo(){
        this.handleVideoFilename();

        if(this.state.playing){return;}

        this.setState({intervalID: setInterval(this.seekVideo, this.state.timeout),playing:true})
    }

    stopVideo(){
        clearInterval(this.state.intervalID);
        this.setState({intervalID:0,playing:false})
    }

    handlePause = (paused, newframe=false) => {
        this.setState({paused:paused,playing:false})
        this.stopVideo();
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
        this.setState({has_meta_file:true,has_data_file:true, has_files:true});
        if(timer !== 0){
            clearInterval(timer);
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
        $(document).keydown(function(e){if(e.which === 32) e.preventDefault();});
        this.checkIfServerHasData()
    }

    toggleSize() {
        this.setState({minify:!this.state.minify})
    }

    toggleSizeLarger() {
        this.setState({larger:!this.state.larger})
    }

    ref = player => {
        this.player = player
    };

    possession = poss_player => {
        this.state.possession_player = poss_player
    };

    handleDrag = (bool) => {
        this.setState({dragging:bool})
    };

    render() {
        return(
            <div className={"main " + (this.state.minify ? 'minify' : '') + (this.state.minify && this.state.paused ? ' draw' : '')} id="page-wrap">
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
                            <DataHandler teamscallback={this.handleTeams} callback={this.handleChange} metaCallback={this.handleMeta} pauseCallback={this.handlePause} videocallback={this.handleVideos} videoperiodcallback={this.handlePeriodLengths}/>
                            {this.state.meta_data !== null &&
                                <div>
                                    {this.state.has_video &&
                                        <div className={"video-container"}>
                                            <P5SketchVideo dragging={this.state.dragging} paused={this.state.paused} minify={this.state.minify}/>
                                            {this.state.currentVideo !== "" &&
                                                <ReactPlayer
                                                    width={"100%"}
                                                    ref={this.ref}
                                                    url={'./dist/static/'+this.state.currentVideo}
                                                    onSeek={e => console.log('onSeek', e)}
                                                    playing={!this.state.paused}
                                                    playbackRate={parseFloat(this.state.playbackRate)}
                                                />
                                            }
                                            <div className={"video-controls"}>
                                                <label htmlFor="finetunerange">
                                                    Playback offset <br/>
                                                    <input id="finetunerange" type="range" min={-4} max={4} step={0.01} value={this.state.finetune} onChange={this.handleFineTune}/>
                                                    <p>{this.state.finetune} sec.</p>
                                                </label>

                                                <label htmlFor="playbackrate">
                                                    Playback rate <br/>
                                                    <input id="playbackrate" type="range" min={0} max={2} step={0.01} value={this.state.playbackRate} onChange={this.handlePlaybackRate}/>
                                                    <p>{this.state.playbackRate} speed</p>
                                                </label>

                                                <label htmlFor="resyncrate">
                                                    Resync rate <br/>
                                                    <input id="resyncrate" type="range" min={0} max={10000} step={1000} value={this.state.timeout} onChange={this.handleResyncRate}/>
                                                    <p>{this.state.timeout/1000} sec.</p>
                                                </label>
                                            </div>
                                        </div>
                                    }

                                    <P5Sketch dragCallback={this.handleDrag} possessioncb={this.possession} larger={this.state.larger} minify={this.state.minify} team_data={this.state.team_data} meta_data={this.state.meta_data} frame_index={this.state.frame_index} current_frame={this.state.current_frame} paused={[this.state.paused, this.state.newframe]}></P5Sketch>

                                </div>
                            }

                            <div className="score-board">
                                {this.state.current_frame && this.state.current_frame.score_board &&
                                    <p>
                                        <span className={"time"}>{this.state.time}</span>{this.state.current_frame.score_board.home_team} <span>{this.state.current_frame.score_board.home_score}</span>-<span>{this.state.current_frame.score_board.away_score}</span> {this.state.current_frame.score_board.away_team}
                                    </p>
                                }
                            </div>

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

                            {this.state.minify &&
                                <button className={"btn larger " + (this.state.larger ? 'btn-secondary' : 'btn-default')} onClick={this.toggleSizeLarger}>
                                    {this.state.larger ? (
                                        <i className="fas fa-search-minus"></i>
                                    ) : (
                                        <i className="fas fa-search-plus"></i>
                                    )}
                                    2x</button>
                            }
                            <button className={"btn btn-primary fullscreen"} onClick={this.toggleSize}>{!this.state.minify ? ("Show video") : ("Edit Board")}</button>

                            {this.state.possession_player !== null &&
                                <div className="possession-div">
                                    {this.state.possession_player.firstname + " " + this.state.possession_player.lastname + " : " + this.state.possession_player.team_name}
                                </div>
                            }
                        </div>
                    )}
                    </div>
                )}
            </div>
        )
    }
}
