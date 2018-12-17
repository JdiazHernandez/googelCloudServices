/*
  This app requires the use of manually created user credentials
  From Google Sheets api:
  https://developers.google.com/sheets/api/quickstart/nodejs?authuser=0
  as credentials.json.
  And the keys form firebase:
  Console, Configuration > Service account > new key
  as <NAME-OF-THE-PROJECT>firebase<TYPE-OF-KEY>.json
*/

//Modules required
const fs = require( 'fs' );
const readline = require( 'readline' );
const {google} = require( 'googleapis' );
const Firestore = require( '@google-cloud/firestore' );

 //Firebase information
const firestore = new Firestore({
  projectId: ' <YOUR FIREBASE PROJECT ID> ',
  keyFilename: './ <YOUR FIREBASE CREDENTIALS PATH>.json',
  timestampsInSnapshots: true,
});

// If modifying these scopes, delete token.json.
const SCOPES = [ 'https://www.googleapis.com/auth/spreadsheets.readonly' , 'https://www.googleapis.com/auth/datastore' ];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', ( err , content ) => {
  if ( err ) return console.log( 'Error loading client secret file:' , err );
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize( JSON.parse( content ), retrieveData );
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param { Object } credentials The authorization client credentials.
 * @param { function } callback The callback to call with the authorized client.
 */

function authorize( credentials , callback ) {
  const { client_secret , client_id , redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2( client_id , client_secret , redirect_uris[0] );

  // Check if we have previously stored a token.
  fs.readFile( TOKEN_PATH, ( err, token ) => {
    if ( err ) return getNewToken( oAuth2Client, callback );
    oAuth2Client.setCredentials( JSON.parse ( token ));
    callback( oAuth2Client );
  });
}
//Name the collection where the data will be added
const document = firestore.collection( ' <NAME_OF_THE_COLLECTION> ' );

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param { google.auth.OAuth2 } oAuth2Client The OAuth2 client to get token for.
 * @param { getEventsCallback } callback The callback for the authorized client.
 */
 //New token creation.
function getNewToken( oAuth2Client , callback ) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log( 'Authorize this app by visiting this url:', authUrl );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question( 'Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken( code, ( err, token ) => {
      if ( err ) return console.error( 'Error while trying to retrieve access token' , err);
      oAuth2Client.setCredentials( token );

      // Store the token to disk for later program executions
      fs.writeFile( TOKEN_PATH , JSON.stringify( token ), ( err ) => {
        if ( err ) console.error( err );
        console.log( 'Token stored to' , TOKEN_PATH );
      });
      callback( oAuth2Client );
    });
  });
}
/**
 * Prints the the selected rows into the a FireStore from the google sheets URL:
 * @see https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit
 * @param { google.auth.OAuth2 } auth The authenticated Google OAuth client.
 */
//Data reading and copying 
function retrieveData( auth ) {
  const dataArray = [];
  const sheets = google.sheets({ version: 'v4' , auth });
  sheets.spreadsheets.values.get({
    spreadsheetId: '<GOOGLE_SHEET_ID',
    range: 'A1:G',
  }, ( err, res ) => {
    if ( err ) return console.log( 'The API returned an error: ' + err );
    const rows = res.data.values;
    if ( rows.length ) {
      console.log( 'Here is the data push to firestore: ' )
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map(( row ) => {
        //console.log(`${row[4]}, ${row[6]}`);
        dataArray.push( `${row[4]} , ${row[6]}` )
      });
      
    } else {
      console.log( 'No data found.' );
    }
    document.add( Object.assign( {},dataArray ) )
    console.log( Object.assign( {},dataArray ) )
  });
}

