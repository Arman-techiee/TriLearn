const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getGradeSnapshot,
  getPercentage,
  buildStudentResultSheet
} = require('../src/utils/marksGrading')

test('grade snapshots use inclusive lower boundaries', () => {
  const cases = [
    { percentage: 90, grade: 'A+', gradePoint: 4.0 },
    { percentage: 80, grade: 'A', gradePoint: 3.6 },
    { percentage: 70, grade: 'B+', gradePoint: 3.2 },
    { percentage: 60, grade: 'B', gradePoint: 2.8 },
    { percentage: 50, grade: 'C+', gradePoint: 2.4 },
    { percentage: 40, grade: 'C', gradePoint: 2.0 },
    { percentage: 39.99, grade: 'F', gradePoint: 0.0 }
  ]

  cases.forEach(({ percentage, grade, gradePoint }) => {
    assert.deepEqual(getGradeSnapshot(percentage, 100), { grade, gradePoint })
  })
})

test('percentage calculation rounds to two decimals and handles zero totals', () => {
  assert.equal(getPercentage(2, 3), 66.67)
  assert.equal(getPercentage(10, 0), 0)
})

test('student result sheet preserves stored subject grades while deriving overall grade', () => {
  const resultSheet = buildStudentResultSheet([
    {
      id: 'mark-2',
      subjectId: 'subject-2',
      subject: { name: 'Algorithms', code: 'CSC202' },
      obtainedMarks: 39.99,
      totalMarks: 100,
      grade: null,
      gradePoint: null,
      remarks: null
    },
    {
      id: 'mark-1',
      subjectId: 'subject-1',
      subject: { name: 'Data Structures', code: 'CSC201' },
      obtainedMarks: 90,
      totalMarks: 100,
      grade: 'A+',
      gradePoint: 4,
      remarks: 'Excellent'
    }
  ])

  assert.deepEqual(
    resultSheet.subjects.map((subject) => ({
      code: subject.subjectCode,
      grade: subject.grade,
      gradePoint: subject.gradePoint
    })),
    [
      { code: 'CSC201', grade: 'A+', gradePoint: 4 },
      { code: 'CSC202', grade: 'F', gradePoint: 0 }
    ]
  )
  assert.equal(resultSheet.overallPercentage, 65)
  assert.equal(resultSheet.overallGrade, 'B')
  assert.equal(resultSheet.overallGpa, 2)
})
