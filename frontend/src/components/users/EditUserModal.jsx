import Alert from '../Alert'
import Modal from '../Modal'

const EditUserModal = ({
  studentToManageSection,
  updatingStudentSection,
  setStudentToManageSection,
  setStudentSectionError,
  studentSectionError,
  handleUpdateStudentSection,
  studentSectionForm,
  setStudentSectionForm,
  departments,
  academicSemesterOptions,
  getSectionOptions
}) => (
  <Modal
    title={`Update Section · ${studentToManageSection.name}`}
    onClose={() => {
      if (!updatingStudentSection) {
        setStudentToManageSection(null)
        setStudentSectionError('')
      }
    }}
  >
    <Alert type="error" message={studentSectionError} />

    <form onSubmit={handleUpdateStudentSection} className="space-y-4">
      <div>
        <label htmlFor="edit-student-section-department" className="ui-form-label">Department</label>
        <select
          id="edit-student-section-department"
          value={studentSectionForm.department}
          onChange={(event) => {
            const nextDepartment = event.target.value
            const nextSectionOptions = getSectionOptions(nextDepartment, studentSectionForm.semester)
            setStudentSectionForm((current) => ({
              ...current,
              department: nextDepartment,
              section: nextSectionOptions[0] || ''
            }))
          }}
          className="ui-form-input"
          required
        >
          <option value="">Select Department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.name}>
              {department.name} ({department.code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-student-section-semester" className="ui-form-label">Semester</label>
          <select
            id="edit-student-section-semester"
            value={studentSectionForm.semester}
            onChange={(event) => {
              const nextSemester = event.target.value
              const nextSectionOptions = getSectionOptions(studentSectionForm.department, nextSemester)
              setStudentSectionForm((current) => ({
                ...current,
                semester: nextSemester,
                section: nextSectionOptions[0] || ''
              }))
            }}
            className="ui-form-input"
          >
            {academicSemesterOptions.map((semesterOption) => (
              <option key={semesterOption} value={semesterOption}>
                Semester {semesterOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-student-section-section" className="ui-form-label">Section</label>
          <select
            id="edit-student-section-section"
            value={studentSectionForm.section}
            onChange={(event) => setStudentSectionForm((current) => ({ ...current, section: event.target.value }))}
            className="ui-form-input"
            disabled={getSectionOptions(studentSectionForm.department, studentSectionForm.semester).length === 0}
          >
            {getSectionOptions(studentSectionForm.department, studentSectionForm.semester).length === 0 ? (
              <option value="">No configured sections</option>
            ) : (
              getSectionOptions(studentSectionForm.department, studentSectionForm.semester).map((sectionOption) => (
                <option key={sectionOption} value={sectionOption}>
                  {sectionOption}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {getSectionOptions(studentSectionForm.department, studentSectionForm.semester).length === 0 ? (
        <p className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
          No sections exist for this department and semester. Create one from Departments first.
        </p>
      ) : null}

      <div className="ui-modal-footer">
        <button
          type="button"
          onClick={() => setStudentToManageSection(null)}
          className="flex-1 rounded-lg border border-[var(--color-card-border)] py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          disabled={updatingStudentSection}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="ui-role-fill flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          disabled={updatingStudentSection || getSectionOptions(studentSectionForm.department, studentSectionForm.semester).length === 0}
        >
          {updatingStudentSection ? 'Updating...' : 'Save Section'}
        </button>
      </div>
    </form>
  </Modal>
)

export default EditUserModal
