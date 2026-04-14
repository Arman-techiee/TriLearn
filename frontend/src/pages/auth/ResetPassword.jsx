import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../../components/Alert'
import FormInput from '../../components/common/FormInput'
import useForm from '../../hooks/useForm'
import api from '../../utils/api'
import { getFriendlyErrorMessage } from '../../utils/errors'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const { values, errors, handleChange, handleSubmit } = useForm({
    password: '',
    confirmPassword: ''
  }, (formValues) => {
    const validationErrors = {}
    if (!formValues.password) validationErrors.password = 'New password is required'
    if (formValues.password !== formValues.confirmPassword) validationErrors.confirmPassword = 'Passwords do not match'
    return validationErrors
  })

  const onSubmit = async () => {
    if (!token) {
      setError('Password reset link is invalid.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await api.post('/auth/reset-password', {
        token,
        password: values.password
      })
      setSuccess(res.data.message)
      setTimeout(() => navigate('/login'), 1500)
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to reset your password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[--color-bg] dark:bg-slate-800 flex items-center justify-center p-4">
      <div className="bg-[--color-bg-card] dark:bg-slate-800 p-8 rounded-2xl shadow-md dark:shadow-slate-900/50 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[--color-text] dark:text-slate-100 mb-2">Reset Password</h1>
        <p className="text-sm text-[--color-text-muted] dark:text-slate-400 mb-6">Choose a new password for your account.</p>
        <Alert type="success" message={success} />
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="New Password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            placeholder="Create a new password"
            error={errors.password}
          />
          <FormInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            error={errors.confirmPassword}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2 font-medium text-white hover:bg-primary disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
