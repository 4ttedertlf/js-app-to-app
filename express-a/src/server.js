// general dependencies
import express from 'express';
import bodyParser from 'body-parser';
import fetch from "node-fetch";

const timeStamp = (req) => {
    const date = new Date();
    const currentTimeStamp = date.getTime();
    console.log(`${currentTimeStamp} - ${req.protocol}//${req.headers.host}${req.originalUrl}`);
};
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 30000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}
export const create = async () => {

    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));

    // Display form and table
    app.get('/', async (req, res) => {

        return res.send("home 1");

    });

    app.get('/easyauth', async (req, res) => {

        // should have `x-ms-token-aad-access-token`
        // insert from App Service if
        // MS AD identity provider is configured
        return res.json(req.headers);

    });

    app.get('/me/a', async (req, res) => {

        let configResponse = {
            url: process.env.DOWNSTREAM_SERVER,
            authHeader: undefined,
            config: undefined,
            backendServer: undefined, 
            resultStatusCode: undefined,
            resultJSON: undefined,
            error: undefined
        }

        try {

            // local: "http://localhost:8085/me/b"
            // azure: "http://"
            // process.env.DOWNSTREAM_SERVER
            const url = process.env.DOWNSTREAM_SERVER;


            const authHeader = `Bearer ${req.headers['x-ms-token-aad-access-token'] || 'hello'}`
            configResponse.authHeader = authHeader;

            let config = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    "Authorization": authHeader
                }
            }
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
            
        } finally{
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