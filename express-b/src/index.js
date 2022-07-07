const server = require('./server');
 
const port = process.env.WEB_PORT || 8085;

server.create()
.then(app => {
    app.listen(port, () => {
        console.log(`Server has started on port ${port}!`);
    }); 
}).catch(err => console.log(err));