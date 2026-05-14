import { FileSpreadsheet } from 'lucide-react'
import { ROLES } from '../../constants/roles'

const UserFilters = ({
  isCoordinator,
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  semesterFilter,
  setSemesterFilter,
  semesterFilterOptions,
  visibleRoles,
  bulkSectionForm,
  setBulkSectionForm,
  departments,
  academicSemesterOptions,
  getSectionOptions,
  selectedStudentIds,
  bulkAssigningSection,
  handleBulkAssignStudentSection,
  openImportModal,
  exportingStudents,
  handleExportStudents,
  handleDownloadIdUpdateTemplate,
  openIdUpdateModal,
  showStudentTools = true
}) => (
  <div className="mb-6 space-y-4">
    {!isCoordinator && showStudentTools ? (
      <div className="rounded-2xl border border-dashed border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 shadow-sm dark:shadow-slate-900/50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-heading)]">Bulk student import</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Upload a CSV or XLSX file with `name`, `email`, `studentId`, `department`, `semester`, and `section`. `phone` and `address` are optional.</p>
          </div>
          <button
            type="button"
            onClick={openImportModal}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-surface-subtle)]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Upload roster</span>
          </button>
        </div>
      </div>
    ) : null}
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 shadow-sm dark:shadow-slate-900/50">
      <label htmlFor="users-search" className="mb-2 block text-sm font-medium text-[var(--color-page-text)]">Search users</label>
      <input
        id="users-search"
        type="text"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search by name, email, phone, roll number, or department"
        className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-3 text-sm text-[var(--color-page-text)] focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
    {(filterRole === '' || filterRole === ROLES.STUDENT) && (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 shadow-sm dark:shadow-slate-900/50">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="users-semester-filter" className="mb-2 block text-sm font-medium text-[var(--color-page-text)]">Filter students by semester</label>
            <select
              id="users-semester-filter"
              value={semesterFilter}
              onChange={(event) => {
                const nextValue = event.target.value
                setSemesterFilter(nextValue)
                if (nextValue && filterRole !== ROLES.STUDENT) {
                  setFilterRole(ROLES.STUDENT)
                }
              }}
              className="w-full rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-4 py-3 text-sm text-[var(--color-page-text)] focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {semesterFilterOptions.map((option) => (
                <option key={option.value || 'all-semesters'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          {showStudentTools ? (
            <>
              <button
                type="button"
                onClick={() => {
                  void handleExportStudents()
                }}
                disabled={exportingStudents}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{exportingStudents ? 'Exporting...' : 'Export Student List'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownloadIdUpdateTemplate()
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-surface-subtle)]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>ID Template</span>
              </button>
              <button
                type="button"
                onClick={openIdUpdateModal}
                className="ui-role-fill inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Upload ID Updates</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    )}
    <div className="flex flex-wrap gap-3">
      {visibleRoles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => {
            setFilterRole(role)
            if (role && role !== ROLES.STUDENT) {
              setSemesterFilter('')
            }
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${filterRole === role
              ? 'bg-primary text-white'
              : 'border border-[var(--color-card-border)] bg-[var(--color-card-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
            }`}
        >
          {role || 'All'}
        </button>
      ))}
    </div>
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 shadow-sm dark:shadow-slate-900/50">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-heading)]">Bulk Section Assignment</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Select students in the table and move them together to one section.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label htmlFor="bulk-section-department" className="ui-form-label">Department</label>
            <select
              id="bulk-section-department"
              value={bulkSectionForm.department}
              onChange={(event) => {
                const nextDepartment = event.target.value
                const nextSections = getSectionOptions(nextDepartment, bulkSectionForm.semester)
                setBulkSectionForm((current) => ({
                  ...current,
                  department: nextDepartment,
                  section: nextSections[0] || ''
                }))
              }}
              className="ui-form-input"
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-section-semester" className="ui-form-label">Semester</label>
            <select
              id="bulk-section-semester"
              value={bulkSectionForm.semester}
              onChange={(event) => {
                const nextSemester = event.target.value
                const nextSections = getSectionOptions(bulkSectionForm.department, nextSemester)
                setBulkSectionForm((current) => ({
                  ...current,
                  semester: nextSemester,
                  section: nextSections[0] || ''
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
            <label htmlFor="bulk-section-section" className="ui-form-label">Section</label>
            <select
              id="bulk-section-section"
              value={bulkSectionForm.section}
              onChange={(event) => setBulkSectionForm((current) => ({ ...current, section: event.target.value }))}
              className="ui-form-input"
              disabled={getSectionOptions(bulkSectionForm.department, bulkSectionForm.semester).length === 0}
            >
              {getSectionOptions(bulkSectionForm.department, bulkSectionForm.semester).length === 0 ? (
                <option value="">No configured sections</option>
              ) : (
                getSectionOptions(bulkSectionForm.department, bulkSectionForm.semester).map((sectionOption) => (
                  <option key={sectionOption} value={sectionOption}>
                    {sectionOption}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                void handleBulkAssignStudentSection()
              }}
              disabled={bulkAssigningSection || selectedStudentIds.length === 0}
              className="ui-role-fill w-full rounded-lg px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkAssigningSection ? 'Updating...' : `Move ${selectedStudentIds.length} Student${selectedStudentIds.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default UserFilters
