
var grunt = require('grunt');
var config = require('./resources/arcgis_config.json');

grunt.loadNpmTasks('grunt-aws-lambda');

grunt.initConfig({
  lambda_invoke: {
    default: {
      options: {
        file_name: 'index.js'
      }
    }
  },
  lambda_deploy: {
    default: {
      arn: 'arn:aws:lambda:us-west-2:564665811574:function:updateArcgisAwLevels',
      options: {
        handler: 'index.handler',
        accessKeyId: config.amazonCredentials.accessKeyId,
        secretAccessKey: config.amazonCredentials.secretAccessKey,
        region: 'us-west-2'
      }

    }
  },
  lambda_package: {
    default: {
      options: {
        include_files: ['./resources/arcgis_config.json']
      }
    }
  }
});

grunt.registerTask('test', ['lambda_invoke']);
grunt.registerTask('deploy', ['lambda_package', 'lambda_deploy']);