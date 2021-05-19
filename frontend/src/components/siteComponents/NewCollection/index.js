import React, { Component } from "react";
import PropTypes from "prop-types";
import Toggle from "react-toggle";
import { Alert, ControlLabel, FormGroup, FormControl } from "react-bootstrap";
import { incrementCollCount } from "store/modules/auth";

import { defaultCollectionTitle, apiPath } from "config";
import { apiFormatUrl } from "helpers/utils";
import { WarcIcon } from "components/icons";

import { collection, upload as uploadErrors } from "helpers/userMessaging";
import PersonHeading from "./PersonHeading";
import AuthorshipItem from "./AuthorshipItem";
import Modal from "components/Modal";

import ReactTooltip from "react-tooltip";

import "./style.scss";

const creatorLegend = ["corporate/institutional name", "personal name"];
const creatorList = [];
const subjectHeaderList = [];
const personHeaderList = [];

class NewCollection extends Component {
  static propTypes = {
    activeCollection: PropTypes.string,
    close: PropTypes.func,
    createCollection: PropTypes.func,
    creatingCollection: PropTypes.bool,
    createCollectionBrowseWarc: PropTypes.func,
    error: PropTypes.string,
    fromCollection: PropTypes.string,
    showModal: PropTypes.bool,
    visible: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.xhr = null;
    this.interval = null;
    this.fileObj = null;
    this.state = {
      file: "",
      isUploading: false,
      listID: 0,
      urlValid: false,
      emailValid: false,
      isHidden: true,
      publisher: "",
      publisherOriginal: "",
      subjectHeaderList,
      subjectHeadingText: "",
      personHeaderList,
      personHeadingText: "",
      collTitle: "",
      title: "",
      pubTitleOriginal: "",
      collYear: "",
      copTitle: "",
      surName: "",
      status: null,
      persName: "",
      progress: 0,
      usermail: "",
      creatorList,
      isPublic: false,
      creatorLegend,
      noteToDachs: "",
      publishYear: "",
      projektcode: "",
      projektcodeValid: false,
      selectedGroupName: "corporate/institutional name",
      url: "",
      ticketState: "open",
      isCollLoaded: true,
      recordingUrl: "",
      recordingTimestamp: "",
      targetColl: props.fromCollection ? "chosen" : "auto",
      doi: "",
    };
  }

  cancelWarc = () => {
    this.setState((state) => {
      return {
        open: false,
        file: "",
        canCancel: true,
        isUploading: false,
        status: null,
        isIndexing: false,
        progress: 0,
        targetColl: this.props.fromCollection ? "chosen" : "auto",
      };
    });
  };

  checkEmail = () => {
    this.setState({ checkEmail: true });
  };

  close = () => {
    const { close } = this.props;
    if (this.state.isUploading && this.xhr && this.state.canCancel) {
      this.xhr.upload.removeEventListener("progress", this.uploadProgress);
      this.xhr.removeEventListener("load", this.uploadSuccess);
      this.xhr.removeEventListener("loadend", this.uploadComplete);
      this.xhr.abort();
    }
    close();
  };

  filePicker = (evt) => {
    if (evt.target.files.length > 0) {
      this.fileObj = evt.target.files[0]; // eslint-disable-line
      this.setState((state) => {
        return {
          file: this.fileObj.name,
          urlValid: "",
        };
      });
    }
  };

  focusInput = (evt) => {
    this.input.setSelectionRange(0, evt.target.value.length);
  };

  handleInput = (evt) => {
    this.setState({ [evt.target.name]: evt.target.value });
  };
  handleChange = (evt) => {
    if (evt.target.type === "radio") {
      this.setState({ [evt.target.name]: evt.target.value === "yes" });
    } else {
      this.setState({ [evt.target.name]: evt.target.value });
    }
  };

  goToCollections = () => {
    const { auth, history } = this.props;
    history.push(`/${auth.getIn(["user", "username"])}`);
  };

  groupSelect = (evt) => {
    this.setState({ [evt.target.name]: evt.target.value });
    this.setState({ selectedGroupName: evt.target.value });
  };
  indexing = (data) => {
    this.setState({ canCancel: false, status: "Indexing..." });

    const url = apiFormatUrl(
      `${apiPath}/upload/${data.upload_id}?user=${data.user}`
    );

    this.interval = setInterval(() => {
      fetch(url, {
        headers: new Headers({ "x-requested-with": "XMLHttpRequest" }),
      })
        .then((res) => res.json())
        .then(this.indexResponse);
    }, 75);
  };
  indexingComplete = (user, coll) => {
    const {
      title,
      creatorList,
      noteToDachs,
      subjectHeaderList,
      subjectHeadingText,
      personHeaderList,
      publisher,
      publisherOriginal,
      pubTitleOriginal,
      personHeadingText,
      collTitle,
      collYear,
      copTitle,
      surName,
      persName,
      usermail,
      selectedGroupName,
      projektcode,
      publishYear,
      listID,
      url,
      doi,
    } = this.state;

    this.props.createCollectionBrowseWarc(
      coll,
      title,
      JSON.stringify(creatorList),
      JSON.stringify(subjectHeaderList),
      JSON.stringify(personHeaderList),
      noteToDachs,
      publisher,
      collTitle,
      publisherOriginal,
      collYear,
      copTitle,
      surName,
      persName,
      usermail,
      selectedGroupName,
      projektcode,
      publishYear,
      pubTitleOriginal,
      personHeadingText,
      subjectHeadingText,
      listID,
      url,
      doi
    );
    this.props.close();
  };
  indexResponse = (data) => {
    const stateUpdate = {};

    if (data.filename && data.filename !== this.state.file) {
      stateUpdate.file = data.filename;
    }

    if (data.total_files > 1) {
      stateUpdate.status = `Indexing ${data.total_files - data.files} of ${
        data.total_files
      }`;
    }

    if (data.size && data.total_size) {
      stateUpdate.progress =
        50 + Math.round((50 * data.size) / data.total_size);
    }

    // update ui
    if (Object.keys(stateUpdate).length) {
      this.setState(stateUpdate);
    }

    if (data.size >= data.total_size && data.done) {
      clearInterval(this.interval);
      this.indexingComplete(data.user, data.coll);
    }
  };
  onRemoveItem = (item) => {
    this.setState({
      creatorList: this.state.creatorList.filter((el) => el !== item),
    });
  };
  onRemoveSubject = (item) => {
    this.setState({
      subjectHeaderList: this.state.subjectHeaderList.filter(
        (el) => el !== item
      ),
    });
  };
  onRemovePerson = (item) => {
    this.setState({
      personHeaderList: this.state.personHeaderList.filter((el) => el !== item),
    });
  };
  onAddItem = () => {
    this.setState({ listID: this.state.listID + 1 });
    if (this.state.selectedGroupName === "corporate/institutional name") {
      let tempText = "C/I name:" + this.state.collTitle;
      this.state.copTitle !== ""
        ? (tempText += ", " + this.state.copTitle)
        : null;

      const temp = {
        htmlText: tempText,
        id: this.state.listID,
      };
      this.setState((state) => {
        const creatorList = [...state.creatorList, temp];
        return {
          creatorList,
          collTitle: "",
          copTitle: "",
        };
      });
    } else {
      let tempText = "personal name:" + this.state.persName;
      this.state.surName !== ""
        ? (tempText += ", " + this.state.surName)
        : null;
      this.state.collYear !== ""
        ? (tempText += " - " + this.state.collYear)
        : null;
      const temp = {
        htmlText: tempText,
        id: this.state.listID,
        personal_name: this.state.persName,
        surname: this.state.surName,
        coll_year: this.state.collYear,
      };
      this.setState((state) => {
        const creatorList = [...state.creatorList, temp];
        return {
          creatorList,
          persName: "",
          surName: "",
          collYear: "",
        };
      });
    }
  };

  onAddSubject = () => {
    this.setState({ listID: this.state.listID + 1 });

    const temp = {
      htmlText: this.state.subjectHeadingText,
      id: this.state.listID,
    };
    this.setState((state) => {
      const subjectHeaderList = [...state.subjectHeaderList, temp];
      return {
        subjectHeaderList,
        subjectHeadingText: "",
      };
    });
  };
  onAddPerson = () => {
    this.setState({ listID: this.state.listID + 1 });

    const temp = {
      htmlText: this.state.personHeadingText,
      id: this.state.listID,
    };
    this.setState((state) => {
      const personHeaderList = [...state.personHeaderList, temp];
      return {
        personHeaderList,
        personHeadingText: "",
      };
    });
  };

  onClearArray = () => {
    this.setState({ list: [] });
  };
  validateCollYear = () => {
    const { collYear } = this.state;
    const myTest = /[0-9]{4}( - [0-9]{4})?/;
    return myTest.test(collYear);
  };

  validatePublishYear = () => {
    const { publishYear } = this.state;
    const myTest = /[0-9]{4}([0-9]{2})?([0-9]{2})?/;
    return myTest.test(publishYear);
  };
  rebuildTooltip = () => {
    ReactTooltip.rebuild();
  };

  submit = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    const {
      file,
      title,
      url,
      isPublic,
      creatorList,
      subjectHeaderList,
      personHeaderList,
      noteToDachs,
      publisher,
      collTitle,
      publisherOriginal,
      collYear,
      copTitle,
      surName,
      persName,
      usermail,
      selectedGroupName,
      projektcode,
      publishYear,
      pubTitleOriginal,
      personHeadingText,
      subjectHeadingText,
      listID,
      ticketState,
      isCollLoaded,
      recordingUrl,
      recordingTimestamp,
      targetColl,
    } = this.state;
    const { activeCollection } = this.props;
    if (!file) {
      this.props.createCollection(
        title,
        url,
        isPublic,
        JSON.stringify(creatorList),
        JSON.stringify(subjectHeaderList),
        JSON.stringify(personHeaderList),
        noteToDachs,
        publisher,
        collTitle,
        publisherOriginal,
        collYear,
        copTitle,
        surName,
        persName,
        usermail,
        selectedGroupName,
        projektcode,
        publishYear,
        pubTitleOriginal,
        personHeadingText,
        subjectHeadingText,
        listID,
        ticketState,
        isCollLoaded,
        recordingUrl,
        recordingTimestamp
      );
    } else {
      this.xhr = new XMLHttpRequest();
      const target = targetColl === "chosen" ? activeCollection : "";
      const url = apiFormatUrl(
        `${apiPath}/upload?force-coll=${target}&filename=${file}`
      );

      this.xhr.upload.addEventListener("progress", this.uploadProgress);
      this.xhr.addEventListener("load", this.uploadSuccess);
      this.xhr.addEventListener("loadend", this.uploadComplete);

      this.xhr.open("PUT", url, true);
      this.xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");

      this.setState({
        isUploading: true,
        status: "Uploading...",
      });

      this.xhr.send(this.fileObj);

      return this.xhr;
    }
  };
  toggleHidden = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    this.setState({
      isHidden: !this.state.isHidden,
    });
  };
  triggerFile = () => {
    this.fileField.click();
  };

  uploadComplete = (evt) => {
    if (!this.xhr) {
      return;
    }

    const data = JSON.parse(this.xhr.responseText);

    this.setState({
      canCancel: true,
      status: uploadErrors[data.error] || "Error Encountered",
    });
    this.xhr.upload.removeEventListener("progress", this.uploadProgress);
    this.xhr.removeEventListener("load", this.uploadSuccess);
    this.xhr.removeEventListener("loadend", this.uploadComplete);
    this.xhr.abort();
    if (data && data.upload_id) {
      return this.indexing(data);
    }
  };
  uploadProgress = (evt) => {
    const progress = Math.round((50.0 * evt.loaded) / evt.total);

    if (evt.loaded >= evt.total) {
      this.setState({ canCancel: false, progress });
    } else {
      this.setState({ progress });
    }
  };

  uploadSuccess = (evt) => this.setState({ progress: 50 });

  validateEmail = () => {
    const { emailValid, usermail } = this.state;
    /*if (checkEmail && ( email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) === null)) {
      return 'error';
    }
    return null;*/
    const myTest = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (myTest.test(usermail) === true && !emailValid) {
      this.setState({ emailValid: true });
    } else if (myTest.test(usermail) === false && emailValid) {
      this.setState({ emailValid: false });
    }
  };

  ValidateProjektcode = () => {
    const { projektcodeValid, projektcode } = this.state;
    /*if (checkEmail && ( email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) === null)) {
      return 'error';
    }
    return null;*/
    const myTest = /^[A-Za-z0-9 ]{1,8}$/;
    if (myTest.test(projektcode) === true && !projektcodeValid) {
      this.setState({ projektcodeValid: true });
    } else if (myTest.test(projektcode) === false && projektcodeValid) {
      this.setState({ projektcodeValid: false });
    }
  };

  validateURL = () => {
    const { url, urlValid } = this.state;
    ///^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/
    //const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const myTest = /((([A-Za-z]{3,9}(:|.)(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/i;
    //this.setState({ urlValid: myTest.test(url) });
    if (myTest.test(url) === true && !urlValid) {
      this.setState({ urlValid: true });
    } else if (myTest.test(url) === false && urlValid) {
      this.setState({ urlValid: false });
    }
    /*
  //if (url===null || url==='') { return null; }

    var valid = url.match(/^(http[s]?:\/\/|www\.|[a-z0-9]+)([a-z0-9]+[a-z0-9\-])+\.[a-zA-Z]{2,3}$/i);
    if (valid===true) {
      return true;
    } else {
      return true;
    }*/
  };
  validateAuthorship = () => {
    const {
      collTitle,
      copTitle,
      persName,
      surName,
      collYear,
      creatorList,
    } = this.state;

    if (this.state.selectedGroupName == "corporate/institutional name") {
      if (!collTitle || creatorList.length == 0) {
        return "error";
      }
    } else {
      if (!surName || creatorList.length == 0) {
        return "error";
      }
    }

    return null;
  };

  validateTitle = () => {
    const { title } = this.state;
    if (!title) {
      return "error";
    }
    return null;
  };
  validatePublisher = () => {
    const { publisher } = this.state;
    if (!publisher) {
      return "error";
    }
    return null;
  };

  titleValidation = () => {
    return this.props.error ? "error" : null;
  };

  togglePublic = (evt) => {
    this.setState({ isPublic: !this.state.isPublic });
  };

  render() {
    const { creatingCollection, error, visible } = this.props;
    const {
      collTitle,
      collYear,
      emailValid,
      file,
      surName,
      copTitle,
      isHidden,
      isPublic,
      isUploading,
      noteToDachs,
      title,
      publisherOriginal,
      publishYear,
      usermail,
      persName,
      progress,
      pubTitleOriginal,
      publisher,
      selectedGroupName,
      projektcode,
      projektcodeValid,
      subjectHeadingText,
      personHeadingText,
      creatorLegend,
      status,
      url,
      urlValid,
      creatorList,
    } = this.state;

    const text = `To edit Metadata, please use the information form below.${"\n"} Fields marked with asterisk (*) are required`;
    if (visible) {
      this.rebuildTooltip();
    }
    return (
      <React.Fragment>
        <Modal closeCb={this.close} header={text} visible={visible}>
          <form
            onSubmit={this.submit}
            id="create-coll"
            className="form-horizontal"
          >
            {error && (
              <Alert bsStyle="danger">
                {collection[error] || "Error encountered"}
              </Alert>
            )}
            {!__DESKTOP__ && (
              <span className="col-xs-7 col-xs-offset-1">
                <div>
                  <FormGroup id="fieldset">
                    <label
                      style={{ display: "inline", float: "left" }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="Any further information regarding your OpenDACHS request will be sent to this e-mail address."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                        color: emailValid ? "black" : "red",
                      }}
                    >
                      *Your e-mail address:
                    </div>

                    <ControlLabel srOnly>email address:</ControlLabel>
                    <FormControl
                      style={{
                        border: emailValid
                          ? "1px solid black"
                          : "1px solid #ff1a1a",
                      }}
                      aria-label="email"
                      validationState={this.validateEmail()}
                      name="usermail"
                      placeholder="please enter your email*"
                      autoFocus
                      required
                      value={usermail}
                      onChange={this.handleChange}
                      onBlur={this.checkEmail}
                    />
                  </FormGroup>
                </div>

                <div>
                  <FormGroup id="fieldset">
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef21);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef21);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef21 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="URL of the web resource."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                        color: urlValid ? "black" : "red",
                      }}
                    >
                      *URL(URL of recorded page if WARC provided):
                    </div>
                    <FormControl
                      aria-label="url"
                      style={{
                        border: urlValid
                          ? "1px solid black"
                          : "1px solid #ff1a1a",
                      }}
                      validationState={this.validateURL()}
                      name="url"
                      placeholder="please enter a valid webpage url*"
                      value={url}
                      onChange={this.handleInput}
                    />
                    <div>
                      <button onClick={this.toggleHidden}>
                        <WarcIcon />I already have a Warc file to Upload
                      </button>
                      {!isHidden && (
                        <div>
                          <label htmlFor="upload-file">
                            <WarcIcon />
                            WARC/ARC file to upload:{" "}
                          </label>

                          <div className="input-group">
                            <input
                              type="text"
                              id="upload-file"
                              value={file}
                              name="upload-file-text"
                              className="form-control"
                              placeholder="Click Pick File to select a web archive file"
                              readOnly
                              onClick={this.triggerFile}
                              style={{ backgroundColor: "white" }}
                            />

                            <button
                              aria-label="pick file..."
                              type="button"
                              class="btn btn-success"
                              onClick={this.triggerFile}
                            >
                              Pick File...
                            </button>

                            <input
                              type="file"
                              onChange={this.filePicker}
                              ref={(obj99) => {
                                this.fileField = obj99;
                              }}
                              name="uploadFile"
                              style={{ display: "none" }}
                              accept=".gz,.warc,.arc,.har"
                            />
                            <button
                              onClick={this.cancelWarc}
                              disabled={!this.state.canCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormGroup>
                </div>

                <div>
                  <FormGroup id="fieldset">
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef1);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef1);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef1 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="Name or title of the resource. If resource is in Chinese/Japanese/Korean etc.: please put Latin transcription here (Pinyin, Hepbun etc."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                        color: title ? "black" : "red",
                      }}
                    >
                      *Title (Latin alphabet):
                    </div>

                    <FormControl
                      type="text"
                      validationState={this.validateTitle()}
                      placeholder="original script, e.g. Chinese, Japanese, Korean script."
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      style={{
                        border: title ? "1px solid black" : "1px solid #ff1a1a",
                      }}
                      id="title"
                      name="title"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={title}
                    />
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef2);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef2);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef2 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                    >
                      Title (original script):
                    </div>

                    <FormControl
                      type="text"
                      placeholder="you can change Record Title here"
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      id="pubTitleOriginal"
                      name="pubTitleOriginal"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={pubTitleOriginal}
                    />

                    <label
                      style={{ display: "inline", float: "left" }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef24);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef24);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef24 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="obligatory and choose wisely since projektcode is used to sort archives under a topic."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                        color: projektcodeValid ? "black" : "red",
                      }}
                    >
                      *Projektcode (to join arcives under a topic ):
                    </div>

                    <ControlLabel srOnly>projektcode:</ControlLabel>
                    <FormControl
                      style={{
                        border: projektcodeValid
                          ? "1px solid black"
                          : "1px solid #ff1a1a",
                      }}
                      aria-label="text"
                      validationState={this.ValidateProjektcode()}
                      name="projektcode"
                      placeholder="*"
                      autoFocus
                      required
                      value={projektcode}
                      onChange={this.handleChange}
                    />
                  </FormGroup>
                  <FormGroup id="fieldset">
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef3);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef3);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef3 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="Person or institution that authored the resource. If resource is in Chinese/Japanese/Korean etc.: please put Latin transcription here (Pinyin, Hepbun etc."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                        color:
                          selectedGroupName === "corporate/institutional name"
                            ? collTitle || creatorList.length > 0
                              ? "black"
                              : "red"
                            : persName || creatorList.length > 0
                            ? "black"
                            : "red",
                      }}
                    >
                      *Authorship information (Latin alphabet):
                    </div>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "block",
                        float: "left",
                      }}
                    >
                      [corporate/institutional name] or [personal name]:
                    </div>
                    <FormControl
                      componentClass="select"
                      placeholder="corporate/institutional name"
                      inputRef={(ref) => {
                        this.state.groupSelect = ref;
                      }}
                      onChange={this.groupSelect}
                    >
                      {this.state.creatorLegend.map((group) => (
                        <option
                          key={group}
                          value={group}
                          selected={this.state.selectedGroupName == group}
                        >
                          {group}
                        </option>
                      ))}
                    </FormControl>
                    {this.state.selectedGroupName ==
                    "corporate/institutional name" ? (
                      <React.Fragment>
                        <FormControl
                          type="text"
                          validationState={this.validateAuthorship()}
                          placeholder="corporate/institutional name"
                          inputRef={(obj) => {
                            this.input = obj;
                          }}
                          style={{
                            border:
                              collTitle || creatorList.length > 0
                                ? "1px solid black"
                                : "1px solid #ff1a1a",
                          }}
                          id="collTitle"
                          name="collTitle"
                          onFocus={this.focusInput}
                          onChange={this.handleInput}
                          value={collTitle}
                        />
                        <label
                          style={{
                            marginRight: "4px",
                            display: "inline",
                            float: "left",
                          }}
                          onMouseOver={() => {
                            ReactTooltip.show(this.fooRef4);
                          }}
                          onMouseOut={() => {
                            ReactTooltip.hide(this.fooRef4);
                          }}
                        >
                          <span
                            className="glyphicon glyphicon-info-sign"
                            ref={(ref) => (this.fooRef4 = ref)}
                            style={{
                              marginRight: "4px",
                              display: "inline",
                              width: "14px",
                              float: "left",
                            }}
                            data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."
                          />
                        </label>
                        <div
                          style={{
                            marginRight: "4px",
                            display: "inline",
                            float: "left",
                          }}
                        >
                          Authorship information (orig. script):
                        </div>

                        <FormControl
                          type="text"
                          placeholder=""
                          inputRef={(obj) => {
                            this.input = obj;
                          }}
                          id="copTitle"
                          name="copTitle"
                          onFocus={this.focusInput}
                          onChange={this.handleInput}
                          value={copTitle}
                        />
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <FormControl
                          type="text"
                          validationState={this.validateAuthorship()}
                          placeholder="Surname, given name"
                          inputRef={(obj) => {
                            this.input = obj;
                          }}
                          style={{
                            border:
                              persName || creatorList.length > 0
                                ? "1px solid black"
                                : "1px solid #ff1a1a",
                          }}
                          id="persName"
                          name="persName"
                          onFocus={this.focusInput}
                          onChange={this.handleInput}
                          value={persName}
                        />

                        <label
                          style={{
                            marginRight: "4px",
                            display: "inline",
                            float: "left",
                          }}
                          onMouseOver={() => {
                            ReactTooltip.show(this.fooRef5);
                          }}
                          onMouseOut={() => {
                            ReactTooltip.hide(this.fooRef5);
                          }}
                        >
                          <span
                            className="glyphicon glyphicon-info-sign"
                            ref={(ref) => (this.fooRef5 = ref)}
                            style={{
                              marginRight: "4px",
                              display: "inline",
                              width: "14px",
                              float: "left",
                            }}
                            data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."
                          />
                        </label>
                        <div
                          style={{
                            marginRight: "4px",
                            display: "inline",
                            float: "left",
                          }}
                        >
                          Authorship information (orig. script):
                        </div>

                        <FormControl
                          type="text"
                          placeholder=""
                          inputRef={(obj) => {
                            this.input = obj;
                          }}
                          id="surName"
                          name="surName"
                          onFocus={this.focusInput}
                          onChange={this.handleInput}
                          value={surName}
                        />
                      </React.Fragment>
                    )}
                    <button
                      type="button"
                      class="btn btn-success"
                      style={{ float: "right" }}
                      onClick={this.onAddItem}
                      disabled={!persName && !collTitle}
                    >
                      Add Creator
                    </button>
                    {this.state.creatorList.length > 0 && (
                      <ul className="firstChildSpecial">
                        {this.state.creatorList.map((item) => (
                          <AuthorshipItem
                            id={item.id}
                            htmlText={item.htmlText}
                            item={item}
                            onRemoveItem={this.onRemoveItem}
                          />
                        ))}
                      </ul>
                    )}
                  </FormGroup>
                </div>
                <React.Fragment>
                  <FormGroup
                    id="fieldset"
                    validationState={this.titleValidation()}
                  >
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef6);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef6);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef6 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="The name of the entity that holds, archives, publishes, prints, distributes, releases, issues or produces the resource. This property will be used to formulate the citation. If resource is in Chinese/Japanese/Korean etc.: please put Latin transcription here (Pinyin, Hepbun etc.)"
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                        color: publisher ? "black" : "red",
                      }}
                    >
                      *Publisher (Latin alphabet):
                    </div>

                    <FormControl
                      type="text"
                      placeholder="Publisher"
                      validationState={this.validatePublisher()}
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      style={{
                        border: publisher
                          ? "1px solid black"
                          : "1px solid #ff1a1a",
                      }}
                      id="publisher"
                      name="publisher"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={publisher}
                    />
                    <label
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef7);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef7);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef7 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                    >
                      Publisher (orig. script):
                    </div>

                    <FormControl
                      type="text"
                      placeholder="publisherOriginal"
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      id="publisherOriginal"
                      name="publisherOriginal"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={publisherOriginal}
                    />
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef8);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef8);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef8 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="Date when the data is made publicly available."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                    >
                      Publication date [YYYY-MM-DD]:
                    </div>

                    <FormControl
                      type="text"
                      placeholder="Year of publication"
                      validationState={this.validatePublishYear()}
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      id="publishYear"
                      name="publishYear"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={publishYear}
                    />
                  </FormGroup>
                </React.Fragment>

                <div>
                  <FormGroup id="fieldset">
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef9);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef9);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef9 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="Subject headings help to describe and categorize the web resource. The headings should conform to a list drawn from the Library of Congress, see http://id.loc.gov/authorities/subjects.html."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                    >
                      Subject headings (in English):
                    </div>

                    <FormControl
                      type="text"
                      placeholder="subject"
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      id="subjectHeadingText"
                      name="subjectHeadingText"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={subjectHeadingText}
                    />

                    <button
                      type="button"
                      class="btn btn-success"
                      style={{ float: "right" }}
                      onClick={this.onAddSubject}
                      disabled={!subjectHeadingText}
                    >
                      Add header
                    </button>
                    {this.state.subjectHeaderList.length > 0 && (
                      <ul className="firstChildSpecial">
                        {this.state.subjectHeaderList.map((item) => (
                          <PersonHeading
                            id={item.id}
                            htmlText={item.htmlText}
                            item={item}
                            onRemovePerson={this.onRemovePerson}
                          />
                        ))}
                      </ul>
                    )}
                  </FormGroup>
                  <FormGroup id="fieldset">
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef10);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef10);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef10 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="Adding person headings allows for expanding the catalogue entry by the persons the web resource focuses on."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                    >
                      Person headings:
                    </div>

                    <FormControl
                      type="text"
                      placeholder="person"
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      id="personHeadingText"
                      name="personHeadingText"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={personHeadingText}
                    />
                    <button
                      type="button"
                      class="btn btn-success"
                      style={{ float: "right" }}
                      onClick={this.onAddPerson}
                      disabled={!personHeadingText}
                    >
                      Add header
                    </button>

                    {this.state.personHeaderList.length > 0 && (
                      <ul className="firstChildSpecial">
                        {this.state.personHeaderList.map((item) => (
                          <PersonHeading
                            id={item.id}
                            htmlText={item.htmlText}
                            item={item}
                            onRemovePerson={this.onRemovePerson}
                          />
                        ))}
                      </ul>
                    )}
                  </FormGroup>
                </div>
                <div>
                  <FormGroup id="fieldset">
                    <label
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef11);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef11);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => (this.fooRef11 = ref)}
                        style={{
                          marginRight: "4px",
                          display: "inline",
                          width: "14px",
                          float: "left",
                        }}
                        data-tip="If you have comments for the DACHS team you can post them here."
                      />
                    </label>
                    <div
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                    >
                      Note to DACHS team:
                    </div>

                    <ControlLabel srOnly>Note to DACHS team:</ControlLabel>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="note to dachs"
                      inputRef={(obj) => {
                        this.input = obj;
                      }}
                      id="noteToDachs"
                      name="noteToDachs"
                      onFocus={this.focusInput}
                      onChange={this.handleInput}
                      value={noteToDachs}
                    />
                  </FormGroup>
                </div>

                {isUploading && (
                  <React.Fragment>
                    <div className="wr-progress-bar">
                      <div
                        className="progress"
                        style={{ width: `${progress || 0}%` }}
                      />
                      <div className="progress-readout">{`${
                        progress || 0
                      }%`}</div>
                    </div>
                    {status && <p>{status}</p>}
                  </React.Fragment>
                )}
              </span>
            )}
            <button
              className="btn btn-lg btn-primary btn-block"
              onClick={this.submit}
              disabled={
                !emailValid ||
                !urlValid ||
                !projektcodeValid ||
                !title ||
                !publisher ||
                (creatingCollection && !error) ||
                (selectedGroupName === "corporate/institutional name"
                  ? !(collTitle || creatorList.length > 0)
                  : !(persName || creatorList.length > 0))
              }
              type="button"
            >
              Create
            </button>
          </form>
        </Modal>
        <ReactTooltip
          className="extraClass"
          delayHide={100}
          effect="solid"
          type="info"
        />
      </React.Fragment>
    );
  }
}

export default NewCollection;
