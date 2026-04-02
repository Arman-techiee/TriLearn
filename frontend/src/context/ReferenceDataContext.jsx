import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import api from '../utils/api'

const ReferenceDataContext = createContext(null)

export const ReferenceDataProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([])
  const [departments, setDepartments] = useState([])
  const subjectsRef = useRef([])
  const departmentsRef = useRef([])
  const subjectRequestRef = useRef(null)
  const departmentRequestRef = useRef(null)

  const loadSubjects = useCallback(async ({ force = false } = {}) => {
    if (!force && subjectsRef.current.length > 0) {
      return subjectsRef.current
    }

    if (!force && subjectRequestRef.current) {
      return subjectRequestRef.current
    }

    subjectRequestRef.current = api.get('/subjects')
      .then((response) => {
        const nextSubjects = response.data.subjects || []
        subjectsRef.current = nextSubjects
        setSubjects(nextSubjects)
        return nextSubjects
      })
      .finally(() => {
        subjectRequestRef.current = null
      })

    return subjectRequestRef.current
  }, [])

  const loadDepartments = useCallback(async ({ force = false } = {}) => {
    if (!force && departmentsRef.current.length > 0) {
      return departmentsRef.current
    }

    if (!force && departmentRequestRef.current) {
      return departmentRequestRef.current
    }

    departmentRequestRef.current = api.get('/departments')
      .then((response) => {
        const nextDepartments = response.data.departments || []
        departmentsRef.current = nextDepartments
        setDepartments(nextDepartments)
        return nextDepartments
      })
      .finally(() => {
        departmentRequestRef.current = null
      })

    return departmentRequestRef.current
  }, [])

  const value = useMemo(() => ({
    subjects,
    departments,
    loadSubjects,
    loadDepartments
  }), [departments, loadDepartments, loadSubjects, subjects])

  return (
    <ReferenceDataContext.Provider value={value}>
      {children}
    </ReferenceDataContext.Provider>
  )
}

export const useReferenceData = () => {
  const context = useContext(ReferenceDataContext)

  if (!context) {
    throw new Error('useReferenceData must be used within a ReferenceDataProvider')
  }

  return context
}
