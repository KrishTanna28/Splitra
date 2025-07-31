const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createGroup,
  getUserGroups,
  addMember,
  removeMember,
  getGroupMembers,
  getGroupMemberCount
} = require('../controllers/groupController');

// All routes require auth
router.post('/create', auth, createGroup);  
router.get('/my-groups', auth, getUserGroups);
router.post('/:groupId/add-member', auth, addMember);
router.delete('/:groupId/remove-member', auth, removeMember);
router.get('/:groupId/members', auth, getGroupMembers);
router.get('/:groupId/member-count', auth, getGroupMemberCount);


module.exports = router;
