import React from "react";
import KeyboardEventHandler from 'react-keyboard-event-handler';
import MatchEventHandler from "./MatchEventHandler";

let $ = require('jquery');

let progressBar = null;

export default class DataHandler extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            paused:true,
            data: "",
            dataLength: 0,
            frame: 0,
            x: 0,
            percentage: 0,
            intervalID: 0,
            timeout: 40,
            skip_frames: 1,
            meta: null,
            period_pos: "",
            video_details: "",
            teams: [],
            mouse_timer: null,
            mouse_isIntervalSet: false,
            hover_time: 0
        };    // This binding is necessary to make `this` work in the callback

        this.getPythonData = this.getPythonData.bind(this);
        this.getPythonDataSize = this.getPythonDataSize.bind(this);
        this.getTimeFrame = this.getTimeFrame.bind(this);
        this.getTimeFrameFwdRew = this.getTimeFrameFwdRew.bind(this);
        this.getPythonMetaData = this.getPythonMetaData.bind(this);
        this.getProgress = this.getProgress.bind(this);
        this.getVideoDetails = this.getVideoDetails.bind(this);
        this.getTeams = this.getTeams.bind(this);


        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);

        this.placePeriods = this.placePeriods.bind(this);
    }

    disable_hover(){
        this.state.mouse_isIntervalSet = false
        window.clearTimeout(this.state.mouse_timer);
        this.state.mouse_timer = null;
    }

    _onMouseLeave(e) {
        this.disable_hover()
    }

    _onMouseMove(e) {
        let self = this;
        const elementWidth = progressBar.getBoundingClientRect().width;
        this.setState({ x: e.clientX, percentage: (e.clientX-80)/elementWidth*100 });

        if(this.state.dataLength !== 0){
            if (this.state.mouse_isIntervalSet) {
                return;
            }

            this.state.mouse_timer = window.setInterval(function() {
                let frameToFind = Math.round(self.state.dataLength / 100 * self.state.percentage);
                $.get(window.location.href + 'time?frame='+frameToFind, (time) => {
                    self.setState({hover_time: JSON.parse(time).time})
                });
            }, 700);
            this.state.mouse_isIntervalSet = true;
        }
    }

    getTimeFrame(){
        this.pause();
        let self = this;
        let frameToFind = Math.round(this.state.dataLength / 100 * this.state.percentage);
        $.get(window.location.href + 'data?frame='+frameToFind, (data) => {
            this.setState({data: data});
            this.props.callback(data, this.state.frame, true);
            if(this.state.paused){
                this.props.pauseCallback(true, true);
            }
        }).done(function() {
            self.setState({frame: frameToFind+self.state.skip_frames});
            self.play();
        });
    }

    getTimeFrameFwdRew(frame = 0){
        this.pause();
        let self = this;
        let frameToFind = frame;

        $.get(window.location.href + 'data?frame='+frameToFind, (data) => {
            this.setState({data: data});
            this.props.callback(data, this.state.frame, true);
            if(this.state.paused){
                this.props.pauseCallback(true, true);
            }
        }).done(function() {
            self.setState({frame: frameToFind+self.state.skip_frames});
            self.play();
        });
    }

    getTeams(){
        $.get(window.location.href + 'teams', (resp) => {
            if(resp !== "-1"){
                for(let i = 0; i<resp.length;i++){
                    this.state.teams.push(JSON.parse(resp[i]))
                }
                this.props.teamscallback(this.state.teams)
            }
        });
    }

    getPythonDataSize(){
        $.get(window.location.href + 'data_length', (length) => {
            this.setState({dataLength: parseInt(length)});
        });
    }

    getPythonMetaData() {
        $.get(window.location.href + 'meta', (meta_data) => {
            this.setState({meta: JSON.parse(meta_data)});
            this.props.metaCallback(this.state.meta);
        });
    }

    getPythonData() {
        let self = this;
        let frame = this.state.frame;

        $.get(window.location.href + 'data?frame='+frame, (data) => {
            this.setState({data: data});
            this.props.callback(data, this.state.frame, false);
        }).done(function() {
            self.setState({frame: frame+self.state.skip_frames});
        });
    }

    getVideoDetails(){
        if(this.state.video_details === ""){
            $.get(window.location.href + 'video_details', (details) => {
                this.setState({video_details: details});
                this.props.videocallback(details);
            });
            $.get(window.location.href + 'period_length', (resp) => {
                this.setState({period_lengths: resp});
                this.props.videoperiodcallback(resp);
            });
        }
    }

    getProgress(){
        if(this.state.dataLength === 0 && this.state.data !== ""){
            this.getPythonDataSize();
        }
        return this.state.frame / this.state.dataLength * 100;
    }

    forward(){
        if((this.state.frame + 750) < this.state.dataLength-1){
            this.state.frame += 750;
            this.getTimeFrameFwdRew(this.state.frame);
        }
    }

    backward(){
        if(this.state.frame > 750){
            this.state.frame -= 750;
            this.getTimeFrameFwdRew(this.state.frame);
        } else {
            this.getTimeFrameFwdRew(0);
        }
    }

    play(){
        if(!this.state.paused){return;}
        this.setState({paused:false});
        this.setState({intervalID: setInterval(this.getPythonData, this.state.timeout)})
        this.props.pauseCallback(false);
    }

    pause(){
        this.setState({paused:true});
        clearInterval(this.state.intervalID);
        this.props.pauseCallback(true);
    }

    placePeriods(){
        if(this.state.dataLength === 0 || this.state.meta === null){return;}
        let DOM = [];
        let width = $(".progress-bar").width();
        let start_frames = this.state.meta.start_periods;
        for(let i = 0; i < start_frames.length; i++){
            let style;
            if(start_frames[i] === 0){
                style = {
                    left: 0
                };
            } else {
                style = {
                    left: start_frames[i]/this.state.dataLength*width
                };
            }
            DOM.push(<span key={i} className={'period-indicator'} style={style}>{i+1}</span>);
        }
        return DOM;
    }

    componentDidMount() {
        this.getPythonMetaData()
        this.getVideoDetails()
        this.getTeams()
    }

    render () {
        const { x } = this.state.x;
        return (
            <div className={"timeline-controls"}>
                <div className="progress-bar" onClick={this.getTimeFrame} onMouseLeave={this._onMouseLeave.bind(this)} onMouseMove={this._onMouseMove.bind(this)} ref={(div) => {progressBar = div}}>
                    <div className="progress-indicator" style={{width: `${this.getProgress()}%`}}/>
                    {this.state.mouse_isIntervalSet &&
                        <span className="time-indicator" style={ { left: `${ this.state.percentage }%` } }>{this.state.hover_time}</span>
                    }
                    <MatchEventHandler dataLength={this.state.dataLength} meta={this.state.meta}/>
                </div>
                <div className="button-outer" onClick={this.play}>
                    <div className="play-button"></div>
                </div>
                <div className="button-outer" onClick={this.pause}>
                    <div className="pause-button"></div>
                </div>
                <KeyboardEventHandler
                    handleKeys={['space', 'left', 'right']}
                    onKeyEvent={(key, e) => {{
                        switch (key) {
                            case 'space':
                                this.state.paused ? this.play() : this.pause();
                                return;
                            case 'left':
                                this.backward();
                                return;
                            case 'right':
                                this.forward();
                                return;
                        }
                        }}
                    } />
            </div>
        )
    }
}
