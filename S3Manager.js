const s3Mgmt = require('s3-nodejs-sample');
var config;
var bucket; 


var AWS = require('aws-sdk'),
    fs = require('fs');

// For dev purposes only

/*
// Read in the file, convert it to base64, store to S3


*/
function initAWS(process) {
  config = {
      'credentials' : {
      'accessKeyId' : process.env.AWS_CONFIG_ACCESSKEY,
      'secretAccessKey' : process.env.AWS_CONFIG_SECRETKEY,
    }
  };
  AWS.config.update(config);
  bucket = process.env.AWS_BUCKET_NAME;
}

function uploadLocalFile(path, name) {
  fs.readFile(path, function (err, data) {
    if (err) { throw err; }

    var base64data = new Buffer(data, 'binary');

    var s3 = new AWS.S3();
    s3.upload({
      Bucket: bucket,
      Key: name,
      Body: base64data,
      ACL: 'public-read'
    },function (resp) {
      console.log(arguments);
      console.log('Successfully uploaded package.');
    });

  });
}

module.exports = {
   uploadLocalFile : uploadLocalFile,
  initAWS : initAWS
}