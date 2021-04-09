const route = require('express').Router()
const trans = require('../controllers/transaction')

route.get('/get', trans.dashboard)
route.get('/activity', trans.getActivity)
route.post('/upload/:id', trans.uploadDocument)
route.patch('/upload/edit/:id', trans.editUploadDocument)
route.patch('/approve/:id', trans.approveDocument)
route.patch('/reject/:id', trans.rejectDocument)

module.exports = route
