import React from "react";
import "./dropdown.scss";
import expand from "../../assets/images/expand.png";
import Scrollbars from "react-custom-scrollbars";
class Dropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      defaultSelectText: "",
      showOptionList: false,
    };
  }

  componentDidMount() {
    // Add Event Listner to handle the click that happens outside
    // the Custom Select Container
    document.addEventListener("mousedown", this.handleClickOutside);
    this.setState({
      defaultSelectText: this.props.defaultText || "Choose option",
      multiple: this.props.multiple || false,
    });
  }

  componentWillUnmount() {
    // Remove the event listner on component unmounting
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  // This method handles the click that happens outside the
  // select text and list area
  handleClickOutside = (e) => {
    if (this.props.activePriorityID) {
      if (this.props.activePriorityID !== e.target.id) {
        this.setState({
          showOptionList: false,
        });
      }
    } else {
      if (
        !e.target.classList.contains("custom-select-option") &&
        !e.target.classList.contains("selected-text") &&
        !e.target.classList.contains("select-options")
      ) {
        this.setState({
          showOptionList: false,
        });
      }
    }
  };

  // This method handles the display of option list
  handleListDisplay = () => {
    if (this.props.onFocus) {
      this.props.onFocus(this.props?.id);
    }
    this.setState((prevState) => {
      return {
        showOptionList: !prevState.showOptionList,
      };
    });
  };

  // This method handles the setting of name in select text area
  // and list display on selection
  handleOptionClick = (e) => {
    this.setState(
      {
        defaultSelectText: e.target.getAttribute("data-name"),
        showOptionList: false,
      },
      () => this.props.handleOption(this.state.defaultSelectText)
    );
  };

  handleOptionClick2 = (name, id) => {
    this.setState(
      {
        defaultSelectText: name,
        showOptionList: false,
      },
      () => this.props.handleOption(this.state.defaultSelectText, id)
    );
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.error !== this.props.error) {
      if (this.props.error && this.props.id) {
        var ele = document.querySelector("#" + this.props.id);
        ele.classList.add("error_shake");
        setTimeout(function () {
          ele.classList.remove("error_shake");
        }, 300);
      }
    }
    if (prevProps.defaultText !== this.props.defaultText) {
      this.setState({
        defaultSelectText: this.props.defaultText || "Choose option",
      });
    }
  }

  render() {
    const { optionsList, isLoading } = this.props;
    const { showOptionList, defaultSelectText } = this.state;
    return (
      <div
        className={
          this.props.className
            ? "custom-select-container " + this.props.className
            : "custom-select-container"
        }
        style={this.props.style}
        onMouseDown={this.props.onMouseDown}
      >
        <p className="dd-label">{this.props.label}</p>
        {optionsList.length === 0 ? (
          <div
            id={this.props.id}
            className={
              this.props.error ? "selected-text input__error" : "selected-text"
            }
            style={{ cursor: "default" }}
          >
            No {this.props.label} found
          </div>
        ) : (
          <button
            type="button"
            id={this.props.id}
            className={
              this.props.error ? "selected-text input__error" : "selected-text"
            }
            onClick={isLoading ? null : () => this.handleListDisplay()}
            title={defaultSelectText}
          >
            {defaultSelectText.replace(/_/g, " ")}
            <img
              src={expand}
              className={showOptionList ? "drop_icon list_open" : "drop_icon"}
              alt="expand"
            />
          </button>
        )}

        <div
          className={`select-options ${
            showOptionList ? "active__" : "inactive"
          }`}
        >
          <Scrollbars autoHeight autoHeightMax="14vh">
            {this.props.isObject
              ? optionsList.map((option, idx) => {
                  return (
                    <button
                      type="button"
                      className={
                        defaultSelectText === option.name
                          ? "custom-select-option active_option"
                          : "custom-select-option"
                      }
                      data-name={option.name}
                      key={option.id + "_" + idx}
                      onClick={() =>
                        this.handleOptionClick2(option.name, option.id)
                      }
                    >
                      {option.name}
                    </button>
                  );
                })
              : optionsList.map((option) => {
                  return (
                    <button
                      type="button"
                      className={
                        defaultSelectText === option
                          ? "custom-select-option active_option"
                          : "custom-select-option"
                      }
                      data-name={option}
                      key={option}
                      onClick={this.handleOptionClick}
                    >
                      {option.replace(/_/g, " ")}
                    </button>
                  );
                })}
          </Scrollbars>
        </div>
        {/* )} */}

        {/* ARRAY OF OBJECTS */}
        {/* {showOptionList && (
          <ul className="select-options">
            {optionsList.map((option) => {
              return (
                <li
                  className="custom-select-option"
                  data-name={option.name}
                  key={option.id}
                  onClick={this.handleOptionClick}
                >
                  {option.name}
                </li>
              );
            })}
          </ul>
        )} */}
      </div>
    );
  }
}

export default Dropdown;
