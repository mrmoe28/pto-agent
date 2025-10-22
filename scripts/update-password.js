// Simple script to update user password using bcrypt
const bcrypt = require('bcrypt');

const password = 'Opendoors28$';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }

  console.log('Hashed password:', hash);
  console.log('\nRun this SQL command to update:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'ekosolarize@gmail.com';`);
  process.exit(0);
});
