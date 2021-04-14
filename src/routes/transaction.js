const route = require('express').Router()
const trans = require('../controllers/transaction')

route.get('/get', trans.dashboard)
route.get('/activity', trans.getActivity)
route.post('/upload/:id/:time', trans.uploadDocument)
route.patch('/upload/edit/:id', trans.editUploadDocument)
route.patch('/approve/:id/:idAct', trans.approveDocument)
route.patch('/reject/:id/:idAct', trans.rejectDocument)
route.post('/send/:id', trans.sendMail)
route.get('/report', trans.reportDokumen)

module.exports = route
