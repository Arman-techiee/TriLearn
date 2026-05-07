const { createController } = require('../utils/controllerAdapter')
const {
  createCoordinator: createCoordinatorService,
  createGatekeeper: createGatekeeperService,
  createInstructor: createInstructorService,
  updateUser: updateUserService,
  toggleUserStatus: toggleUserStatusService,
  deleteUser: deleteUserService
} = require('../services/users.service')

const createCoordinator = createController(createCoordinatorService)
const createGatekeeper = createController(createGatekeeperService)
const createInstructor = createController(createInstructorService)
const updateStaff = createController(updateUserService)
const toggleStaffStatus = createController(toggleUserStatusService)
const deleteStaff = createController(deleteUserService)

module.exports = {
  createCoordinator,
  createGatekeeper,
  createInstructor,
  updateStaff,
  updateUser: updateStaff,
  toggleStaffStatus,
  toggleUserStatus: toggleStaffStatus,
  suspendUser: toggleStaffStatus,
  unsuspendUser: toggleStaffStatus,
  deleteStaff,
  deleteUser: deleteStaff
}
