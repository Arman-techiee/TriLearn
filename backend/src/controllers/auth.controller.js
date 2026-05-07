const { createController } = require('../utils/controllerAdapter')
const {
  register: registerService,
  submitStudentIntake: submitStudentIntakeService,
  changePassword: changePasswordService,
  getActivity: getActivityService
} = require('../services/auth.account.service')
const {
  login: loginService,
  refresh: refreshService,
  refreshMobile: refreshMobileService,
  logout: logoutService,
  logoutAll: logoutAllService
} = require('../services/auth.session.service')
const {
  getStudentIdQr: getStudentIdQrService,
  getMe: getMeService,
  updateProfile: updateProfileService,
  uploadAvatar: uploadAvatarService,
  completeProfile: completeProfileService
} = require('../services/auth.profile.service')
const {
  forgotPassword: forgotPasswordService,
  verifyEmail: verifyEmailService,
  resendVerification: resendVerificationService,
  resetPassword: resetPasswordService
} = require('../services/auth.email.service')

const register = createController(registerService)
const submitStudentIntake = createController(submitStudentIntakeService)
const login = createController(loginService)
const getStudentIdQr = createController(getStudentIdQrService)
const getMe = createController(getMeService)
const updateProfile = createController(updateProfileService)
const uploadAvatar = createController(uploadAvatarService)
const changePassword = createController(changePasswordService)
const completeProfile = createController(completeProfileService)
const forgotPassword = createController(forgotPasswordService)
const verifyEmail = createController(verifyEmailService)
const resendVerification = createController(resendVerificationService)
const resetPassword = createController(resetPasswordService)
const refresh = createController(refreshService)
const refreshMobile = createController(refreshMobileService)
const logout = createController(logoutService)
const getActivity = createController(getActivityService)
const logoutAll = createController(logoutAllService)

module.exports = {
  register: register,
  submitStudentIntake: submitStudentIntake,
  login: login,
  getStudentIdQr: getStudentIdQr,
  getMe: getMe,
  updateProfile: updateProfile,
  uploadAvatar: uploadAvatar,
  changePassword: changePassword,
  completeProfile: completeProfile,
  forgotPassword: forgotPassword,
  verifyEmail: verifyEmail,
  resendVerification: resendVerification,
  resetPassword: resetPassword,
  refresh: refresh,
  refreshMobile: refreshMobile,
  logout: logout,
  getActivity: getActivity,
  logoutAll: logoutAll
}
