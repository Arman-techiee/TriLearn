const FormInput = ({
  label,
  error,
  className = '',
  inputClassName = '',
  id,
  ...props
}) => {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label ? <label htmlFor={inputId} className="ui-form-label">{label}</label> : null}
      <input
        id={inputId}
        className={`ui-form-input ${error ? 'ui-form-input-error' : ''} ${inputClassName}`.trim()}
        {...props}
      />
      {error ? <p className="ui-form-helper-error">{error}</p> : null}
    </div>
  )
}

export default FormInput
