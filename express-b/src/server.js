// general dependencies
const express = require("express");
const bodyParser = require("body-parser");
const { OnBehalfOfCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const authProviders = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
const axios = require("axios");

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_ID;

const timeStamp = (req) => {
  const date = new Date();
  const currentTimeStamp = date.getTime();
  console.log(
    `${currentTimeStamp} - ${req.protocol}//${req.headers.host}${req.originalUrl}`
  );
};

class MyAuthenticationProvider {
  _accessToken = undefined;

  /**
   * This method will get called before every request to the ms graph server
   * This should return a Promise that resolves to an accessToken (in case of success) or rejects with error (in case of failure)
   * Basically this method will contain the implementation for getting and refreshing accessTokens
   */
  MyAuthenticationProvider(accessToken) {
    _accessToken = accessToken;
  }
  getAccessToken() {
    if (!this._accessToken) return Promise.reject("no access token found");
    return Promise.resolve(this._accessToken);
  }
}
const getMeFromGraphREST = async (accessToken, appInsightsClient) => {
    try{
        const url = "https://graph.microsoft.com/v1.0/me";

        const options = {
          method: "GET",
          headers: {
            Authorization: accessToken,
            "Content-type": "application/json",
          },
        };
      
        const response = await axios.get(url, options);
        console.log(`getMeFromGraphREST = ${JSON.stringify(response.data)}`);
        appInsightsClient.trackTrace({message: response.data});
        const data = response.data;
      
        return data;
    }catch(err){
        appInsightsClient.trackTrace({message:err});
        console.log(err);
        throw err;
    }

};
const getMeFromGraphSDK = async (accessToken) => {
  const options = {
    debugLogging: true,
    authProvider: new MyAuthenticationProvider(accessToken),
  };

  const graphClient = Client.initWithMiddleware(options);

  const graphResponse = await graphClient
    .api("/me")
    .select("displayName")
    .get();

  return graphResponse;
};

const create = async (appInsightsClient) => {

  appInsightsClient.trackTrace({message:`appInsightsClient = ${appInsightsClient ? `found` : `not found`}`});

  const app = express();
  app.locals.appInsightsClient = appInsightsClient;
  app.use(bodyParser.urlencoded({ extended: true }));

  // Display form and table
  app.get("/", async (req, res) => {
    console.log(`/ - home request made 12:17`);
    req.app.locals.appInsightsClient.trackTrace({message: "home route"});
    return res.send("home 07/13/2022 11:33");
  });

  app.get("/easyauth", async (req, res) => {

    req.app.locals.appInsightsClient.trackNodeHttpRequest({request: req, response: res}); 
    req.app.locals.appInsightsClient.trackTrace({message: "/easyauth"});
    let jsonResponse = {
        token: "Bearer " + req.headers["x-ms-token-aad-access-token"],
        headers: req.headers,
        graph: undefined,
        error: undefined
    };

    try {
      // should have `X-MS-TOKEN-AAD-ACCESS-TOKEN`
      // insert from App Service if
      // MS AD identity provider is configured
      console.log(
        `/easyauth - beginning response = ${JSON.stringify(jsonResponse)}`
      );

      jsonResponse.graph = await getMeFromGraphREST(jsonResponse.token, req.app.locals.appInsightsClient);
      console.log(`Graph response = ${JSON.stringify(jsonResponse.graph)}`);

      return res.json(jsonResponse);
    } catch (err) {
      console.log(`error = ${JSON.stringify(err.message)}`);
      req.app.locals.appInsightsClient.trackTrace({message: "/easyauth " + JSON.stringify(err)});
      appInsightsClient.trackTrace(err);
      jsonResponse.error = err;
    } finally{
        appInsightsClient.trackTrace(jsonResponse);
        return res.json(jsonResponse);
    }
  });

  app.get("/me/b", async (req, res) => {

    req.app.locals.appInsightsClient.trackTrace({message: "/me/b"});
    req.app.locals.appInsightsClient.trackNodeHttpRequest({request: req, response: res}); 

    let jsonResponse = {
        token: req.headers["Authorization"],
        headers: req.headers,
        graph: undefined,
        error: undefined
    };

    try {// should have `X-MS-TOKEN-AAD-ACCESS-TOKEN`
        // insert from App Service if
        // MS AD identity provider is configured
        console.log(
          `/me/b - beginning response = ${JSON.stringify(jsonResponse)}`
        );
  
        jsonResponse.graph = await getMeFromGraphREST(jsonResponse.token, appInsightsClient);
        console.log(`Graph response = ${JSON.stringify(jsonResponse.graph)}`);
        req.app.locals.appInsightsClient.trackTrace({message: jsonResponse.graph});
        return res.json(jsonResponse);
      } catch (err) {
        console.log(`error = ${JSON.stringify(err.message)}`);
        req.app.locals.appInsightsClient.trackTrace({message: err});
        jsonResponse.error = err;
      } finally{
        req.app.locals.appInsightsClient.trackTrace({message: jsonResponse});
          return res.status(205).json(jsonResponse);
      }
  });

  // instead of 404 - just return home page
  app.get("*", (req, res) => {
    console.log(`/* - request made`);

    timeStamp(req);

    res.redirect("/");
  });

  return app;
};

module.exports = {
  create,
};
