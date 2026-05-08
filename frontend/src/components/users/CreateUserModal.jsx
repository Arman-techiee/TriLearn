import Alert from '../Alert'
import Modal from '../Modal'

const CreateUserModal = ({
  modalType,
  onClose,
  error,
  handleSubmit,
  handleCreateUser,
  values,
  errors,
  handleChange,
  departments,
  handleInstructorDepartmentToggle,
  academicSemesterOptions,
  getSectionOptions
}) => (
  <Modal
    title={`Add ${modalType === 'coordinator' ? 'Coordinator' : modalType === 'instructor' ? 'Instructor' : modalType === 'gatekeeper' ? 'Gate Account' : 'Student'}`}
    onClose={onClose}
  >
      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4">
        <div>
          <label htmlFor="create-user-name" className="ui-form-label">Full Name</label>
          <input
            id="create-user-name"
            name="name"
            type="text"
            required
            value={values.name}
            onChange={handleChange}
            className={`ui-form-input ${errors.name ? 'ui-form-input-error' : ''}`}
          />
          {errors.name && <p className="ui-form-helper-error" role="alert">{errors.name}</p>}
        </div>
        {modalType === 'student' ? (
          <>
            <div>
              <label htmlFor="create-user-student-email" className="ui-form-label">Student Personal Email</label>
              <input
                id="create-user-student-email"
                name="email"
                type="email"
                required
                value={values.email}
                onChange={handleChange}
                className={`ui-form-input ${errors.email ? 'ui-form-input-error' : ''}`}
              />
              {errors.email && <p className="ui-form-helper-error" role="alert">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="create-user-student-id" className="ui-form-label">Student ID / Roll Number</label>
              <input
                id="create-user-student-id"
                name="studentId"
                type="text"
                required
                value={values.studentId}
                onChange={handleChange}
                className={`ui-form-input ${errors.studentId ? 'ui-form-input-error' : ''}`}
              />
              {errors.studentId && <p className="ui-form-helper-error" role="alert">{errors.studentId}</p>}
            </div>
            <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary dark:bg-primary-950/30 dark:text-primary-300">
              The student will sign in using their personal email address and will be forced to change the default password on first login.
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="create-user-email" className="ui-form-label">Email</label>
              <input
                id="create-user-email"
                name="email"
                type="email"
                required
                value={values.email}
                onChange={handleChange}
                className={`ui-form-input ${errors.email ? 'ui-form-input-error' : ''}`}
              />
              {errors.email && <p className="ui-form-helper-error" role="alert">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="create-user-password" className="ui-form-label">Password</label>
              <input
                id="create-user-password"
                name="password"
                type="password"
                required
                value={values.password}
                onChange={handleChange}
                className={`ui-form-input ${errors.password ? 'ui-form-input-error' : ''}`}
              />
              {errors.password && <p className="ui-form-helper-error" role="alert">{errors.password}</p>}
            </div>
            <p className="text-xs text-[--color-text-muted] dark:text-slate-300">
              Use at least 8 characters with uppercase, lowercase, and a number.
            </p>
          </>
        )}
        <div>
          <label htmlFor="create-user-phone" className="ui-form-label">Phone</label>
          <input
            id="create-user-phone"
            name="phone"
            type="text"
            placeholder="Optional"
            value={values.phone}
            onChange={handleChange}
            className="ui-form-input"
          />
        </div>
        {modalType === 'instructor' ? (
          <div>
            <label className="ui-form-label">Departments</label>
            <div className="grid gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3 sm:grid-cols-2">
              {departments.map((department) => {
                const checked = values.departments.includes(department.name)

                return (
                  <label key={department.id} className="flex items-center gap-3 rounded-lg bg-[var(--color-card-surface)] px-3 py-2 text-sm text-[var(--color-heading)]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleInstructorDepartmentToggle(department.name)}
                      className="h-4 w-4 accent-[var(--color-role-accent)]"
                    />
                    <span>{department.name} ({department.code})</span>
                  </label>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-soft)]">Select every department this instructor teaches, such as `BIT` and `BCS`.</p>
            {errors.department && <p className="ui-form-helper-error" role="alert">{errors.department}</p>}
          </div>
        ) : modalType !== 'gatekeeper' && (
          <div>
            <label htmlFor="create-user-department" className="ui-form-label">Department</label>
            <select
              id="create-user-department"
              name="department"
              value={values.department}
              onChange={handleChange}
              className={`ui-form-input ${errors.department ? 'ui-form-input-error' : ''}`}
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
            {errors.department && <p className="ui-form-helper-error" role="alert">{errors.department}</p>}
          </div>
        )}

        {modalType === 'student' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="create-user-semester" className="ui-form-label">Semester</label>
              <select
                id="create-user-semester"
                name="semester"
                value={values.semester}
                onChange={handleChange}
                className={`ui-form-input ${errors.semester ? 'ui-form-input-error' : ''}`}
              >
                {academicSemesterOptions.map((semesterOption) => (
                  <option key={semesterOption} value={semesterOption}>
                    Semester {semesterOption}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="create-user-section" className="ui-form-label">Section</label>
              <select
                id="create-user-section"
                name="section"
                value={values.section}
                onChange={handleChange}
                className={`ui-form-input ${errors.section ? 'ui-form-input-error' : ''}`}
                disabled={getSectionOptions(values.department, values.semester).length === 0}
              >
                {getSectionOptions(values.department, values.semester).length === 0 ? (
                  <option value="">No sections configured</option>
                ) : (
                  getSectionOptions(values.department, values.semester).map((sectionOption) => (
                    <option key={sectionOption} value={sectionOption}>
                      {sectionOption}
                    </option>
                  ))
                )}
              </select>
              {getSectionOptions(values.department, values.semester).length === 0 ? (
                <p className="mt-2 text-xs text-[var(--color-text-soft)]">
                  Create sections from Departments first for this semester.
                </p>
              ) : null}
            </div>
          </div>
        )}
        {modalType === 'student' && errors.semester && <p className="ui-form-helper-error" role="alert">{errors.semester}</p>}
        {modalType === 'student' && errors.section && <p className="ui-form-helper-error" role="alert">{errors.section}</p>}

        <div className="ui-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[--color-border] dark:border-slate-700 text-[--color-text-muted] dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-[--color-bg] dark:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary font-medium"
          >
            Create {modalType === 'coordinator' ? 'Coordinator' : modalType === 'instructor' ? 'Instructor' : modalType === 'gatekeeper' ? 'Gate Account' : 'Student'}
          </button>
        </div>
      </form>
  </Modal>
)

export default CreateUserModal
