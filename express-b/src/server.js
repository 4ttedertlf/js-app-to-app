// general dependencies
const express = require('express');
const bodyParser = require('body-parser');
const { OnBehalfOfCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const authProviders =
  require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_ID;


const timeStamp = (req) => {
    const date = new Date();
    const currentTimeStamp = date.getTime();
    console.log(`${currentTimeStamp} - ${req.protocol}//${req.headers.host}${req.originalUrl}`);
};

class MyAuthenticationProvider {

    _accessToken = undefined;

    /**
     * This method will get called before every request to the ms graph server
     * This should return a Promise that resolves to an accessToken (in case of success) or rejects with error (in case of failure)
     * Basically this method will contain the implementation for getting and refreshing accessTokens
     */
     MyAuthenticationProvider(accessToken){
        _accessToken=accessToken
     }
    getAccessToken() {
        if(!this._accessToken) return Promise.reject("no access token found");
        return Promise.resolve(this._accessToken);
    }
}

const getMeFromGraph = async (accessToken) => {

    const options = {
        debugLogging: true,
        authProvider: new MyAuthenticationProvider(accessToken)
    };
    
    const graphClient = Client.initWithMiddleware(options);
    
    const graphResponse = await graphClient
    .api("/me")
    .select("displayName")
    .get();

    return graphResponse;
}

const create = async () => {

    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));

    // Display form and table
    app.get('/', async (req, res) => {

        return res.send("home 07/1/2022-1");
        
    });

    app.get('/easyauth', async (req, res) => {

        // should have `X-MS-TOKEN-AAD-ACCESS-TOKEN`
        // insert from App Service if
        // MS AD identity provider is configured
        return res.json(req.headers);
        
    });
 
    app.get('/me/b', async (req, res) => {

        // read the AD access token from the bearer token value
        const bearerToken = (req.headers['authorization'] || "no authorization header found").toString();
        if (!bearerToken.startsWith("Bearer ")){
            return res.json({error: "Can't extract bearer token value"})
       }  
       accessToken = bearerToken.substring(7, bearerToken.length);
       console.log(`Bearer token: ${bearerToken}`);

       const myInfo = await getMeFromGraph(accessToken);

        return res.send({ result: myInfo });
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
