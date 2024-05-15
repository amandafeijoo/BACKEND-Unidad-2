const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const mongoose = require('mongoose');
const axios = require('axios');

require('./database');

const cookieParser = require('cookie-parser');
const Favorite = require('./models/Favorite');

const app = express();
app.use(express.json());
app.use(cookieParser());

const spotifyApi = new SpotifyWebApi({
  clientId: '059b890cc741474c839b0dfa1ba15149',
  clientSecret: 'fa3050c01cb64e8fb80d4e7bc7406b83',
  redirectUri: 'http://localhost:3000/callback',
});

// Ruta para iniciar sesión en Spotify y obtener el token de acceso
app.get('/login', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(['user-top-read']);
  res.redirect(authorizeURL);
});

// Ruta para manejar el callback de la autenticación de Spotify
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    res.cookie('accessToken', data.body['access_token'], { httpOnly: true });
    res.redirect('/songs');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ruta para obtener las canciones más escuchadas en Spotify
app.get('/songs', async (req, res) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=long_term', {
      headers: {
        'Authorization': `Bearer ${req.cookies.accessToken}`
      }
    });
    const songs = response.data.items.map(({ name, artists }) => `${name} --> ${artists.map(artist => artist.name).join(', ')}`);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rutas para la lista de canciones favoritas
app.get('/favorites', async (req, res) => {
  try {
    const favorites = await Favorite.find();
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/favorites', async (req, res) => {
  const favorite = new Favorite({
    name: req.body.name,
    artist: req.body.artist,
  });

  try {
    const newFavorite = await favorite.save();
    res.status(201).json(newFavorite);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/favorites/:id', async (req, res) => {
    try {
      const favorite = await Favorite.findByIdAndDelete(req.params.id);
      if (!favorite) return res.status(404).json({ message: 'Cannot find favorite' });
      res.json({ message: 'Deleted Favorite' });
    } catch(err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put('/favorites/:id', async (req, res) => {
    try {
      const favorite = await Favorite.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!favorite) return res.status(404).json({ message: 'Cannot find favorite' });
      res.json(favorite);
    } catch(err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/favorites/:id', getFavorite, (req, res) => {
    res.json(res.favorite);
  });

// Middleware para obtener una canción favorita por ID
async function getFavorite(req, res, next) {
  let favorite;
  try {
    favorite = await Favorite.findById(req.params.id);
    if (favorite == null) {
      return res.status(404).json({ message: 'Cannot find favorite' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.favorite = favorite;
  next();
}

app.listen(3000, () => console.log('Server started'));



