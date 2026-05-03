const app = require('./app')
const { connectDb } = require('./db')
const { port } = require('./config')

const start = async () => {
  try {
    await connectDb()
    app.listen(port, () => {
      console.log(`Sama backend listening on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start backend:', error)
    process.exit(1)
  }
}

start()
