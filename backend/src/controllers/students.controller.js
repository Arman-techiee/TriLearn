const { createController } = require('../utils/controllerAdapter')
const {
  createStudent: createStudentService,
  updateUser: updateUserService,
  toggleUserStatus: toggleUserStatusService,
  deleteUser: deleteUserService,
  bulkAssignStudentSection: bulkAssignStudentSectionService,
  promoteStudentSemester: promoteStudentSemesterService
} = require('../services/users.service')

const createStudent = createController(createStudentService)
const updateStudent = createController(updateUserService)
const toggleStudentStatus = createController(toggleUserStatusService)
const deleteStudent = createController(deleteUserService)
const bulkAssignStudentSection = createController(bulkAssignStudentSectionService)
const promoteStudentSemester = createController(promoteStudentSemesterService)

module.exports = {
  createStudent,
  createUser: createStudent,
  updateStudent,
  updateUser: updateStudent,
  toggleStudentStatus,
  toggleUserStatus: toggleStudentStatus,
  suspendUser: toggleStudentStatus,
  unsuspendUser: toggleStudentStatus,
  deleteStudent,
  deleteUser: deleteStudent,
  bulkAssignStudentSection,
  promoteStudentSemester
}
