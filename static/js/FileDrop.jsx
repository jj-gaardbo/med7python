import React from 'react';
import FileDrop from 'react-file-drop';

let $ = require('jquery');

class ReactFileDrop extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            files: null,
            files_recieved: false
        };

        this.handleDrop = this.handleDrop.bind(this);
    }

    handleData = (msg, status, jqXHR) => {
        if(status === "success" && msg === "OK"){
            this.setState({files_recieved: true});
            this.props.callback()
        }
    };

    handleDrop = (files, event) => {
        event.preventDefault();
        let formData = new FormData();
        formData.append('file', files[0]);
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
                    Drop data files here
                </FileDrop>
                <progress className={"upload-progress hidden"}></progress>
            </div>
        );
    }
}

export default ReactFileDrop;
