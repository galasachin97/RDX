import "./radio.scss";

export const Radio = ({
  name,
  checked,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
  namee,
  disabled,
  value,
  id,
  style,
}) => {
  return (
    <div
      className={className ? "checkbox_ " + className : "checkbox_"}
      style={style}
    >
      <input
        type="checkbox"
        className="checkbox"
        id={id}
        checked={checked}
        defaultChecked={checked}
        onChange={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        name={namee}
        disabled={disabled}
        value={value}
      />
      <label className="label_" htmlFor={id}>
        {name}
      </label>
      {/* <label>
        <input
          type="checkbox"
          checked={checked}
          defaultChecked={checked}
          onChange={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          name={namee}
          disabled={disabled}
          value={value}
        />
        <span className="checkbox-material">
          <span className="check"></span>
        </span>
        {name}
      </label> */}
    </div>
  );
};
