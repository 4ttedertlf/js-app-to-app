// general dependencies
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const timeStamp = (req) => {
    const date = new Date();
    const currentTimeStamp = date.getTime();
    console.log(`${currentTimeStamp} - ${req.protocol}//${req.headers.host}${req.originalUrl}`);
};

const create = async () => {

    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));

    // Display form and table
    app.get('/', async (req, res) => {

        return res.send("home");
        
    });

    app.get('/me/a', async (req, res) => {

        return res.send("/me/a " + JSON.stringify(req.headers));
    });   
    app.get('/me/b', async (req, res) => {

        let config = {  
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              "Authorization": `bearer ${req.headers['X-MS-TOKEN-AAD-ACCESS-TOKEN']}`
              //'Origin': '',
              //'Host': 'api.producthunt.com'
            },
            body: JSON.stringify({
              'client_id': '(API KEY)',
              'client_secret': '(API SECRET)',
              'grant_type': 'client_credentials'
            })
          }

        const url = "http://localhost:3005/me/b1";

        /*
        fetch(url)
        .then(res => {
            return res.json();
        }).then(text => console.log(text));
        */

        return res.send("/me/a " + JSON.stringify(req.headers));
    });  

    // instead of 404 - just return home page
    app.get('*', (req, res) => {
        timeStamp(req);

        res.redirect('/');
    });

    return app;
};

module.exports = {
    create
};
