import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormGroup } from "react-bootstrap";
class AuthorshipItem extends Component {
  static propTypes = {
    id: PropTypes.string,
    htmlText: PropTypes.string,
    item: PropTypes.object,
    onRemoveItem: PropTypes.func,
  };
  constructor(props) {
    super(props);
  }
  onRemoveItem = () => {
    const { onRemoveItem, item } = this.props;
    onRemoveItem(item);
  };
  render() {
    const { id, htmlText, item } = this.props;

    return (
      <React.Fragment>
        <li key={id}>
          <FormGroup id="fieldset">
            <h5
              style={{
                display: "flex",
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                lineHeight: "40px",
              }}
            >
              Authorhip information:
            </h5>
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

export default AuthorshipItem;
