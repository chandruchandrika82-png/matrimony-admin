const path = require('path');
const backend = path.resolve(__dirname, '../../matrimony-app/backend');
process.chdir(backend);
// The existing backend logs its database URI; suppress logs to keep credentials private.
console.log = () => {};
console.error = () => process.stderr.write('Backend error. Check local backend configuration.\n');
require(path.join(backend, 'server.js'));
