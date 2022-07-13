require('dotenv').config();
let appInsights = require('applicationinsights');
appInsights.setup(process.env.AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING).start()
.setAutoDependencyCorrelation(true)
.setAutoCollectRequests(true)
.setAutoCollectPerformance(true, true)
.setAutoCollectExceptions(true)
.setAutoCollectDependencies(true)
.setAutoCollectConsole(true, false)
.setUseDiskRetryCaching(true)
.setAutoCollectPreAggregatedMetrics(true)
.setSendLiveMetrics(false)
.setAutoCollectHeartbeat(false)
.setInternalLogging(false, true)
.setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
.start();

let client = appInsights.defaultClient;
// client.trackEvent({name: "my custom event", properties: {customProperty: "custom property value"}});
// client.trackException({exception: new Error("handled exceptions can be logged with this method")});
// client.trackMetric({name: "custom metric", value: 3});
// client.trackTrace({message: "trace message"});
// client.trackDependency({target:"http://dbname", name:"select customers proc", data:"SELECT * FROM Customers", duration:231, resultCode:0, success: true, dependencyTypeName: "ZSQL"});
// client.trackRequest({name:"GET /customers", url:"http://myserver/customers", duration:309, resultCode:200, success:true});


const server = require('./server');
 
const port = process.env.WEB_PORT || 8080;

server.create(client)
.then(app => {
    app.listen(port, () => {
        console.log(`Server has started on port ${port}!`);
    }); 
}).catch(err => console.log(err));