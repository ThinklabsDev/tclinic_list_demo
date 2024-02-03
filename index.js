const { config } = require('dotenv');
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { SerialPort } = require('serialport');

config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`backend started at http://localhost:${PORT}`);
});

const onConnectError = (err) => {
  if (err) return console.log(err);
};

const serialPort = [];
const filePath = path.join(__dirname, '/src/file/data.txt');

(async () => {
  const ports = await SerialPort.list();
  ports.forEach((port, index) => {
    serialPort.push({ path: port.path });
    serialPort[index].port = new SerialPort({ path: port.path, baudRate: 9600 }, onConnectError);
    try {
      serialPort[index].port.on('data', (data) => {
        const dataString = data.toString();
        console.log(port.path, dataString);
        // console.log(port.path, data.toString('hex'));
        // console.log(data);
        const logPath = path.join(__dirname, `/src/file-log/${port.path}.txt`);
        const logData = new Date().toLocaleString() + '\n' + dataString + '\n\n';
        fs.appendFile(logPath, logData, (err) => {
          if (err) {
            console.log(err);
            return;
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  });
})();

app.get('/api/serial-port', async (req, res) => {
  try {
    const data = serialPort.map((port) => ({
      path: port.path,
      log: port.log,
    }));
    return res.json(data);
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.post('/api/serial-port/write', async (req, res) => {
  try {
    const { port, data } = req.body;
    if (!port || !data) return res.status(400).json({ message: 'body không đúng đinh dạng' });
    const index = serialPort.findIndex((e) => port === e.path);
    if (index === -1) res.status(400).json({ message: 'cổng không tồn tại' });
    serialPort[index].port.write(data);

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

app.post('/api/serial-port/write-file-test', async (req, res) => {
  try {
    const { port } = req.body;
    if (!port) return res.status(400).json({ message: 'body không đúng đinh dạng' });
    const index = serialPort.findIndex((e) => port === e.path);
    if (index === -1) res.status(400).json({ message: 'cổng không tồn tại' });

    const file = fs.readFileSync(filePath);
    serialPort[index].port.write(file, (err) => {
      if (err) console.log(err);
    });

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// fs.writeFile('./src/file-log/log.txt', 'Test', function (err) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log('The file was saved!');
// });

// fs.readFile(filePath, (err, data) => {
//   if (err) return console.log(err);

//   // console.log(data.toString());

//   const hl7Message = data.toString();
//   const segments = hl7Message.split('\n');
//   let jsonData = {};
//   for (let segment of segments) {
//     // Split the segment into fields
//     let fields = segment.split('|');

//     // The segment name is the first field
//     let segmentName = fields[0].substring(1);

//     // Remove the segment name from the fields array
//     fields.shift();

//     // Add the fields to the JSON data under the segment name
//     jsonData[segmentName] = fields;
//     // jsonData[segmentName] = fields.filter((field) => field !== '');

//     if (segmentName.includes('R')) {
//       console.log('fields', fields);
//     }
//   }

//   // Convert the JSON data to a string
//   let jsonString = JSON.stringify(jsonData, null, 2);

//   // console.log(jsonString);
//   // const tmp = [];
//   // Object.keys(jsonData).forEach((key) => {
//   //   if (key.includes('R')) {
//   //     console.log(key, jsonData[key]);
//   //     tmp.push({
//   //       index: jsonData[key][0],
//   //       data: jsonData[key][1],
//   //       value: jsonData[key][2],
//   //       unit: jsonData[key][3],
//   //       time: jsonData[key][11],
//   //     });
//   //   }
//   // });
//   // console.log(tmp.sort((a, b) => a.index - b.index));
// });
