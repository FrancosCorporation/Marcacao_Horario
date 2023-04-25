const mongoose = require('mongoose')

mongoose.connect('mongodb://admin:pass@mongo:27017/', {useMongoClient: true})
mongoose.Promise=global.Promise
module.exports= mongoose;