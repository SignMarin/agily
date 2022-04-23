const express = require('express');
const router = express.Router();

const axios = require('axios');
const NodeCache = require("node-cache");
const myCache = new NodeCache();

const apiKey = 'db988691faf182dfc3750cd1e57f3718'



//have the French cities that correspond to the input fields
router.get('/cities', async function (req, res, next) {


  if (req.query.name !== undefined) {
    const location = req.query.name
    const cache = myCache.get(location)


    if (cache === undefined) {

      axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${location},FR&limit=5&appid=${apiKey}`)
        .then(function (response) {
          if (response.status === 200) {
            if (response.data.length > 0) {

              let cities = [];

              for (const city of response.data) {
                cities.push({
                  lat: city.lat,
                  lon: city.lon,
                  name: city.name,
                  state: city.state
                })
              }

              const obj = { status: '200', body: cities }
              myCache.set(location, obj, 10000);


              res.json(obj);
            } else {

              const obj = { status: '204', message: 'cities not found' }
              myCache.set(location, obj, 10000);

              res.json(obj);
            }
          }
        })
        .catch(function (error) {
          console.log(error);

          const obj = { status: '500', message: error.message }
          myCache.set(location, obj, 10000);

          res.json(obj);
        })


    } else {
      res.json(cache);
    }
  } else {
    const obj = { status: '204', message: 'cities not found' }

    res.json(obj);
  }
});





//get the weather for the next 8 days with longitude and latitude
router.get('/weather', async function (req, res, next) {

  if (req.query.lat !== undefined || req.query.lon !== undefined) {

    const lat = req.query.lat
    const lon = req.query.lon

    const cache = myCache.get(lat + lon)

    if (cache === undefined) {


      axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=metric&lang=fr`)
        .then(function (response) {
          if (response.status === 200) {
            let weather = []

            for (const day of response.data.daily) {

              let date = [day.dt, '000'].join('')
              weather.push({
                date,
                temp: {
                  day: day.temp.day,
                  min: day.temp.min,
                  max: day.temp.max,
                },
                humidity: day.humidity,
                pressure: day.pressure,
                windSpeed: day.wind_speed,
                icon: day.weather[0].icon
              })
            }

            const obj = { status: '200', body: weather }
            myCache.set(lat + lon, obj, 10000);


            res.json(obj);
          }
        })
        .catch(function (error) {
          console.log(error);

          const obj = { status: '500', message: error.message }
          myCache.set(lat + lon, obj, 10000);

          res.json(obj);
        })

    } else {

      res.json(cache);
    }

  } else {
    const obj = { status: '204', message: 'weather not found' }
    res.json(obj);
  }
});


router.get('/background', async function (req, res, next) {

  if (req.query.name !== undefined) {
    const city = req.query.name

    const cache = myCache.get(city + 'url')

    if (cache === undefined) {

      axios.get(`http://fr.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${city}`)
        .then(function (response) {
          if (response.status === 200) {

            const page = Object.keys(response.data.query.pages)
            const url = response.data.query.pages[page].original.source
            const obj = {
              status: '200',
              body: {
                url,
              }
            }

            myCache.set(city + "url", obj, 10000);


            res.json(obj);
          } else {
            const obj = { status: '204', message: 'image not found' }
            myCache.set(city + "url", obj, 10000);

            res.json(obj);
          }
        })
        .catch(function (error) {
          console.log(error);

          const obj = { status: '500', message: error.message }
          myCache.set(city + "url", obj, 10000);

          res.json(obj);
        })
    } else {
      res.json(cache);
    }
  } else {

    const obj = { status: '204', message: 'image not found' }

    res.json(obj);

  }

})

module.exports = router;
