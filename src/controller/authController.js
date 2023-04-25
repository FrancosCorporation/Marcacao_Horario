const express= require('express')
const User = require('../models/User')
const router = express.Router()
router.get('/post', async (req, res) => {
    return res.status(200).send({"Ok": "Registration failed"})
})
router.post('/register', async (req, res) => {
    try {
        const user = await User.create(req.body)
        return res.send({user:"Usuario Registrado"})
    } catch (error) {
        return res.status(400).send({error: "Registration failed"})
    }
})
module.exports = app => app.use('/auth', router)