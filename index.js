const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5000;
const dbUser = process.env.DB_USER;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;
const reserveTbl = process.env.RESERVE_TBL;


const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.ou4zy.mongodb.net/${dbName}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => res.send('Backend is working'));

client.connect((err) => {
    const reserveCollection = client.db(dbName).collection(reserveTbl);

    app.get('/getAllReserves', (req, res) => {
        reserveCollection.find({})
            .toArray((err, document) => res.send(document));
    });

    app.post('/getOwnerReserves', (req, res) => {
        reserveCollection.find({ email: req.body.email })
            .toArray((err, document) => res.send(document));
    });

    app.post('/addReserves', (req, res) => {
        const resName = req.body.resName;
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;
        const details = req.body.details;
        const email = req.body.email || 'kazi.mashry01@gmail.com'
        const file = req.files.file;

        const encodedImg = file.data.toString('base64');

        const image = {
            contentype: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encodedImg, 'base64')
        }

        reserveCollection.insertOne({ email, resName, fromDate, toDate, details, image })
            .then((result) => res.send(result.insertedCount > 0))
            .catch((error) => res.send({ msg: error.message }));
    });

    app.patch('/update/:id', (req, res) => { 
        reserveCollection.updateOne(
            {_id: ObjectId(req.params.id)},
            {$set: {resName: req.body.resName, toDate: req.body.toDate, fromDate: req.body.fromDate, details: req.body.details}}
        ).then(response => res.send(response.modifiedCount > 0));
    });

    app.post('/delete/:id', (req, res) => {
        const id = req.params.id;
        reserveCollection.deleteOne({ _id: ObjectId(id) })
        .then(response => res.send(response.deletedCount > 0));
    });

});

app.listen(port);