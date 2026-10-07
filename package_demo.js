const fs=require('fs'),path=require('path');
require('./package_theater.js');
fs.copyFileSync(path.join(__dirname,'fly-at-controls.html'),path.join(__dirname,'demo.html'));
