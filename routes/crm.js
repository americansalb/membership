const express = require('express');
const router = express.Router();
const { requireUser, requireAdmin } = require('../lib/middleware');

// Import subrouters
const contactsRouter = require('./crm/contacts');
const pipelinesRouter = require('./crm/pipelines');
const automationsRouter = require('./crm/automations');

// All CRM routes require authentication
router.use(requireUser);

// Mount subrouters
router.use('/contacts', contactsRouter);
router.use('/pipelines', pipelinesRouter);
router.use('/activities', require('./crm/activities'));

// Automations require admin access
router.use('/automations', requireAdmin, automationsRouter);

module.exports = router;
