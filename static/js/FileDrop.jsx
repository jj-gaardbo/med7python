import React from 'react';
import FileDrop from 'react-file-drop';
import Loader from 'react-loader-spinner'

let $ = require('jquery');

class ReactFileDrop extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            files: null,
            files_recieved: false,
            data_processed: null
        };

        this.handleDrop = this.handleDrop.bind(this);
    }

    handleData = (msg, status, jqXHR) => {
        if(status === "success"){
            this.setState({files_recieved: true, data_processed: true});
            $('progress').addClass("hidden");
            this.props.callback(msg)
        }
    };

    showSpinner = () => {
        this.setState({data_processed: false});
    };

    handleDrop = (files, event) => {
        event.preventDefault();
        let formData = new FormData();
        formData.append('file', files[0]);
        let self = this;
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
                    <p>Drop .dat and .xml files here (one at a time)</p>
                    <progress className={"upload-progress hidden"}></progress>
                    {!this.state.files_recieved &&
                    <button className={"freehand btn btn-primary"} onClick={this.props.freehandSketch}><i className="fa fa-edit"></i>Free hand</button>
                    }
                </FileDrop>
                {this.state.data_processed === false &&
                    <div className={"spinner-wrap"}>
                        <Loader
                            className={"spinner"}
                            type="Grid"
                            color="#001D91"
                            height={100}
                            width={100}
                            timeout={0}
                        />
                        <h2>Please wait</h2>
                        <p>Large data files can take a few minutes to process...</p>
                    </div>
                }
            </div>
        );
    }
}

export default ReactFileDrop;
