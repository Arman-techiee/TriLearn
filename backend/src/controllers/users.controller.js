const { createController } = require('../utils/controllerAdapter')
const {
  getAllUsers: getAllUsersService,
  exportStudents: exportStudentsService,
  exportStudentIdUpdateTemplate: exportStudentIdUpdateTemplateService,
  bulkUpdateStudentIds: bulkUpdateStudentIdsService,
  getUserById: getUserByIdService
} = require('../services/users.service')

const getAllUsers = createController(getAllUsersService)
const exportStudents = createController(exportStudentsService)
const exportStudentIdUpdateTemplate = createController(exportStudentIdUpdateTemplateService)
const bulkUpdateStudentIds = createController(bulkUpdateStudentIdsService)
const getUserById = createController(getUserByIdService)

module.exports = {
  getAllUsers: getAllUsers,
  getUsers: getAllUsers,
  exportStudents,
  exportStudentIdUpdateTemplate,
  bulkUpdateStudentIds,
  getUserById: getUserById
}
