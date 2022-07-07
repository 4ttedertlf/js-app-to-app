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

        const url = "http://localhost:8085/me/b";

        const authHeader = `Bearer ${req.headers['X-MS-TOKEN-AAD-ACCESS-TOKEN'] || 'hello'}`


        let config = {  
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              "Authorization": authHeader
              //'Origin': '',
              //'Host': 'api.producthunt.com'
            }
          }
        
        fetch(url, config)
        .then(res => {
            console.log(`b returned`);
            return res.json();
        }).then(text => console.log(text));    

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
