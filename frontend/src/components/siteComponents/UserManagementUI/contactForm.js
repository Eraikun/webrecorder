import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Alert, Button, Col, Form, FormGroup, FormControl, ControlLabel, Row } from 'react-bootstrap';

import { guestSessionTimeout, product, userRegex } from 'config';
import { login } from 'helpers/userMessaging';

import { TempUsage } from 'containers';


class ContactForm extends Component {
  static propTypes = {
    anonCTA: PropTypes.bool,
    auth: PropTypes.object,
    cb: PropTypes.func,
    error: PropTypes.bool,
    closeLogin: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      name: '',
      email: '', // maybe default to user email if logged in?
      subject: '',
      message: ''
    };
  }

  save = (evt) => {
    evt.preventDefault();
    const { auth } = this.props;
    const { name, email, subject, message } = this.state;

    // below is from usage as login form
    // TODO: do stuff with name, email, subject, message

    // let data = { username, password };
    //
    //
    // // check for anon usage
    // if (auth.getIn(['user', 'anon']) && auth.getIn(['user', 'num_collections']) > 0) {
    //   data = { ...data, toColl };
    // }
    //

    let data = { name, email, subject, message };
    this.props.cb(data);
  }

  // // below is username validation from usage as login form. maybe we want e.g. email validation?
  // validateUsername = () => {
  //   const pattern = userRegex;
  //   if (typeof this.state.username !== 'undefined') {
  //     return this.state.username.match(pattern) === this.state.username ? null : 'warning';
  //   }
  //   return null;
  // }

  handleChange = (evt) => {
    if (evt.target.type === 'radio') {
      this.setState({ [evt.target.name]: evt.target.value === 'yes' });
    } else {
      this.setState({ [evt.target.name]: evt.target.value });
    }
  }

  render() {
    const { anonCTA, auth, closeLogin, error } = this.props;
    const { name, email, subject, message } = this.state;

    return (
      <React.Fragment>
        <Row className="wr-login-form">
          <h4>Contact us!</h4>
          {/*
            error &&
              <Alert bsStyle="danger">
                {
                  login[auth.get('loginError')] || <span>Invalid Login. Please Try Again</span>
                }
              </Alert>
          */}
          <Form id="loginform" onSubmit={this.save}>
            <FormGroup
              key="username" controlId="formName">
              <ControlLabel>Name:</ControlLabel>
              <FormControl aria-label="name" onChange={this.handleChange} value={name} type="text" id="name" name="name" className="form-control" placeholder="Enter your name" required autoFocus />
              <div className="help-block with-errors" />
            </FormGroup>

            <FormGroup key="email" controlId="formEmail">
              <ControlLabel>E-mail:</ControlLabel>
              <FormControl aria-label="email" onChange={this.handleChange} value={email} type="email" id="email" name="email" className="form-control" placeholder="name@example.com" required />
            </FormGroup>

            <FormGroup key="subject" controlId="formSubject">
              <ControlLabel>Subject:</ControlLabel>
              <FormControl aria-label="subject" onChange={this.handleChange} value={subject} type="text" id="subject" name="subject" className="form-control" placeholder="What do you need help with?" required />
            </FormGroup>

            <FormGroup key="message" controlId="formMessage">
              <ControlLabel>Message:</ControlLabel>
              <FormControl componentClass="textarea" rows={4} aria-label="message" onChange={this.handleChange} value={message} id="msg" name="msg" className="form-control" placeholder="Please describe your issue." required />
            </FormGroup>

            {/*<FormGroup key="remember">
              <input onChange={this.handleChange} type="checkbox" id="remember_me" name="remember_me" />
              <label htmlFor="remember_me">Remember me</label>

              <Link to="/_forgot" onClick={closeLogin} style={{ float: 'right' }}>Forgot password or username?</Link>
            </FormGroup>*/}
            {/*
              auth.getIn(['user', 'anon']) && auth.getIn(['user', 'num_collections']) > 0 &&
                <TempUsage
                  handleInput={this.handleChange}
                  moveTemp={moveTemp}
                  toColl={toColl} />
            */}
            <Button bsSize="lg" bsStyle="primary" type="submit" block>Submit</Button>
          </Form>
        </Row>
        {/*removing this breaks stuff, idk why*/
          anonCTA &&
            <div className="anon-cta">
              <h5>New to {product}? <Link to="/_register" onClick={closeLogin}>Sign up &raquo;</Link></h5>
              <h5>Or <Button onClick={closeLogin} className="button-link">continue as guest &raquo;</Button></h5>
              <span className="info">Guest sessions are limited to {guestSessionTimeout}.</span>
            </div>
        }
      </React.Fragment>
    );
  }
}

export default ContactForm;
