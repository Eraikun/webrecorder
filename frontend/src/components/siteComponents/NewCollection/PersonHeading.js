import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormGroup } from "react-bootstrap";
class PersonHeading extends Component {
  static propTypes = {
    id: PropTypes.string,
    htmlText: PropTypes.string,
    item: PropTypes.object,
    onRemovePerson: PropTypes.func,
  };
  constructor(props) {
    super(props);
  }
  onRemovePerson = () => {
    const { onRemovePerson, item } = this.props;
    onRemovePerson(item);
  };
  render() {
    const { id, htmlText, item } = this.props;

    return (
      <React.Fragment>
        <li key={id}>
          <FormGroup id="fieldset">
            <div>{htmlText}</div>
            <button
              type="button"
              class="btn btn-success"
              style={{ float: "right", backgroundColor: "#E9573F" }}
              onClick={this.onRemovePerson}
            >
              Remove header
            </button>
          </FormGroup>
        </li>
      </React.Fragment>
    );
  }
}

export default PersonHeading;
