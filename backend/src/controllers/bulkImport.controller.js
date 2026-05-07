const { createController } = require('../utils/controllerAdapter')
const {
  importStudents: importStudentsService,
  getStudentImportJob: getStudentImportJobService
} = require('../services/bulkImport.service')

const importStudents = createController(importStudentsService)
const getStudentImportJob = createController(getStudentImportJobService)

module.exports = {
  importStudents: importStudents,
  getStudentImportJob
}
