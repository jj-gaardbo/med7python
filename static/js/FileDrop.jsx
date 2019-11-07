import React from 'react';
import FileDrop from 'react-file-drop';

let $ = require('jquery');

class ReactFileDrop extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            files: null,
            files_recieved: false,
            data_processed: null,
            intervalID: 0,
            timeout: 5000,
            processing: null
        };

        this.handleDrop = this.handleDrop.bind(this);
        this.getUploadProgress = this.getUploadProgress.bind(this);
    }

    handleData = (msg, status, jqXHR) => {
        if(status === "success"){
            this.setState({files_recieved: true, data_processed: true});
            $('progress').addClass("hidden");
            this.props.callback(msg, this.state.intervalID)
        }
    };

    showSpinner = () => {
        this.setState({data_processed: false});
        if(this.state.files.type !== "text/xml"){
            this.setState({intervalID: setInterval(this.getUploadProgress, this.state.timeout)})
        }
    };

    getUploadProgress(){
        $.get(window.location.href + 'progress', (status) => {
            if(status.length !== 0){
                this.setState({processing: status});
            }
        });
    }

    handleDrop = (files, event) => {
        event.preventDefault();
        let formData = new FormData();
        formData.append('file', files[0]);
        let self = this;
        this.state.files = files[0];
        $.ajax({
            // Your server script to process the upload
            url: window.location.href + 'upload_file',
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            xhr: function () {
                let myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) {
                    // For handling the progress of the upload
                    myXhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            $('progress').removeClass("hidden").attr({
                                value: e.loaded,
                                max: e.total,
                            });
                            if(e.loaded === e.total){
                                self.showSpinner()
                            }
                        }
                    }, false);
                }
                return myXhr;
            },
            success : this.handleData
        });
    };

    render() {
        return (
            <div id="react-file-drop">
                <FileDrop onDrop={this.handleDrop}>

                    <p>
                        1. Drop .mp4 video file for each half<br/>
                        2. Drop .xml meta file<br/>
                        3. Drop .dat data file
                    </p>
                    <progress className={"upload-progress hidden"}></progress>
                    {!this.state.files_recieved &&
                    <button className={"freehand btn btn-primary"} onClick={this.props.freehandSketch}><i className="fa fa-edit"></i>Free hand</button>
                    }
                    {this.state.data_processed === false &&
                        <div>
                            <h2>Please wait</h2>
                            <p>Large data files can take a few minutes to process...</p>
                            <div className={"spinner-wrap"}>
                                {this.state.processing !== null &&
                                <div className={'file-processing status'}>
                                    <p>Processing: {this.state.processing[0]} / {this.state.processing[1]}</p>
                                    <p><strong>{this.state.processing[2]}%</strong></p>
                                    <progress className={"process-progress"} value={this.state.processing[0]} max={this.state.processing[1]}></progress>
                                </div>
                                }
                            </div>
                        </div>
                    }
                </FileDrop>
            </div>
        );
    }
}

export default ReactFileDrop;
