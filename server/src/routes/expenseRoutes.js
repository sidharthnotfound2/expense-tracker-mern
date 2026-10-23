const express = require('express');
const requireAuth = require('../middleware/auth');
const {
  createExpense,
  listExpenses,
  summary,
  getExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

// every expense route needs a logged-in user
router.use(requireAuth);

router.post('/', createExpense);
router.get('/', listExpenses);
router.get('/summary', summary); // must be before '/:id'
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
