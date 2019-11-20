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
            this.setState({data_processed: true});
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
        if(this.state.data_processed && this.state.files_recieved){return;}
        $.get(window.location.href + 'progress', (status) => {
            if(status.length !== 0){
                this.setState({processing: status});
            }
        });
    }

    validateFiles(file_array){
        let alert = "";
        let missing = [
            ".dat",
            "f7.xml",
            "metadata.xml",
            "_1.mp4",
            "_2.mp4"
        ];
        for(let i = 0; i < file_array.length; i++){
            if(file_array[i].name.includes(".dat")){
                missing = missing.filter(e => e !== ".dat");
            }
            if(file_array[i].name.includes("f7")) {
                missing = missing.filter(e => e !== "f7.xml");
            }
            if(file_array[i].name.includes("metadata.xml")){
                missing = missing.filter(e => e !== "metadata.xml");
            }
            if(file_array[i].name.includes("_1.mp4")){
                missing = missing.filter(e => e !== "_1.mp4");
            }
            if(file_array[i].name.includes("_2.mp4")){
                missing = missing.filter(e => e !== "_2.mp4");
            }
        }
        return missing;
    }

    handleDrop = (files, event) => {
        event.preventDefault();
        let file_array = [];
        let formData = new FormData();
        for(let i = 0; i < files.length; i++){
            if(files[i].type === "video/mp4") {
                file_array.splice(0, 0, files[i]);
            }
            else if(files[i].name.includes("f7")){
                file_array.splice(3, 0, files[i]);
            } else if(files[i].name.includes("meta")){
                file_array.splice(2, 0, files[i]);
            } else if(files[i].type === ""){
                file_array.push(files[i]);
            }
        }

        let validate = this.validateFiles(file_array);
        if(validate.length > 0){
            alert("Missing files: \n" + JSON.stringify(validate));
            return;
        }

        for(let i = 0; i < file_array.length; i++){
            formData.append('file', file_array[i]);
        }

        let self = this;
        this.state.files = file_array;
        this.setState({files_recieved: true});
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
                        Drop match data files here <br/>
                        File requirements: <br/>

                        <strong>*_1.mp4</strong> <br/>
                        <strong>*_2.mp4</strong> <br/>
                        <strong>*_metadata.xml</strong> <br/>
                        <strong>f7.xml</strong> <br/>
                        <strong>*.dat</strong>
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
