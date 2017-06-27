const mongoose = require('mongoose');
const mailer = require('../mailer');
const jwt = require('jsonwebtoken');

const users = {};
const User = mongoose.model('User');
const Team = mongoose.model('Team');

module.exports = users;

/**
 * Create User (Invite to Team)
 * Should only be done by team admin (users cannot invite themselves to team)
 * Admin must be logged in
 * 
 * Sends invitation email to user, with temporary password
 * 
 * params: { teamId }
 * body: {
 *   firstName, lastName, email  (no password)
 * }
 * response: {
 *   message,
 *   data: { userId }
 * }
 */
users.create = (request, response) => {
  const { firstName, lastName, email } = request.body;
  const { teamId } = request.params;
  Team.findById(teamId)
  .then(team => {
    if (!team) {
      return response.status(404).json({ message: 'Team Not Found.' });
    }
    if (!team.hasAdmin(request.session.users)) {
      return response.status(403).json({ message: 'Unauthorized To Invite User To Team' });
    }
    const tempPassword = User.generateRandomPassword();
    User.create({
      firstName, lastName, email, team, password: tempPassword
    })
    .then(user => {
      mailer.sendUserInvitation(user, team, tempPassword)
      .then(() => {
        response.json({
          message: 'Successfully Created User And Sent Invitation Email',
          data: { userId: user._id }
        });
      });
    });
  });
};

/**
 * Log User In to Specific Team
 * params: { teamId }
 * body: {
 *   email, password
 * }
 * response: {
 *   message,
 *   data: { userId }
 * }
 */
users.login = (request, response) => {
  const { teamId } = request.params;
  const { email, password } = request.body;
  User.authenticate({ teamId, email, password })
  .then(user => {
    if (!user) {
      return response.status(400).json({ message: 'Failed To Login User' });
    }
    request.session.users.push(user._id);
    response.json({
      message: 'Logged In User',
      data: { userId: user._id }
    });
  });
};

/**
 * User confirmation from link in email invitation
 * Logs in user for team
 * query: { token }
 * params: { userId }
 * redirects
 */
users.confirmation = (request, response) => {
  jwt.verify(request.query.token, process.env.JWT_SECRET, (err, decoded) => {      
    if (err || decoded.user !== request.params.userId) {
      return response.status(403).json({ message: 'Failed to authenticate token.' });    
    }
    User.findById(decoded.user)
    .then(user => {
      user.confirmed = true;
      request.session.users.push(user._id);
      console.log("USER CONFIRMED");
      user.save()
      .then(() => response.redirect('/'));
    });
  });
};

/**
 * Update User
 * Must be logged in
 * params: { teamId, userId }
 * response: {
 *   message,
 *   data: { user }
 * }
 */
users.update = (request, response) => {
  const { teamId, userId } = request.params;
  if (request.session.users.indexOf(userId) === -1) {
    return response.status(403).json({ message: 'Not Authorized To Update User' });
  }
  User.findById(userId)
  .then(user => {
    for (let key in request.body) {
      user[key] = request.body[key];
    }
    user.save()
    .then(() => {
      response.json({
        message: 'Updated User',
        data: { user }
      });
    });
  });

};
