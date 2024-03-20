const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const filePath = path.join(__dirname, 'attendance_responses/response.json');



const credentials = require('./keys/vacchain-99c42-271d560c8790.json');

const client = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res, next) => {

    attendenceList = JSON.parse(fs.readFileSync(filePath));
    res.json(attendenceList)

})

app.post('/create-spreadsheet', async (req, res) => {
    const { key, data } = req.body;
    console.log(req.body);
    // TODO : Auth with Login Credential wil login from the Recognintion MS
    if (key !== 'tatakae') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        await client.authorize();

        const sheets = google.sheets({ version: 'v4', auth: client });

        const spreadsheetResponse = await sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: 'LOL'
                }
            }
        });

        const spreadsheetId = spreadsheetResponse.data.spreadsheetId;

        // ! YE Nai ata Stackoverflow + ChatGPT
        const drive = google.drive({ version: 'v3', auth: client });
        await drive.permissions.create({
            resource: {
                type: 'anyone',
                role: 'reader'
            },
            fileId: spreadsheetId,
            fields: 'id'
        });

        // Prepare data to be written to the spreadsheet form the Request Recogintion_MS payload
        const jsonData = {
            data: data
        };

        // TODO : Refactor as per Rows and cols
        const values = jsonData.data.map(item => [item.label, item.timestamp, item.present]);
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A2:B', // Start from A2
            valueInputOption: 'RAW',
            requestBody: {
                values: values // No need to include header again
            }
        });

        // JSON data to be dumped into the response
        const responseJson = {
            message: 'Spreadsheet created successfully!',
            spreadsheetId: spreadsheetId,
            spreadsheetIdLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        };

        //    Dump
        let jsonDatas = [];

        try {
            jsonDatas = JSON.parse(fs.readFileSync(filePath));
        } catch (err) {
            console.error('Error reading JSON file:', err);
        }

        // Append responseJson to jsonData array
        jsonDatas.push(responseJson);

        // Write the updated JSON data back to the file
        fs.writeFile(filePath, JSON.stringify(jsonDatas, null, 2), (err) => {
            if (err) {
                console.error('Error writing JSON file:', err);
            } else {
                console.log('JSON file has been updated.');
            }
        });

        res.json(responseJson);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
