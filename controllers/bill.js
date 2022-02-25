const User = require("../models/User");
const Bill = require("../models/Bill");
const Card = require("../models/Card");
const moment = require('moment')
const axios = require('axios').default
let session;


exports.getBills = async (req, res, next) => {
  const fromDate = req.query.from;
  const toDate = req.query.to;
  let query = {}
  if (req.query) {
    if (req.query.no) {
      query = { shipmentNo: req.query.no, 'creator.id': req.user._id }
    } else if (req.query.status) {
      query = { 'status.no': req.query.status, 'creator.id': req.user._id }
    } else if (req.query.id) {
      query = { _id: req.query.id, 'creator.id': req.user._id }
    } else if (req.query.category) {
      query = { category: req.query.category, 'creator.id': req.user._id }
    } else {
      query = { [req.query.type]: { $gte: fromDate, $lte: toDate }, 'creator.id': req.user._id }
    }
  }
  try {
    const bills = await Bill.find(query)
    return res.status(200).json({ bills: bills, message: 'Bills Fetched', messageType: 'success' })
  } catch (error) { return res.status(500).json({ message: ' cannot fetched', messageType: 'danger' }) }
}

exports.createBill = async (req, res, next) => {
  const { date, category, duo, amount, notes, paid, approved, cardId } = req.body

  try {

    const newBill = new Bill({
      category: category,
      notes: notes,
      approved: approved || true,
      amount: amount,
      date: moment().format('YYYY-MM-DD'),
      release_date: moment(date).format('YYYY-MM-DD'),
      duo: moment(duo).format('YYYY-MM-DD'),
      status: {
        paid: paid || true,
        changedBy: null,
        note: ''
      },
      creator: {
        name: req.user.name,
        id: req.user._id
      },
      card: cardId
    })

    const jwt = req.get('Authorization').split(' ')[1]
    const response = await axios.put(`http://localhost:3000/cards/withdraw/${cardId}`, {
      amount: amount,
    }, {
        headers: {
          Authorization: "Bearer " + jwt,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    await newBill.save()
    return res.status(200).json({ message: 'Bill Saved', messageType: 'success', bill: newBill, card: response.data.card })

  } catch (error) {
    console.log(error)
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


exports.getBill = async (req, res, next) => {
  const id = req.params.id
  try {
    const bill = await Bill.findOne({ _id: id })
    if (!bill) return res.status(404).json({ message: 'Bill not exist', messageType: 'info' })
    return res.status(200).json({ message: 'Bill Deleted', messageType: 'success', bill: bill })
  } catch (error) {
    return res.status(500).json({ message: 'cannot compelete the process, try to re-login', messageType: 'danger' })
  }
}


exports.deleteBill = async (req, res, next) => {
  const id = req.params.id
  try {
    const bill = await Bill.findOne({ _id: id })
    if (!bill) return res.status(404).json({ message: 'Bill not exist', messageType: 'info' })

    await bill.remove()
    return res.status(200).json({ message: 'Bill Deleted', messageType: 'success' })
  } catch (error) {
    return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'danger' })

  }
}


exports.categories = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user._id })
    return res.status(200).json({ message: 'added', messageType: 'success', types: user.categories })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'error' })
  }
}


exports.createCategory = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user._id })

    if (req.body.type == '') return res.status(404).json({ message: 'Add type name', messageType: 'info' })
    const exist = user.categories.filter(t => {
      return t === req.body.type
    })
    if (exist.length > 0) {
      return res.status(404).json({ message: 'Exist type with same name', messageType: 'warning' })
    }
    user.categories.push(req.body.type)
    await user.save()
    return res.status(200).json({ message: 'added', messageType: 'success', category: req.body.type })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'error' })
  }
}


exports.deleteCategory = async (req, res, next) => {
  const type = req.body.type
  try {
    const user = await User.findOne({ _id: req.user._id })
    const categories = user.categories.filter(t => t != type)
    user.categories = categories
    await user.save()
    return res.status(200).json({ message: 'deleted', messageType: 'success', categories: categories })

  } catch (err) {
    return res.status(500).json({ error: err, message: 'Something went wrong, Please try again later', messageType: 'error' })
  }
}