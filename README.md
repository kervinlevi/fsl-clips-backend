# fsl-clips-backend

a [Sails v1](https://sailsjs.com) application


## Setup
- Set up the MySQL database. Don't forget to create the `fsl_clips` table
- Create configuration file `.env` in `fsl-clips-backend/` directory
  ```
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_NAME=fsl_clips
  TEST_DB_NAME=test_fsl_clips
  
  DB_USER=_your_db_username_
  DB_PASSWORD=_your_db_password_
  JWT_SECRET=_generate_your_key_
  ```
- Run `npm install` to get all the dependencies
- Run the project via `sails lift`



### Links

+ [Sails framework documentation](https://sailsjs.com/get-started)
+ [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
+ [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
+ [Community support options](https://sailsjs.com/support)
+ [Professional / enterprise options](https://sailsjs.com/enterprise)


### Version info

This app was originally generated on Mon Apr 07 2025 21:52:48 GMT+0800 (Philippine Standard Time) using Sails v1.5.14.

<!-- Internally, Sails used [`sails-generate@2.0.13`](https://github.com/balderdashy/sails-generate/tree/v2.0.13/lib/core-generators/new). -->



<!--
Note:  Generators are usually run using the globally-installed `sails` CLI (command-line interface).  This CLI version is _environment-specific_ rather than app-specific, thus over time, as a project's dependencies are upgraded or the project is worked on by different developers on different computers using different versions of Node.js, the Sails dependency in its package.json file may differ from the globally-installed Sails CLI release it was originally generated with.  (Be sure to always check out the relevant [upgrading guides](https://sailsjs.com/upgrading) before upgrading the version of Sails used by your app.  If you're stuck, [get help here](https://sailsjs.com/support).)
-->

