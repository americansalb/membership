const express = require('express');
const router = express.Router();
const { requireUser, requireAdmin } = require('../lib/middleware');

// Import subrouters
const contactsRouter = require('./crm/contacts');
const pipelinesRouter = require('./crm/pipelines');

// All CRM routes require authentication
router.use(requireUser);

// Mount subrouters
router.use('/contacts', contactsRouter);
router.use('/pipelines', pipelinesRouter);

module.exports = router;
