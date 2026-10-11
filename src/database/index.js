const mongoose = require('mongoose')

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/marcacao'

mongoose.connection.on('error', () => {
  console.error('MongoDB indisponível. Confira MONGO_URI e a disponibilidade do servidor.')
})

mongoose.connect(uri).catch(() => {})

module.exports = mongoose
