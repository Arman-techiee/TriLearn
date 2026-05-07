const { createController } = require('../utils/controllerAdapter')
const {
  getAllUsers: getAllUsersService,
  getUserById: getUserByIdService
} = require('../services/users.service')

const getAllUsers = createController(getAllUsersService)
const getUserById = createController(getUserByIdService)

module.exports = {
  getAllUsers: getAllUsers,
  getUsers: getAllUsers,
  getUserById: getUserById
}
