import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Toggle from 'react-toggle';
import { Alert, ControlLabel, FormGroup, FormControl } from 'react-bootstrap';

import { defaultCollectionTitle } from 'config';
import { collection } from 'helpers/userMessaging';

import Modal from 'components/Modal';

import ReactTooltip from 'react-tooltip';

import './style.scss';

const creatorLegend = ['corporate/institutional name', 'personal name'];
const creatorList = [];
const subjectHeaderList = [];
const personHeaderList = [];

class NewCollection extends Component {
  static propTypes = {
    close: PropTypes.func,
    createCollection: PropTypes.func,
    creatingCollection: PropTypes.bool,
    error: PropTypes.string,
    showModal: PropTypes.bool,
    visible: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      listID: 0,
      urlValid: false,
      emailValid: false,
      publisher: '',
      publisherOriginal: '',
      subjectHeaderList,
      subjectHeadingText: '',
      personHeaderList,
      personHeadingText: '',
      collTitle: '',
      title: '',
      pubTitleOriginal: '',
      collYear: '',
      copTitle: '',
      surName: '',
      persName: '',
      usermail: '',
      creatorList,
      isPublic: false,
      creatorLegend,
      noteToDachs: '',
      publishYear: '',
      selectedGroupName: 'corporate/institutional name',
      url: '',
      ticketState: 'open',
      isCollLoaded: true,
      recordingUrl: '',
      recordingTimestamp:''
    };
  }
  checkEmail = () => {
    this.setState({ checkEmail: true });
  }

  focusInput = (evt) => {
    this.input.setSelectionRange(0, evt.target.value.length);
  }

  handleInput = (evt) => {
    this.setState({ [evt.target.name]: evt.target.value });
  }
  handleChange = (evt) => {
    if (evt.target.type === 'radio') {
      this.setState({ [evt.target.name]: evt.target.value === 'yes' });
    } else {
      this.setState({ [evt.target.name]: evt.target.value });
    }
  }


  goToCollections = () => {
    const { auth, history } = this.props;
    history.push(`/${auth.getIn(['user', 'username'])}`);
  }

  groupSelect = (evt) => {
    this.setState({ [evt.target.name]: evt.target.value });
    this.setState({ selectedGroupName: evt.target.value });
  }

  onRemoveItem = (item) => {
    this.setState({
        creatorList: this.state.creatorList.filter(el => el !== item)
    })
  }
  onRemoveSubject = (item) => {
    this.setState({
        subjectHeaderList: this.state.subjectHeaderList.filter(el => el !== item)
    })
  }
  onRemovePerson = (item) => {
    this.setState({
        personHeaderList: this.state.personHeaderList.filter(el => el !== item)
    })
  }
  onAddItem = () => {
    this.setState({ listID: this.state.listID + 1 });
    if (this.state.selectedGroupName==='corporate/institutional name') {
      let tempText = "C/I name:"+this.state.collTitle;
      this.state.copTitle!==""?tempText+=", "+this.state.copTitle:null;

      const temp =
      {
      "htmlText": tempText,
      "id": this.state.listID
    };
      this.setState(state => {

        const creatorList = [...state.creatorList, temp];
        return {
          creatorList,
          collTitle: '',
          copTitle: '',
        };
      });
    }
    else {
      let tempText = "personal name:"+this.state.persName;
      this.state.surName!==""?tempText+=", "+this.state.surName:null;
      this.state.collYear!==""?tempText+=" - "+this.state.collYear:null;
      const temp =
      {
      "htmlText": tempText,
      "id": this.state.listID,
      "personal_name": this.state.persName,
      "surname": this.state.surName,
      "coll_year": this.state.collYear

    };
      this.setState(state => {
        const creatorList = [...state.creatorList, temp];
        return {
          creatorList,
          persName: '',
          surName: '',
          collYear: '',
        };
      });
    }

  }

  onAddSubject = () => {
    this.setState({ listID: this.state.listID + 1 });

      const temp =
      {
      "htmlText": this.state.subjectHeadingText,
      "id": this.state.listID
    };
      this.setState(state => {
        const subjectHeaderList = [...state.subjectHeaderList, temp];
        return {
          subjectHeaderList,
          subjectHeadingText: ''
        };
      });
    }
    onAddPerson = () => {
      this.setState({ listID: this.state.listID + 1 });

        const temp =
        {
        "htmlText": this.state.personHeadingText,
        "id": this.state.listID
      };
        this.setState(state => {
          const personHeaderList = [...state.personHeaderList, temp];
          return {
            personHeaderList,
            personHeadingText: ''
          };
        });
      }

  onClearArray = () => {
    this.setState({ list: [] });
  };
  validateCollYear = () => {
    const { collYear } = this.state;
    const myTest = /[0-9]{4}( - [0-9]{4})?/;
    return myTest.test(collYear);
  }

  validatePublishYear = () => {
    const { publishYear } = this.state;
    const myTest = /[0-9]{4}([0-9]{2})?([0-9]{2})?/;
    return myTest.test(publishYear);
  }
  rebuildTooltip = () => {
    ReactTooltip.rebuild();
  }

  submit = (evt) => {

    evt.stopPropagation();
    evt.preventDefault();
    const { title, url, isPublic, creatorList, subjectHeaderList, personHeaderList, noteToDachs,publisher,collTitle,publisherOriginal,collYear,copTitle,surName,persName,usermail,selectedGroupName,publishYear, pubTitleOriginal, personHeadingText, subjectHeadingText, listID, ticketState, isCollLoaded, recordingUrl, recordingTimestamp } = this.state;
    this.props.createCollection(title, url, isPublic,JSON.stringify(creatorList),JSON.stringify(subjectHeaderList),JSON.stringify(personHeaderList), noteToDachs,publisher,collTitle,publisherOriginal,collYear,copTitle,surName,persName,usermail,selectedGroupName,publishYear, pubTitleOriginal, personHeadingText, subjectHeadingText, listID, ticketState, isCollLoaded, recordingUrl, recordingTimestamp);
  }
  validateEmail = () => {
    const { emailValid, email } = this.state;
    /*if (checkEmail && ( email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) === null)) {
      return 'error';
    }
    return null;*/
    const myTest = /^([a-zA-Z\-\_0-9]+)@(([a-zA-Z\-0-9]+\.{1})+[a-zA-Z]{2,3})$/;
    if (myTest.test(email) === true && !emailValid) {
        this.setState({ emailValid: true });
      }else if (myTest.test(email) === false && emailValid) {
        this.setState({ emailValid: false });
      }
  }
  validateURL = () => {
    const { url, urlValid } = this.state;
    ///^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/
    //const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const myTest = /((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*)([\w\-\.]+[^#?\s]+)(.*)?((#[\w\-]+)|([a-zA-Z]{2,3}))$/i;
    //this.setState({ urlValid: myTest.test(url) });
    if (myTest.test(url) === true && !urlValid) {
        this.setState({ urlValid: true });
      }else if (myTest.test(url) === false && urlValid) {
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
  }
  validateAuthorship = () => {
    const { collTitle, copTitle, persName, surName, collYear } = this.state;


    if (this.state.selectedGroupName == 'corporate/institutional name') {
      if  (!collTitle) {
        return 'error';
      }
    }else {
      if  (!surName) {
        return 'error';
      }
    }

    return null;
  }


  validateTitle = () => {
    const { title } = this.state;
      if  (!title) {
        return 'error';
      }
    return null;
  }
  validatePublisher = () => {
    const { publisher } = this.state;
      if  (!publisher) {
        return 'error';
      }
    return null;
  }

  titleValidation = () => {
    return this.props.error ? 'error' : null;
  }

  togglePublic = (evt) => {
    this.setState({ isPublic: !this.state.isPublic });
  }

  render() {

    const { close, creatingCollection, error, visible } = this.props;
    const { collTitle, collYear, emailValid, surName, copTitle, isPublic , noteToDachs, title, publisherOriginal, publishYear, usermail, persName, pubTitleOriginal, publisher, selectedGroupName, subjectHeadingText, personHeadingText,creatorLegend, url, urlValid, creatorList } = this.state;

const text = `To edit Metadata, please use the information form below.${"\n"} Fields marked with asterisk (*) are required`
    if (visible) {
        this.rebuildTooltip();
    }
    return (
      <React.Fragment>
      <Modal
        closeCb={close}
        header={text}
        visible={visible}>

        <form onSubmit={this.submit} id="create-coll" className="form-horizontal">
          {
            error &&
              <Alert bsStyle="danger">
                { collection[error] || 'Error encountered' }
              </Alert>
          }
          {
            !__DESKTOP__ &&
              <span className="col-xs-7 col-xs-offset-1">
              <div>
                <FormGroup id="fieldset">
                <label style={{ display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="Any further information regarding your OpenDACHS request will be sent to this e-mail address."/></label>
                    <div  style={{ marginRight: '4px', display: 'inline', float: 'left' ,color:emailValid?'black':'red'}} >*Your e-mail address:</div>

                  <ControlLabel srOnly>email address:</ControlLabel>
                  <FormControl
                    aria-label="email"
                    validationState={this.validateEmail()}
                    name="usermail"
                    placeholder="please enter your email*"
                    autoFocus
                    required
                    value={usermail}
                    onChange={this.handleChange}
                    onBlur={this.checkEmail} />
                </FormGroup>
              </div>

              <div>
                <FormGroup id="fieldset">
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef21) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef21) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef21 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="URL of the web resource."/></label>
                <div  style={{ marginRight: '4px', display: 'inline', float: 'left' ,color:urlValid?'black':'red' }} >*URL:</div>
                <FormControl
                  aria-label="url"
                  validationState={this.validateURL()}
                  name="url"
                  placeholder="please enter a valid webpage url*"
                  required
                  value={url}
                  onChange={this.handleInput}
                   />
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef1) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef1) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef1 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="Name or title of the resource. If resource is in Chinese/Japanese/Korean etc.: please put Latin transcription here (Pinyin, Hepbun etc."/></label>
                <div  style={{ marginRight: '4px', display: 'inline', float: 'left' ,color:title?'black':'red' }} >*Title (Latin alphabet):</div>

                <FormControl type="text"  validationState={this.validateTitle()} placeholder="original script, e.g. Chinese, Japanese, Korean script." inputRef={(obj) => { this.input = obj; }} id="title" name="title" onFocus={this.focusInput} onChange={this.handleInput} value={title} />
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef2) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef2) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef2 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."/></label>
                <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Title (original script):</div>

                <FormControl type="text" placeholder="you can change Record Title here" inputRef={(obj) => { this.input = obj; }} id="pubTitleOriginal" name="pubTitleOriginal" onFocus={this.focusInput} onChange={this.handleInput} value={pubTitleOriginal} />
                </FormGroup>
                <FormGroup id="fieldset">
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef3) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef3) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef3 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="Person or institution that authored the resource. If resource is in Chinese/Japanese/Korean etc.: please put Latin transcription here (Pinyin, Hepbun etc."/></label>
                    <div  style={{ marginRight: '4px', display: 'inline', float: 'left' ,color:(collTitle||persName)?'black':'red' }} >*Authorship information (Latin alphabet):</div>
<div  style={{ marginRight: '4px', display: 'block', float: 'left' }} >[corporate/institutional name] or [personal name]:</div>
                      <FormControl componentClass="select" placeholder="corporate/institutional name" inputRef={(ref) => { this.state.groupSelect = ref }} onChange={this.groupSelect}>
                      {
                          this.state.creatorLegend.map(group => (
                              <option key={group} value={group} selected={this.state.selectedGroupName == group}>{group}</option>
                          ))
                      }
                      </FormControl>
                        {this.state.selectedGroupName == 'corporate/institutional name' ? (
                          <React.Fragment>
                            <FormControl type="text" validationState={this.validateAuthorship()} placeholder="corporate/institutional name" inputRef={(obj) => { this.input = obj; }} id="collTitle" name="collTitle" onFocus={this.focusInput} onChange={this.handleInput} value={collTitle} />
                            <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef4) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef4) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef4 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."/></label>
                            <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Authorship information (orig. script):</div>

                            <FormControl type="text" placeholder="" inputRef={(obj) => { this.input = obj; }} id="copTitle" name="copTitle" onFocus={this.focusInput} onChange={this.handleInput} value={copTitle} />


                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <FormControl type="text" validationState={this.validateAuthorship()} placeholder="Surname, given name" inputRef={(obj) => { this.input = obj; }} id="persName" name="persName" onFocus={this.focusInput} onChange={this.handleInput} value={persName} />
                            <FormControl type="text" placeholder="YYYY" validationState={this.validateCollYear()}  inputRef={(obj) => { this.input = obj; }} id="collYear" name="collYear" onFocus={this.focusInput} onChange={this.handleInput} value={collYear} />
                            <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef5) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef5) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef5 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."/></label>
                            <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Authorship information (orig. script):</div>

                            <FormControl type="text" placeholder="" inputRef={(obj) => { this.input = obj; }} id="surName" name="surName" onFocus={this.focusInput} onChange={this.handleInput} value={surName} />

                          </React.Fragment>
                        )}
                        {
                      this.state.creatorList.length>0 &&  <ul>
                        {
                          this.state.creatorList.map(item => (
                            <li key={item.id}>
                              <React.Fragment>
                                <span className="glyphicon glyphicon-remove glyphicon-button" value={item} onClick={() => this.onRemoveItem(item)}style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} />
                                <div>{item.htmlText}</div>
                              </React.Fragment>
                            </li>
                          ))
                        }
                        </ul>
                      }
                    <button type="button" class="btn btn-success"  style={{float:'right'}} onClick={this.onAddItem} disabled={!persName && !collTitle}>Add Creator</button>
                </FormGroup>
              </div>
              <React.Fragment>
              <FormGroup id="fieldset" validationState={this.titleValidation()}>
              <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef6) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef6) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef6 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="The name of the entity that holds, archives, publishes, prints, distributes, releases, issues or produces the resource. This property will be used to formulate the citation. If resource is in Chinese/Japanese/Korean etc.: please put Latin transcription here (Pinyin, Hepbun etc.)"/></label>
              <div  style={{ marginRight: '4px', display: 'inline', float: 'left' ,color:publisher?'black':'red' }} >*Publisher (Latin alphabet):</div>

                <FormControl type="text" placeholder="Publisher"  validationState={this.validatePublisher()} inputRef={(obj) => { this.input = obj; }} id="publisher" name="publisher" onFocus={this.focusInput} onChange={this.handleInput} value={publisher} />
<label onMouseOver={() => { ReactTooltip.show(this.fooRef7) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef7) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef7 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="if applicable: same information in original script, e.g. Chinese, Japanese, Korean script."/></label>
                <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Publisher (orig. script):</div>

                  <FormControl type="text" placeholder="publisherOriginal" inputRef={(obj) => { this.input = obj; }} id="publisherOriginal" name="publisherOriginal" onFocus={this.focusInput} onChange={this.handleInput} value={publisherOriginal} />
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef8) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef8) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef8 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="Date when the data is made publicly available."/></label>
                <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Publication date [YYYY-MM-DD]:</div>

                <FormControl type="text" placeholder="Year of publication" validationState={this.validatePublishYear()} inputRef={(obj) => { this.input = obj; }} id="publishYear" name="publishYear" onFocus={this.focusInput} onChange={this.handleInput} value={publishYear} />
              </FormGroup>
              </React.Fragment>

              <div>
                <FormGroup id="fieldset">
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef9) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef9) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef9 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="Subject headings help to describe and categorize the web resource. The headings should conform to a list drawn from the Library of Congress, see http://id.loc.gov/authorities/subjects.html."/>
                    </label><div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Subject headings (in English):</div>


                          <React.Fragment>
                            <FormControl type="text" placeholder="subject" inputRef={(obj) => { this.input = obj; }} id="subjectHeadingText" name="subjectHeadingText" onFocus={this.focusInput} onChange={this.handleInput} value={subjectHeadingText} />
                          </React.Fragment>
                          {
                      this.state.subjectHeaderList.length>0 && <ul>
                        {
                          this.state.subjectHeaderList.map(item => (
                            <li key={item.id}>
                              <React.Fragment>
                                <span className="glyphicon glyphicon-remove glyphicon-button" value={item} onClick={() => this.onRemoveSubject(item)}style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} />
                                <div>{item.htmlText}</div>
                              </React.Fragment>
                            </li>
                          ))
                        }
                        </ul>
                        }
                    <button type="button" class="btn btn-success"  style={{float:'right'}} onClick={this.onAddSubject} disabled={!subjectHeadingText}>Add header</button>
                </FormGroup>
                <FormGroup id="fieldset">
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef10) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef10) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef10 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="Adding person headings allows for expanding the catalogue entry by the persons the web resource focuses on."/></label>
                    <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Person headings:</div>


                          <React.Fragment>
                            <FormControl type="text" placeholder="person" inputRef={(obj) => { this.input = obj; }} id="personHeadingText" name="personHeadingText" onFocus={this.focusInput} onChange={this.handleInput} value={personHeadingText} />
                          </React.Fragment>
                          {
                        this.state.personHeaderList.length>0 && <ul>
                        {
                          this.state.personHeaderList.map(item => (
                            <li key={item.id}>
                              <React.Fragment>
                                <span className="glyphicon glyphicon-remove glyphicon-button" value={item} onClick={() => this.onRemovePerson(item)}style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} />
                                <div>{item.htmlText}</div>
                              </React.Fragment>
                            </li>
                          ))
                        }
                        </ul>}
                    <button type="button" class="btn btn-success"  style={{float:'right'}} onClick={this.onAddPerson} disabled={!personHeadingText}>Add header</button>
                </FormGroup>
              </div>
              <div>
                <FormGroup id="fieldset">
                <label style={{ marginRight: '4px', display: 'inline', float: 'left' }} onMouseOver={() => { ReactTooltip.show(this.fooRef11) }} onMouseOut={() => { ReactTooltip.hide(this.fooRef11) }}><span className="glyphicon glyphicon-info-sign"  ref={ref => this.fooRef11 = ref} style={{ marginRight: '4px', display: 'inline' ,width: '14px', float:'left'}} data-tip="If you have comments for the DACHS team you can post them here."/></label>
                    <div  style={{ marginRight: '4px', display: 'inline', float: 'left' }} >Note to DACHS team:</div>

                  <ControlLabel srOnly>Note to DACHS team:</ControlLabel>
                  <textarea
           className="form-control"
           rows="3"
           placeholder="note to dachs"
           inputRef={(obj) => { this.input = obj; }}
           id="noteToDachs"
           name="noteToDachs"
           onFocus={this.focusInput}
           onChange={this.handleInput}
           value={noteToDachs}
           />
           </FormGroup>
              </div>
              </span>


          }
            <button className="btn btn-lg btn-primary btn-block" onClick={this.submit} disabled={!emailValid || (!collTitle&&!surName&&!creatorList.length>0) || !urlValid || !title || !publisher || (creatingCollection && !error)} type="button">Create</button>
        </form>
      </Modal>
      <ReactTooltip className='extraClass' delayHide={100} effect='solid' type='info'/>
    </React.Fragment>

    );
  }
}

export default NewCollection;
