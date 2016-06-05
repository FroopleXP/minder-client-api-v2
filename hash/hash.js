var bcrypt = require('bcrypt');

// Creating functions to generate and compare hashes
module.exports.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}

module.exports.validPassword = function(password, password_enc) {
    return bcrypt.compareSync(password, password_enc);
}
