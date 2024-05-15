
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Ejercicio-unidad2')
  .then(() => console.log('MongoDB Connected…'))
  .catch(err => console.error('Could not connect to MongoDB:', err));