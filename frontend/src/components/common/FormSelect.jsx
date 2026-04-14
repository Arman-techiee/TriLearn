const FormSelect = ({
  label,
  error,
  className = '',
  selectClassName = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || props.name

  return (
    <div className={className}>
      {label ? <label htmlFor={selectId} className="ui-form-label">{label}</label> : null}
      <select
        id={selectId}
        className={`ui-form-input ${error ? 'ui-form-input-error' : ''} ${selectClassName}`.trim()}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="ui-form-helper-error">{error}</p> : null}
    </div>
  )
}

export default FormSelect
