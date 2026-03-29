const data = {
  subjectId: "1b07e7b4-7e3f-4533-a88a-ec9646a7f3a5",
  instructorId: "676f41f3-9736-46f1-8dd1-7687e1e6610c",
  date: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 9 * 60 * 1000).toISOString()
}

console.log(JSON.stringify(data))