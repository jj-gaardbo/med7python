import React from "react";

let $ = require('jquery');

let progressBar = null;

export default class DataHandler extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: "",
            dataLength: 0,
            frame: 0,
            x: 0,
            percentage: 0,
            intervalID: 0,
            timeout: 39,
            skip_frames: 1,
            meta: null
        };    // This binding is necessary to make `this` work in the callback

        this.getPythonData = this.getPythonData.bind(this);
        this.getPythonDataSize = this.getPythonDataSize.bind(this);
        this.getTimeFrame = this.getTimeFrame.bind(this);
        this.getPythonMetaData = this.getPythonMetaData.bind(this);

        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
    }

    _onMouseMove(e) {
        const elementWidth = progressBar.getBoundingClientRect().width;
        this.setState({ x: e.screenX, percentage: (e.screenX-80)/elementWidth*100 });
    }

    getTimeFrame(){
        let self = this;
        let frame = Math.round(this.state.dataLength / 100 * this.state.percentage);
        $.get(window.location.href + 'data?frame='+frame, (data) => {
            this.setState({data: data});
            this.props.callback(data);
        }).done(function() {
            self.setState({frame: frame+self.state.skip_frames});
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
            this.props.callback(data);
        }).done(function() {
            self.setState({frame: frame+self.state.skip_frames});
        });
    }

    getProgress(){
        if(this.state.dataLength === 0 && this.state.data !== ""){
            this.getPythonDataSize();
        }
        return this.state.frame / this.state.dataLength * 100;
    }

    play(){
        if(this.state.meta === null){
            this.getPythonMetaData()
        }
        this.setState({paused:false})
        this.setState({intervalID: setInterval(this.getPythonData, this.state.timeout)})
    }

    pause(){
        this.setState({paused:true})
        clearInterval(this.state.intervalID);
    }

    render () {
        const { x } = this.state.x;
        return (
            <div>
                <div className="progress-bar" onClick={this.getTimeFrame} onMouseMove={this._onMouseMove.bind(this)} ref={(div) => {progressBar = div}}>
                    <div className="progress-indicator" style={{width: `${this.getProgress()}%`}}/>
                </div>
                <div className="button-outer" onClick={this.play}>
                    <div className="play-button"></div>
                </div>
                <div className="button-outer" onClick={this.pause}>
                    <div className="pause-button"></div>
                </div>
            </div>
        )
    }
}
