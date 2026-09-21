const mongoose = require('mongoose')

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/marcacao'
mongoose.connect(uri)
mongoose.Promise=global.Promise
module.exports= mongoose;
mongoose.connection.on('error', (err) => {
  console.error('MongoDB indisponivel:', err.message, '- defina MONGO_URI e suba o MongoDB.')
})
