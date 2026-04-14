const FormTextarea = ({
  label,
  error,
  className = '',
  textareaClassName = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || props.name

  return (
    <div className={className}>
      {label ? <label htmlFor={textareaId} className="ui-form-label">{label}</label> : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={`ui-form-input ${error ? 'ui-form-input-error' : ''} ${textareaClassName}`.trim()}
        {...props}
      />
      {error ? <p className="ui-form-helper-error">{error}</p> : null}
    </div>
  )
}

export default FormTextarea
