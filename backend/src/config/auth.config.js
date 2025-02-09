// Authentication configuration
module.exports = {
    secret: process.env.JWT_SECRET,
    tokenExpiration: '24h'
  };