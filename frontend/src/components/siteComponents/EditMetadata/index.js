/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
/* eslint-disable indent */
import React, { Component } from "react";
import PropTypes from "prop-types";
import Toggle from "react-toggle";
import { Alert, ControlLabel, FormGroup, FormControl } from "react-bootstrap";

import { defaultCollectionTitle } from "config";
import { collection } from "helpers/userMessaging";

import Modal from "components/Modal";

import ReactTooltip from "react-tooltip";

import "./style.scss";

const creatorLegend = ["corporate/institutional name", "personal name"];
const creatorList = [];
const subjectHeaderList = [];
const personHeaderList = [];

class EditMetadata extends Component {
  static propTypes = {
    close: PropTypes.func,
    editCollection: PropTypes.func,
    coll: PropTypes.object,
    error: PropTypes.string,
    key: PropTypes.string,
    showModal: PropTypes.bool,
    visible: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.state = {
      listID: 0,
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
      persName: "",
      usermail: "",
      emailValid: true,
      creatorList,
      isPublic: false,
      creatorLegend,
      noteToDachs: "",
      publishYear: "",
      projektcode: "",
      projektcodeValid: true,
      selectedGroupName: "corporate/institutional name",
      url: "",
      ticketState: "open",
      isCollLoaded: true,
      recordingUrl: "",
      recordingTimestamp: "",
    };
  }

  componentDidMount(prevProps) {
    const self = this;
    const promise1 = new Promise((resolve, reject) => {
      var didSucceed = JSON.parse(
        self.props.coll.get("personHeaderList").replace(/'/g, '"')
      );
      resolve(didSucceed);
    });
    const promise2 = new Promise((resolve, reject) => {
      var didSucceed = JSON.parse(
        self.props.coll.get("subjectHeaderList").replace(/'/g, '"')
      );
      resolve(didSucceed);
    });
    const promise3 = new Promise((resolve, reject) => {
      var didSucceed = JSON.parse(
        self.props.coll.get("creatorList").replace(/'/g, '"')
      );
      resolve(didSucceed);
    });

    Promise.all([promise1, promise2, promise3])
      .then((values) => {
        self.setState((state) => {
          return {
            personHeaderList: values[0],
            subjectHeaderList: values[1],
            creatorList: values[2],
          };
        });
      })
      .catch((err) => {
        console.log("There was an error:" + err);
      });

    this.setState((state) => {
      return {
        listID: this.props.coll.get("listID"),
        publisher: this.props.coll.get("publisher"),
        publisherOriginal: this.props.coll.get("publisherOriginal"),
        subjectHeadingText: this.props.coll.get("subjectHeadingText"),
        personHeadingText: this.props.coll.get("personHeadingText"),
        collTitle: this.props.coll.get("collTitle"),
        title: this.props.coll.get("title"),
        pubTitleOriginal: this.props.coll.get("pubTitleOriginal"),
        collYear: this.props.coll.get("collYear"),
        copTitle: this.props.coll.get("copTitle"),
        noteToDachs: this.props.coll.get("noteToDachs"),
        surName: this.props.coll.get("surName"),
        persName: this.props.coll.get("persName"),
        usermail: this.props.coll.get("usermail"),
        publishYear: this.props.coll.get("publishYear"),
        projektcode: this.props.coll.get("projektcode"),
        selectedGroupName: "corporate/institutional name",
        url: this.props.coll.get("url"),
      };
    });
  }

  checkEmail = () => {
    this.setState({ checkEmail: true });
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

  groupSelect = (evt) => {
    this.setState({ [evt.target.name]: evt.target.value });
    this.setState({ selectedGroupName: evt.target.value });
  };

  onRemoveItem = (item) => {
    this.setState({
      creatorList: this.state.creatorList.filter((el) => {
        el !== item;
      }),
    });
  };

  onRemoveSubject = (item) => {
    this.setState({
      subjectHeaderList: this.state.subjectHeaderList.filter((el) => {
        el !== item;
      }),
    });
  };

  onRemovePerson = (item) => {
    this.setState({
      personHeaderList: this.state.personHeaderList.filter((el) => {
        el !== item;
      }),
    });
  };

  onAddItem = () => {
    this.setState({ listID: this.state.listID + 1 });
    if (this.state.selectedGroupName === "corporate/institutional name") {
      const temp = {
        htmlText:
          "C/I name:" + this.state.collTitle + ", " + this.state.copTitle,
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
      const temp = {
        htmlText:
          "personal name:" +
          this.state.persName +
          " " +
          this.state.surName +
          ", " +
          this.state.copOrig +
          "- " +
          this.state.collYear,
        id: this.state.listID,
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

  validateEmail = () => {
    const { emailValid, usermail } = this.state;
    /*if (checkEmail && ( email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) === null)) {
      return 'error';
    }
    return null;*/
    const myTest = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[]|\\[])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[]|\\[])+)\])/;
    if (myTest.test(usermail) === true && !emailValid) {
      this.setState({ emailValid: true });
    } else if (myTest.test(usermail) === false && emailValid) {
      this.setState({ emailValid: false });
    }
  };

  validateCollYear = () => {
    const { collYear } = this.state;
    const myTest = /[0-9]{4}( - [0-9]{4})?/;
    return myTest.test(collYear);
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
    } = this.state;
    const { coll } = this.props;
    this.props.editCollection(
      coll.get("id"),
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
      listID
    );
    this.props.close();
  };

  titleValidation = () => {
    return this.props.error ? "error" : null;
  };

  togglePublic = (evt) => {
    this.setState({ isPublic: !this.state.isPublic });
  };

  render() {
    const { close, error, coll, visible } = this.props;
    const {
      collTitle,
      collYear,
      surName,
      copTitle,
      emailValid,
      isPublic,
      noteToDachs,
      title,
      publisherOriginal,
      publishYear,
      usermail,
      persName,
      pubTitleOriginal,
      publisher,
      selectedGroupName,
      projektcode,
      projektcodeValid,
      subjectHeadingText,
      personHeadingText,
      creatorLegend,
      url,
    } = this.state;
    const text = `To edit Metadata, please use the information form below.${"\n"} Fields marked with asterisk (*) are required`;
    if (visible) {
      this.rebuildTooltip();
    }
    return (
      <React.Fragment>
        <Modal closeCb={close} header={text} visible={visible}>
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
                        ref={(ref) => {
                          this.fooRef = ref;
                        }}
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
                        ReactTooltip.show(this.fooRef1);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef1);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => {
                          this.fooRef1 = ref;
                        }}
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
                      required
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
                        ref={(ref) => {
                          this.fooRef2 = ref;
                        }}
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
                        ref={(ref) => {
                          this.fooRef24 = ref;
                        }}
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
                        ref={(ref) => {
                          this.fooRef3 = ref;
                        }}
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
                        color: collTitle || persName ? "black" : "red",
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
                      required
                      placeholder="corporate/institutional name"
                      inputRef={(ref) => {
                        this.state.groupSelect = ref;
                      }}
                      onChange={this.groupSelect}
                    >
                      {this.state.creatorLegend.map((group) => {
                        <option
                          key={group}
                          value={group}
                          selected={this.state.selectedGroupName == group}
                        >
                          {group}
                        </option>;
                      })}
                    </FormControl>
                    {this.state.selectedGroupName ==
                    "corporate/institutional name" ? (
                      <React.Fragment>
                        <FormControl
                          type="text"
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
                            ref={(ref) => {
                              this.fooRef4 = ref;
                            }}
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
                        <FormControl
                          type="text"
                          placeholder="YYYY"
                          validationState={this.validateCollYear()}
                          inputRef={(obj) => {
                            this.input = obj;
                          }}
                          id="collYear"
                          name="collYear"
                          onFocus={this.focusInput}
                          onChange={this.handleInput}
                          value={collYear}
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
                            ref={(ref) => {
                              this.fooRef5 = ref;
                            }}
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
                    {this.state.creatorList.length > 0 && (
                      <ul>
                        {this.state.creatorList.map((item) => {
                          <li key={item.id}>
                            <React.Fragment>
                              <span
                                className="glyphicon glyphicon-remove glyphicon-button"
                                value={item}
                                onClick={() => this.onRemoveItem(item)}
                                style={{
                                  marginRight: "4px",
                                  display: "inline",
                                  width: "14px",
                                  float: "left",
                                }}
                              />
                              <div>{item.htmlText}</div>
                            </React.Fragment>
                          </li>;
                        })}
                      </ul>
                    )}
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ float: "right" }}
                      onClick={this.onAddItem}
                      disabled={!persName && !collTitle}
                    >
                      Add Additional Creator
                    </button>
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
                        ref={(ref) => {
                          this.fooRef6 = ref;
                        }}
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
                      required
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
                      style={{
                        marginRight: "4px",
                        display: "inline",
                        float: "left",
                      }}
                      onMouseOver={() => {
                        ReactTooltip.show(this.fooRef7);
                      }}
                      onMouseOut={() => {
                        ReactTooltip.hide(this.fooRef7);
                      }}
                    >
                      <span
                        className="glyphicon glyphicon-info-sign"
                        ref={(ref) => {
                          this.fooRef7 = ref;
                        }}
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
                        ref={(ref) => {
                          this.fooRef8 = ref;
                        }}
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
                        ref={(ref) => {
                          this.fooRef9 = ref;
                        }}
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

                    <React.Fragment>
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
                    </React.Fragment>
                    {this.state.subjectHeaderList.length > 0 && (
                      <ul>
                        {this.state.subjectHeaderList.map((item) => {
                          <li key={item.id}>
                            <React.Fragment>
                              <span
                                className="glyphicon glyphicon-remove glyphicon-button"
                                value={item}
                                onClick={() => this.onRemoveSubject(item)}
                                style={{
                                  marginRight: "4px",
                                  display: "inline",
                                  width: "14px",
                                  float: "left",
                                }}
                              />
                              <div>{item.htmlText}</div>
                            </React.Fragment>
                          </li>;
                        })}
                      </ul>
                    )}
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ float: "right" }}
                      onClick={this.onAddSubject}
                      disabled={!subjectHeadingText}
                    >
                      Add Additional header
                    </button>
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
                        ref={(ref) => {
                          this.fooRef10 = ref;
                        }}
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

                    <React.Fragment>
                      <FormControl
                        as="textarea"
                        rows="3"
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
                    </React.Fragment>
                    {this.state.personHeaderList.length > 0 && (
                      <ul>
                        {this.state.personHeaderList.map((item) => {
                          <li key={item.id}>
                            <React.Fragment>
                              <span
                                className="glyphicon glyphicon-remove glyphicon-button"
                                value={item}
                                onClick={() => this.onRemovePerson(item)}
                                style={{
                                  marginRight: "4px",
                                  display: "inline",
                                  width: "14px",
                                  float: "left",
                                }}
                              />
                              <div>{item.htmlText}</div>
                            </React.Fragment>
                          </li>;
                        })}
                      </ul>
                    )}
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ float: "right" }}
                      onClick={this.onAddPerson}
                      disabled={!personHeadingText}
                    >
                      Add Additional header
                    </button>
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
                        ref={(ref) => {
                          this.fooRef11 = ref;
                        }}
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
              </span>
            )}
            <button
              className="btn btn-lg btn-primary btn-block"
              onClick={this.submit}
              disabled={false && !error}
              type="button"
            >
              Close Edit
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

export default EditMetadata;
