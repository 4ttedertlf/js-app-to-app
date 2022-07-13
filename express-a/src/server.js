// general dependencies
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import axios from 'axios';

const timeStamp = (req) => {
  const date = new Date();
  const currentTimeStamp = date.getTime();
  console.log(
    `${currentTimeStamp} - ${req.protocol}//${req.headers.host}${req.originalUrl}`
  );
};
const getMeFromGraphREST = async (accessToken) => {
  try {
    const url = 'https://graph.microsoft.com/v1.0/me';

    const options = {
      method: 'GET',
      headers: {
        Authorization: accessToken,
        'Content-type': 'application/json',
      },
    };

    const response = await axios.get(url, options);
    console.log(`getMeFromGraphREST = ${JSON.stringify(response.data)}`);
    const data = response;

    return data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 30000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}
export const create = async (appInsightsClient) => {
  const app = express();
  appInsightsClient.trackTrace({
    message: `appInsightsClient = ${appInsightsClient ? `found` : `not found`}`,
  });
  app.use(bodyParser.urlencoded({ extended: true }));

  // Display form and table
  app.get('/', async (req, res) => {
    return res.send('home a 2022-07-12 1:22 pm');
  });

  app.get('/easyauth', async (req, res) => {
    return res.json(req.headers);
  });
  app.get('/easyauth2', async (req, res) => {
    try {
      // should have `x-ms-token-aad-access-token`
      // insert from App Service if
      // MS AD identity provider is configured
      const response = await getMeFromGraphREST(
        'Bearer ' + req.headers['x-ms-token-aad-access-token']
      );
      console.log(`Graph response = ${JSON.stringify(response)}`);
      return res.json(response);
    } catch (err) {
      return res.status(200).json(err);
    }
  });

  app.get('/me/a', async (req, res) => {
    let configResponse = {
      url: process.env.DOWNSTREAM_SERVER,
      authHeader: undefined,
      config: undefined,
      backendServer: undefined,
      resultStatusCode: undefined,
      resultJSON: undefined,
      error: undefined,
    };

    try {
      // local: "http://localhost:8085/me/b"
      // azure: "http://"
      // process.env.DOWNSTREAM_SERVER
      const url = process.env.DOWNSTREAM_SERVER;

      const token = req.headers['x-ms-token-aad-access-token'] || 'hello';
      console.log(`token = ${token}`);
      const authHeader = `Bearer ${token}`;
      configResponse.authHeader = authHeader;

      let config = {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      };
      configResponse.config = config;

      if (url) {
        const backendServerUrl = `${url}/me/b`;
        configResponse.backendServer = backendServerUrl;
        console.log(`backendServerUrl: ${backendServerUrl}`);

        const result = await fetchWithTimeout(backendServerUrl, config);
        configResponse.resultStatusCode = result.status;

        if (result.ok) {
          console.log(`b returned`);
          const json = await result.json();

          configResponse.resultJSON = json;
        }
      }
    } catch (error) {
      // Timeouts if the request takes
      // longer than 6 seconds
      console.log(error.name === 'AbortError');
      configResponse.error = error;
    } finally {
      res.json(configResponse);
    }
  });

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    timeStamp(req);

    res.redirect('/');
  });

  return app;
};
