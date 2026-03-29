const prisma = require('../utils/prisma')
const bcrypt = require('bcryptjs')

// ================================
// GET ALL USERS
// ================================
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query

    const filters = {}
    if (role) filters.role = role
    if (isActive !== undefined) filters.isActive = isActive === 'true'

    const users = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        student: true,
        instructor: true,
        admin: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ total: users.length, users })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// GET USER BY ID
// ================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        student: true,
        instructor: true,
        admin: true,
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// CREATE INSTRUCTOR
// ================================
const createInstructor = async (req, res) => {
  try {
    const { name, email, password, phone, address, department } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'INSTRUCTOR',
        phone,
        address,
        instructor: {
          create: { department }
        }
      },
      include: { instructor: true }
    })

    res.status(201).json({
      message: 'Instructor created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.instructor.department
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// CREATE STUDENT
// ================================
const createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, address, semester, section, department } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const rollNumber = `STU${Date.now()}`

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        phone,
        address,
        student: {
          create: {
            rollNumber,
            semester: semester || 1,
            section,
            department
          }
        }
      },
      include: { student: true }
    })

    res.status(201).json({
      message: 'Student created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.student.rollNumber,
        semester: user.student.semester
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// UPDATE USER
// ================================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, address, department, semester, section } = req.body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, phone, address }
    })

    if (user.role === 'INSTRUCTOR' && department) {
      await prisma.instructor.update({
        where: { userId: id },
        data: { department }
      })
    }

    if (user.role === 'STUDENT') {
      await prisma.student.update({
        where: { userId: id },
        data: { semester, section, department }
      })
    }

    res.json({ message: 'User updated successfully!', user: updatedUser })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// TOGGLE USER STATUS (enable/disable)
// ================================
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot disable yourself' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    })

    res.json({
      message: `User ${updatedUser.isActive ? 'enabled' : 'disabled'} successfully!`,
      isActive: updatedUser.isActive
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// DELETE USER
// ================================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself' })
    }

    // Delete role profile first then user
    if (user.role === 'STUDENT') {
      await prisma.student.delete({ where: { userId: id } })
    } else if (user.role === 'INSTRUCTOR') {
      await prisma.instructor.delete({ where: { userId: id } })
    } else if (user.role === 'ADMIN') {
      await prisma.admin.delete({ where: { userId: id } })
    }

    await prisma.user.delete({ where: { id } })

    res.json({ message: 'User deleted successfully!' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createInstructor,
  createStudent,
  updateUser,
  toggleUserStatus,
  deleteUser
}