const User = require("../models/User");
const Bill = require("../models/Bill");
const Card = require("../models/Card");
// const Notification = require("../models/Notification");
// const formatDate = require("../models/methods/formatDate");
// const notificationsMethods = require("../models/methods/notificationsMethods");
const moment = require('moment')
const axios = require('axios').default
// const mongoose = require('mongoose')
let session;


exports.getAllbills = async (req, res, next) => {
  const fromDate = req.query.from;
  const toDate = req.query.to;
  let query = {}
  if (req.query) {
    if (req.query.no) {
      query = { serialNo: req.query.no }
    } else if (req.query.category) {
      query = { category: req.query.category }
    } else if (req.query.id) {
      query = { _id: req.query.id }
    } else if (req.query.status) {
      query = { 'status.paid': req.query.status }
    } else {
      query = { [req.query.type]: { $gte: fromDate, $lte: toDate } }
    }
    console.log(query);
  }
  try {
    const bills = await Bill.find(query)
    return res.status(200).json({ bills: bills, message: 'Bills Fetched', messageType: 'success' })
  } catch (error) { return res.status(500).json({ message: ' cannot fetched', messageType: 'danger' }) }
}
exports.createBill = async (req, res, next) => {
  const { date, billtype, category, duo, amount, notes, paid, approved, cardId } = req.body

  try {

    const newBill = new Bill({
      shipment: {

      },
      billtype: billtype,
      category: category,
      notes: notes,
      approved: approved,
      amount: amount,
      date: moment().format('YYYY-MM-DD'),
      release_date: moment(date).format('YYYY-MM-DD'),
      duo: moment(duo).format('YYYY-MM-DD'),
      status: {
        paid: paid || false,
        changedBy: null,
        note: ''
      },
      creator: {
        name: req.user.name,
        id: req.user._id
      },
      card: cardId
    })
    await newBill.save()

    // if (category === 'commission' || category === "custody") {
    //   const driver = await Driver.findById(itemId)
    //   driver[category].push({ amount: amount, date: moment().format('YYYY-MM-DD'), done: paid, bill: newBill._id })
    //   await driver.save()
    // }
    // if (category === 'fuels' || category === 'maintenance') {
    //   const vehicles = await Vehicle.findById(itemId)
    //   console.log(vehicles);
    //   vehicles[category].push({ amount: amount, date: moment().format('YYYY-MM-DD'), done: paid, bill: newBill._id })
    //   await vehicles.save()
    // }

    return res.status(200).json({ message: 'Bill Saved', messageType: 'success', bill: newBill })

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'cannot compelete the process, try to re-login', messageType: 'danger' })
  }
}
exports.assignExpenses = async (req, res, next) => {
  const expensesId = req.query.expensesId
  const employeeId = req.query.employeeId

  try {
    const employee = await Employee.findOne({ _id: employeeId })
    const expenses = await Expenses.findOne({ _id: expensesId })
    const assignedId = req.user._id
    const assignedName = req.user.name
    expenses.assignedTo = {
      id: employeeId,
      name: employee.name,
      department: employee.employeeState.department,
      position: employee.employeeState.position,
      assignedOn: formatDate.formatDate(new Date()),
      assignedBy: {
        id: assignedId,
        name: assignedName,
        position: req.user.role
      }
    }
    await expenses.save()

    //Send Notifications for employee
    const notification = notificationsMethods.create(req.company._id, req.user.name, expenses._id, `Mr. ${req.user.name} has assigned expenses to you <a href="/expenses">bill</a> `)

    const newNotify = new Notification(notification)
    await newNotify.save()
    employee.notifications.all.push(newNotify._id)
    employee.notifications.recent = (employee.notifications.recent + 1)
    await employee.save()
    return res.status(200).json({ message: 'Expenses Assigned', messageType: 'success' })

  } catch (error) {
    console.log(error);

    return res.status(500).json({ message: 'cannot compelete the process, try to re-login', messageType: 'danger' })
  }
}
exports.paidStatus = async (req, res, next) => {
  const id = req.params.id

  let session

  try {
    session = await mongoose.startSession()
    session.startTransaction();

    const bill = await Bill.findOne({ _id: id })
    bill.status.paid = true

    if (bill.category == 'commission' || bill.category === "custody") {
      const driver = await Driver.findById(bill.itemId)
      if (driver) {
        const idx = driver[bill.category].findIndex(i => i.bill.toString() === bill._id.toString())
        driver[bill.category][idx].done = true
        console.log(driver);
        await driver.save({ session })
      }
    }
    await bill.save({ session })

    await session.commitTransaction()
    session.endSession()
    return res.status(200).json({ message: `تم الدفع`, messageType: 'success' })
  } catch (error) {
    console.log(error);
    await session.abortTransaction()
    return res.status(500).json({ message: 'cannot compelete the process, try to re-login', messageType: 'danger' })
  }
}
exports.deleteBill = async (req, res, next) => {
  const id = req.params.id
  try {
    const expenses = await Bill.findOne({ _id: id })

    await expenses.remove()
    return res.status(200).json({ message: 'Bill Deleted', messageType: 'success' })
    //Send Notifications for employee
  } catch (error) {
    return res.status(500).json({ message: 'cannot compelete the process, try to re-login', messageType: 'danger' })
  }
}
exports.customTypes = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user._id })
    return res.status(200).json({ message: 'added', messageType: 'success', types: user.expensesTypes })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'error' })
  }
}
exports.createCustomType = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user._id })

    if (req.body.type == '') return res.status(404).json({ message: 'Add type name', messageType: 'info' })
    const exsistType = user.expensesTypes.filter(t => {
      return t === req.body.type
    })
    if (exsistType.length > 0) {
      return res.status(404).json({ message: 'Exist type with same name', messageType: 'warning' })
    }
    user.expensesTypes.push(req.body.type)
    await user.save()
    return res.status(200).json({ message: 'added', messageType: 'success', type: req.body.type })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'error' })
  }
}
exports.deleteCustomType = async (req, res, next) => {
  const type = req.body.type
  try {
    const company = await User.findOne({ _id: req.user._id })
    const oldtypes = company.expensesTypes.filter(t => t != type)
    company.expensesTypes = oldtypes
    await company.save()
    return res.status(200).json({ message: 'deleted', messageType: 'success', types: oldtypes })

  } catch (err) { return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'error' }) }
}