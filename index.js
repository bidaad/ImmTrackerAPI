const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const fetch = require('node-fetch');
var cors = require('cors');

const app = express();
const cacheDuration = 3600

app.use(express.json())
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var corsOptions = {
    origin: 'localhost:3001',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    methods: 'GET,PUT,POST'
}

app.use(cors(corsOptions));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: true }));

app.disable('etag');
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


const DBConnection = 'mongodb://localhost:27017/immtracker';
var Counter = 0

const courses = [
    { id: 1, name: 'course1' },
    { id: 2, name: 'course2' },
    { id: 3, name: 'course3' }
]

const CaseSchema = new mongoose.Schema({
    UserID: String,
    UserFirstName: String,
    UserLastName: String,
    Nationality: String,
    AORDate: Date,
    Country: String,
    ImmStream: String,
    CurrentStatus: String,
    MedicalPassedDate: Date,
    BiometricsInvitationLetterDate: Date,
    BGCheckStatus: String,
    BGSChangeDate: Date,
    PrincipalApplicantDependents: String,

    PPRDate: Date,
    NOC: String,
    VisaOffice: String,
    AdditionalInfo: String,
    BGCheckStartDate: Date,
    EmploymentVerificationDate: Date,
    AdditionalDocReqDate: Date,
    ProvinceSponsor: String,
    RPRFPaidDate: Date,
    CRSScore: String,
    GCMSNotesOrdered: Boolean,
    SecurityScreening: Boolean,
    Refused: Boolean
});


const UsersSchema = new mongoose.Schema({
    firstName: String, lastName: String, email: String, password: String, googleTokenID: String, facebookTokenID: String
});

const HCResourceSitesCatsSchema = new mongoose.Schema({}, { collection: 'HCResourceSitesCats' });


const Users = mongoose.model('users', UsersSchema);
const Cases = mongoose.model('cases', CaseSchema);

app.get('/testlogin', (req, res) => {
    sess = req.session;
    sess.email = req.query.email;
    res.end('done with email ' + req.query.email);
});
app.get('/testlogin2', (req, res) => {
    console.log('received');

    sess = req.session;
    console.log(sess);

    res.end('email =' + sess.email);
});

app.get('/api/cases/delete/:id', (req, res) => {
    const id = req.params.id;
    sess = req.session;
    console.log('del id=' + id);
    console.log('user id=' + sess.userID);
    console.log('user email=' + sess.email);

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        var ObjectId = require('mongoose').Types.ObjectId;
        var query = { '_id': new ObjectId(Id), UserID: sess.userID };

        var CurCase = await Cases.deleteOne({ _id: id }, function (err, response) {
            if (err) {
                return res.status(404).send('Error');
            }
            else {
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.status(200).json(response).end();
            }

        })
            .catch(error => console.log(error));



        // res.setHeader('Access-Control-Allow-Origin', '*')
        // res.status(200).json(CurSite);
    }


    //res.end();
});


app.get('/api/login', (req, res) => {
    const email = req.query.email;
    const password = req.query.password;
    const googleTokenID = req.query.googleTokenID;
    const facebookTokenID = req.query.facebookTokenID;
    const firstName = req.query.firstName;
    const lastName = req.query.lastName;
    sess = req.session;

    console.log('email=' + email);

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        if (password != undefined) {
            await Users.findOne({ "email": email, "password": password }, function (err, doc) {
                if (err) {
                    //return res.status(404).send('The item with the given id was not found');
                    return res.status(404).send('LoginError');
                }
                else {
                    if (doc == null) {
                        return res.status(200).send('LoginError');
                    }
                    else {
                        console.log('user and pass');

                        sess.userID = doc._id;
                        sess.email = doc.email;
                        sess.firstName = doc.firstName;
                        sess.lastName = doc.lastName;
                        res.status(200).json(doc).end();
                    }

                }
            });
        }
        else {
            if (googleTokenID != undefined || facebookTokenID != undefined) {
                if (googleTokenID != null) {
                    fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + googleTokenID)
                        .then(response => response.json())
                        .then(data => {
                            if (data.email == email) {
                                console.log('is valid');

                                Users.findOne({ email: data.email }, function (err, doc) {
                                    if (err) {
                                        console.log(err);

                                        return res.status(404).send('Error');
                                    }
                                    else {
                                        //console.log(doc);

                                        if (doc == null) {
                                            console.log('doc is null');

                                            run().catch(error => console.log(error.stack));
                                            async function run() {
                                                await mongoose.connect(DBConnection, { useNewUrlParser: true });

                                                data = {
                                                    email: email,
                                                    firstName: firstName,
                                                    lastName: lastName,
                                                    createDate: new Date(),
                                                    password: password,
                                                    googleTokenID: googleTokenID
                                                }

                                                var user = new Users(data);
                                                user.save(function (err, doc) {
                                                    //if (err)
                                                    //return res.status(200).send('error');;

                                                    sess.userID = doc._id;
                                                    sess.email = doc.email;
                                                    sess.firstName = doc.firstName;
                                                    sess.lastName = doc.lastName;
                                                    res.status(200).json(doc).end();
                                                    console.log(doc);


                                                    console.log('User Inserted');
                                                })


                                                //res.setHeader('Access-Control-Allow-Origin', '*')
                                                //res.status(200).send(user).end();
                                            }
                                        }
                                        else {
                                            console.log('session set google');

                                            sess.userID = doc._id;
                                            sess.email = doc.email;
                                            sess.firstName = doc.firstName;
                                            sess.lastName = doc.lastName;
                                            res.status(200).json(doc).end();
                                        }

                                    }
                                });
                            }
                        }
                        );
                }
                else if (facebookTokenID != null) {
                    fetch('https://graph.facebook.com/me?fields=email,first_name,last_name&access_token=' + facebookTokenID)
                        .then(response => response.json())
                        .then(data => {
                            if (data.email == email) {
                                console.log('is valid');

                                Users.findOne({ "googleTokenID": googleTokenID }, function (err, doc) {
                                    if (err) {
                                        return res.status(404).send('Error');
                                    }
                                    else {
                                        if (doc == null) {

                                            run().catch(error => console.log(error.stack));
                                            async function run() {
                                                await mongoose.connect(DBConnection, { useNewUrlParser: true });

                                                data = {
                                                    email: email,
                                                    firstName: first_Name,
                                                    lastName: last_Name,
                                                    createDate: new Date(),
                                                    password: password,
                                                    facebookTokenID: facebookTokenID
                                                }

                                                var user = new Users(data);
                                                user.save(function (err, doc) {
                                                    //if (err)
                                                    //return res.status(200).send('error');;
                                                    sess = req.session;
                                                    sess.id = doc._id;
                                                    sess.email = doc.email;
                                                    sess.firstName = doc.firstName;
                                                    sess.lastName = doc.lastName;
                                                    res.status(200).json(doc).end();

                                                    console.log('User Inserted');
                                                })


                                                //res.setHeader('Access-Control-Allow-Origin', '*')
                                                res.status(200).send(cases).end();
                                            }
                                        }
                                        else {
                                            console.log(doc);
                                            sess = req.session;
                                            sess.id = doc._id;
                                            sess.email = doc.email;
                                            sess.firstName = doc.firstName;
                                            sess.lastName = doc.lastName;
                                            res.status(200).json(doc).end();
                                        }

                                    }
                                });
                            }
                        }
                        );
                }
                else
                    res.status(200).end();
            }
            else
                res.status(200).end();
        }

        // res.setHeader('Access-Control-Allow-Origin', '*')
        // res.status(200).json(CurSite);
    }


    //res.end();
});

function validateCourse(course) {
    const schema = {
        name: Joi.string().min(3).required()
    }

    return Joi.validate(course, schema);
}

app.get('/', (req, res) => {
    res.send('ImmTracker API')
})

app.get('/api/cases', (req, res) => {
    const userID = req.query.userID;
    var recordList = null;
    run().catch(error => console.log(error.stack));


    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });
        if (userID == undefined) {
            recordList = await Cases.aggregate(
                [
                    {
                        $project: {
                            Nationality: 1, AORDate: 1, Country: 1, ImmStream: 1, CurrentStatus: 1, MedicalPassedDate: 1, BiometricsInvitationLetterDate: 1, BGCheckStatus: 1, BGSChangeDate: 1, PrincipalApplicantDependents: 1, PPRDate: 1, NOC: 1, VisaOffice: 1, AdditionalInfo: 1, BGCheckStartDate: 1, EmploymentVerificationDate: 1, AdditionalDocReqDate: 1, ProvinceSponsor: 1, RPRFPaidDate: 1, CRSScore: 1, GCMSNotesOrdered: 1, SecurityScreening: 1, Refused: 1,
                            fullName: { $concat: ["$UserFirstName", " ", "$UserLastName"] }
                        }
                    }
                ]

                , function (err, doc) {
                    if (err) {
                        return res.status(404).send('The item with the given id was not found' + err);
                    }
                });
        }
        else {

            recordList = await Cases.aggregate(
                [{
                    $match:
                    {
                        UserID: userID,
                    }
                },
                {
                    $project: {
                        Nationality: 1, AORDate: 1, Country: 1, ImmStream: 1, CurrentStatus: 1, MedicalPassedDate: 1, BiometricsInvitationLetterDate: 1, BGCheckStatus: 1, BGSChangeDate: 1, PrincipalApplicantDependents: 1, PPRDate: 1, NOC: 1, VisaOffice: 1, AdditionalInfo: 1, BGCheckStartDate: 1, EmploymentVerificationDate: 1, AdditionalDocReqDate: 1, ProvinceSponsor: 1, RPRFPaidDate: 1, CRSScore: 1, GCMSNotesOrdered: 1, SecurityScreening: 1, Refused: 1,
                        fullName: { $concat: ["$UserFirstName", " ", "$UserLastName"] }
                    }
                }
                ]
                , function (err, doc) {
                    if (err) {
                        return res.status(404).send('The item with the given id was not found');
                    }
                });
        }

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(recordList).end();
    }
})


app.get('/api/cases/:id', (req, res) => {
    const userID = req.query.userID;
    const id = req.params.id;
    var recordList = null;


    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });
        if (userID == undefined) {
            recordList = await Cases.find({ _id: id }, function (err, doc) {
                if (err) {
                    return res.status(404).send('The item with the given id was not found' + err);
                }
            });
        }
        if (recordList != null) {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).json(recordList[0]).end();
        }
        else {
            return res.status(404).send('The item with the given id was not found');
        }
    }
})


app.get('/api/cases/count', (req, res) => {
    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const recordCount = await Cases.count({}, function (err, doc) {
            if (err) {
                return res.status(404).send('The item with the given id was not found');
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json({ recordCount: recordCount }).end();
    }
})


// app.get('/api/login', (req, res) => {
//     sess = req.session;
//     sess.email = 'bidaad@yahoo.com';
//     res.end('done');
// });

app.get('/api/users', (req, res) => {
    sess = req.session;
    if (sess.email) {
        res.write(`<h1>Hello ${sess.email} </h1><br>`);
        res.end('<a href=' + '/logout' + '>Logout</a>');
    }
    else {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href=' + '/' + '>Login</a>');
    }

    //run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const recordList = await Users.find({}, function (err, doc) {
            if (err) {
                return res.status(404).send('The item with the given id was not found');
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(recordList).end();
    }
})

app.get('/api/HCResourceSitesCats', (req, res) => {

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const RecordList = await HCResourceSitesCats.aggregate([{ $project: { "label": "$name", "value": "$_id" } }]);
        //console.log(CurSite.Url);

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(RecordList).end();
    }
})

app.get('/api/ResourceSites/:id', (req, res) => {
    const cacheKey = 'ResourceSites'


    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const CurSite = await ResourceSites.find({ "_id": req.params.id }, function (err, doc) {
            if (err) {
                return res.status(404).send('The item with the given id was not found');
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(CurSite);
    }
})

app.get('/api/ResourceSiteCats', (req, res) => {

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const CurSite = await ResourceSiteCats.find({}, function (err, doc) {
            if (err) {
                return res.status(404).send('The item with the given id was not found');
            }
        });
        //console.log(CurSite.Url);

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(CurSite);
    }
})

app.get('/api/ResourceSiteCats/:Id', (req, res) => {

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const CurSite = await ResourceSiteCats.find({ "_id": req.params.id }, function (err, doc) {
            if (err) {
                return res.status(404).send('The item with the given id was not found');
            }
        });
        //console.log(CurSite.Url);

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(CurSite);
    }
})

app.put('/api/cases', (req, res) => {
    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });
        console.log('PUT Cases , id=' + req.body.Id);

        data = {
            UserID: req.body.userID,
            UserFirstName: req.body.UserFirstName,
            UserLastName: req.body.UserLastName,
            Nationality: req.body.Nationality,
            AORDate: req.body.AORDate,
            Country: req.body.Country,
            ImmStream: req.body.ImmStream,
            CurrentStatus: req.body.CurrentStatus,
            MedicalPassedDate: req.body.MedicalPassedDate,
            BiometricsInvitationLetterDate: req.body.BiometricsInvitationLetterDate,
            BGCheckStatus: req.body.BGCheckStatus,
            BGSChangeDate: req.body.BGSChangeDate,

            PrincipalApplicantDependents: req.body.PrincipalApplicantDependents,
            PPRDate: req.body.PPRDate,
            NOC: req.body.NOC,
            VisaOffice: req.body.VisaOffice,
            AdditionalInfo: req.body.AdditionalInfo,
            BGCheckStartDate: req.body.BGCheckStartDate,
            EmploymentVerificationDate: req.body.EmploymentVerificationDate,
            AdditionalDocReqDate: req.body.AdditionalDocReqDate,
            ProvinceSponsor: req.body.ProvinceSponsor,
            RPRFPaidDate: req.body.RPRFPaidDate,
            CRSScore: req.body.CRSScore,
            GCMSNotesOrdered: req.body.GCMSNotesOrdered,
            SecurityScreening: req.body.SecurityScreening,
            Refused: req.body.Refused,

        }

        var ObjectId = require('mongoose').Types.ObjectId;
        var query = { '_id': new ObjectId(req.body.Id) };
        await Cases.findOneAndUpdate(query, data, { upsert: true, useFindAndModify: false }, function (err, doc) {
            if (err) { throw err; }
            else { res.status(200).send('Success').end(); }
        });

    }
})


app.post('/api/cases', cors(corsOptions), (req, res) => {

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        data = {
            UserID: req.body.userID,
            UserFirstName: req.body.UserFirstName,
            UserLastName: req.body.UserLastName,
            Nationality: req.body.Nationality,
            AORDate: req.body.AORDate,
            Country: req.body.Country,
            ImmStream: req.body.ImmStream,
            CurrentStatus: req.body.CurrentStatus,
            MedicalPassedDate: req.body.MedicalPassedDate,
            BiometricsInvitationLetterDate: req.body.BiometricsInvitationLetterDate,
            BGCheckStatus: req.body.BGCheckStatus,
            BGSChangeDate: req.body.BGSChangeDate,

            PrincipalApplicantDependents: req.body.PrincipalApplicantDependents,
            PPRDate: req.body.PPRDate,
            NOC: req.body.NOC,
            VisaOffice: req.body.VisaOffice,
            AdditionalInfo: req.body.AdditionalInfo,
            BGCheckStartDate: req.body.BGCheckStartDate,
            EmploymentVerificationDate: req.body.EmploymentVerificationDate,
            AdditionalDocReqDate: req.body.AdditionalDocReqDate,
            ProvinceSponsor: req.body.ProvinceSponsor,
            RPRFPaidDate: req.body.RPRFPaidDate,
            CRSScore: req.body.CRSScore,
            GCMSNotesOrdered: req.body.GCMSNotesOrdered,
            SecurityScreening: req.body.SecurityScreening,
            Refused: req.body.Refused,
        }

        var cases = new Cases(data);
        cases.save(function (err) {
            //if (err)
            //return res.status(200).send('error');;
        })
        res.status(200).send(cases).end();
    }
})


app.put('/api/ResourceSites', (req, res) => {
    console.log(Counter + 'request received, cat=' + req.body.ResourseSiteCats.length);
    Counter++;

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });
        console.log('PUT ResourceSites , id=' + req.body.Id);

        data = {
            name: req.body.name,
            Active: req.body.Active,
            RELink: req.body.RELink,
            REDetail: req.body.REDetail,
            REImage: req.body.REImage,
            LinkDomainName: req.body.LinkDomainName,
            BaseURL: req.body.BaseURL,
            ResourseSiteCats: req.body.ResourseSiteCats
        }

        var ObjectId = require('mongoose').Types.ObjectId;
        var query = { '_id': new ObjectId(req.body.Id) };
        await ResourceSites.findOneAndUpdate(query, data, { upsert: true, useFindAndModify: false }, function (err, doc) {
            if (err) { throw err; }
            else { res.status(200).send('Success').end(); }
        });


        //res.setHeader('Access-Control-Allow-Origin', '*')

    }
})


app.post('/api/ResourceSiteCats/', (req, res) => {

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });
        console.log('start saving...');

        data = {
            ResouseSiteCode: req.body.ResouseSiteCode,
            Url: req.body.Url,
            CatCode: req.body.CatCode,
            Active: req.body.Active,
            RssUrl: req.body.RssUrl,
            RssIsActive: req.body.RssIsActive
        }

        var resourceSiteCats = new ResourceSiteCats(data);
        resourceSiteCats.save(function (err) {
            if (err)
                return res.status(200).send('error');;
            // saved!
        })

        //res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).send(resourceSiteCats);
        console.log('post done');

    }
})

app.get('/api/ResourceSites/delete/:id', (req, res) => {

    console.log('del request received, ID=' + req.params.id);

    run().catch(error => console.log(error.stack));

    async function run() {
        await mongoose.connect(DBConnection, { useNewUrlParser: true });

        const CurSite = await await ResourceSites.find({ "_id": req.params.id }, function (err, doc) {
            if (err) {
                return res.status(404).send('The item with the given id was not found').end();
            }
        }).deleteOne().exec();;

        //CurSite.deleteOne().exec();
        console.log('del done');

        //res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).send(CurSite).end();
    }
})














app.get('/api/news', (req, res) => {
    const cacheKey = 'news'

    var mcache = require('memory-cache');
    //mcache.put(key, body, duration * 1000);

    let cachedBody = mcache.get(cacheKey)
    if (cachedBody) {
        //console.log('fetch from cache');
        res.status(200).send(cachedBody)
        return;
    }
    else {
        new sql.ConnectionPool(sqlConfig).connect().then(pool => {
            return pool.request().query(sqlQuery)
        }).then(result => {
            let rows = result.recordset
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).json(rows);
            mcache.put(cacheKey, rows, cacheDuration * 1000);
            sql.close();

        }).catch(err => {
            console.log(err)
            res.status(500).send({ message: "${err}" })
            sql.close();
        });
        sql.close();
    }


    var sqlQuery = 'select top 10 code, title from News order by code desc'

})

app.get('/api/news/:id', (req, res) => {
    var sqlQuery = 'select * from vNews where Code = ' + req.params.id

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('The news with the given id was not found')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: "${err}" })
        sql.close();
    });
    sql.close();
})

app.get('/api/news/:id/images', (req, res) => {
    var sqlQuery = 'select * from NewsImages where NewsCode = ' + req.params.id

    console.log(sqlQuery);

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('No news images for the given code')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: "${err}" })
        sql.close();
    });
    sql.close();
})


app.get('/api/mostvisitednews/', (req, res) => {
    var TakeCount = 20

    if (req.query.takeCount)
        TakeCount = req.query.takeCount;
    var sqlQuery = 'select top ' + TakeCount + ' * from vMVNews12h order by VisitCount Desc'

    console.log(sqlQuery);

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('No most visited news in database')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: `${err}` })
        sql.close();
    });
    sql.close();
})


app.get('/api/keywords/', (req, res) => {
    var takeCount = 20
    var pageNo = 1

    if (req.query.takeCount) takeCount = parseInt(req.query.takeCount);
    if (req.query.pageNo) pageNo = parseInt(req.query.pageNo)
    const skipCount = (pageNo - 1) * takeCount

    var sqlQuery = `SELECT top ` + takeCount + ` * FROM (
        SELECT ROW_NUMBER() OVER(ORDER BY Code) AS RoNum
              , *
        FROM Keywords
) AS tbl 
WHERE ` + skipCount + ` < RoNum
ORDER BY tbl.Code`

    console.log(sqlQuery);

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('No keyword found')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: `${err}` })
        sql.close();
    });
    sql.close();
})


app.get('/api/newsbycatcode/:id', (req, res) => {
    var takeCount = 20
    var pageNo = 1

    if (req.query.takeCount) takeCount = parseInt(req.query.takeCount);
    if (req.query.pageNo) pageNo = parseInt(req.query.pageNo)
    const skipCount = (pageNo - 1) * takeCount

    var sqlQuery = `SELECT *
    FROM vTinyLatestNews 
    WHERE CatCode = ` + req.params.id + `
    ORDER BY Code desc
    OFFSET (`+ skipCount + `) ROWS FETCH NEXT (` + takeCount + `) ROWS ONLY`

    console.log(sqlQuery);

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('No news found')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: `${err}` })
        sql.close();
    });
    sql.close();
})

app.get('/api/posts/:year/:month', (req, res) => {
    res.send(req.params)
})



app.get('/api/newsbycodelist/:id', (req, res) => {
    var takeCount = 20
    var pageNo = 1

    if (req.query.takeCount) takeCount = parseInt(req.query.takeCount);
    if (req.query.pageNo) pageNo = parseInt(req.query.pageNo)
    const skipCount = (pageNo - 1) * takeCount

    var sqlQuery = `SELECT *
    FROM vTinyLatestNews 
    WHERE Code in ( ` + req.params.id + ` )
    ORDER BY Code desc
    OFFSET (`+ skipCount + `) ROWS FETCH NEXT (` + takeCount + `) ROWS ONLY`

    console.log(sqlQuery);

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('No news found')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: `${err}` })
        sql.close();
    });
    sql.close();
})




app.get('/api/relatednews/:id', (req, res) => {
    var takeCount = 10
    var pageNo = 1

    if (req.query.takeCount) takeCount = parseInt(req.query.takeCount);
    if (req.query.pageNo) pageNo = 1; //parseInt(req.query.pageNo)
    const skipCount = (pageNo - 1) * takeCount

    var sqlQuery = `SELECT *
    FROM vTinyRelatedNews 
    WHERE EntityCode = ` + req.params.id + ` 
    ORDER BY Code desc
    OFFSET (`+ skipCount + `) ROWS FETCH NEXT (` + takeCount + `) ROWS ONLY`

    console.log(sqlQuery);

    new sql.ConnectionPool(sqlConfig).connect().then(pool => {
        return pool.request().query(sqlQuery)
    }).then(result => {
        let rows = result.recordset
        if (rows == '') return res.status(404).send('No news found')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
    }).catch(err => {
        res.status(500).send({ message: `${err}` })
        sql.close();
    });
    sql.close();
})


app.get('/api/newssearch/:keyword', (req, res) => {
    console.log('bbbbbbbbbb');

    var takeCount = 20
    var pageNo = 1

    if (req.query.takeCount) takeCount = parseInt(req.query.takeCount);
    if (req.query.pageNo) pageNo = parseInt(req.query.pageNo);
    var Keyword = req.params.keyword;
    const skipCount = (pageNo - 1) * takeCount

    var LoopCounter = 0;
    while (Keyword.indexOf("  ") >= 0 && LoopCounter < 100) {
        Keyword = Keyword.replace("  ", " ");
        LoopCounter++;
    }
    var KeywordArray = Keyword.split(' ');
    var WhereClause = "";
    for (i = 0; i < KeywordArray.length; i++) {
        if (i == 0)
            WhereClause = "(CONTAINS(Title, N'" + KeywordArray[i] + "') or CONTAINS(Contents, N'" + KeywordArray[i] + "'))";
        else
            WhereClause = WhereClause + " and (CONTAINS(Title, N'" + KeywordArray[i] + "') or CONTAINS(Contents, N'" + KeywordArray[i] + "'))";
    }
    //return dataContext.ExecuteQuery<vLatestNews>(string.Format("exec spSearchNews N'{0}'", WhereClause)).Skip(SkipCount).Take(PageSize);
    //WhereClause = "title like N'%مغز%'"
    console.log(WhereClause);
    //return;
    var conn = new sql.ConnectionPool(sqlConfig);
    conn.connect().then(function (conn) {
        var request = new sql.Request(conn);
        request.input('WhereClause', sql.NVarChar, WhereClause);
        request.execute('spTinySearchNews', (err, result) => {


            let rows = result.recordsets[0]
            if (rows == '') //return res.status(404).send('No news found')
                console.log('no record');

            //console.dir(recordsets);
            //console.dir(err);
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).json(rows);
            sql.close();
        }).catch(function (err) {
            console.log(err);
        });
    });
    sql.close();

    // new sql.ConnectionPool(sqlConfig).connect().then(pool => {
    //     return pool.request().query(sqlQuery)
    // }).then(result => {
    //     let rows = result.recordset
    //     if (rows == '') return res.status(404).send('No keyword found')

    //     res.setHeader('Access-Control-Allow-Origin', '*')
    //     res.status(200).json(rows);
    //     sql.close();
    // }).catch(err => {
    //     res.status(500).send({ message: `${err}` })
    //     sql.close();
    // });
    // sql.close();
})

app.get('/api/posts/:year/:month', (req, res) => {
    res.send(req.params)
})



app.post('/api/courses/', (req, res) => {
    //const result = validateCourse(req.body)
    const { error } = validateCourse(req.body)
    if (error) {
        res.status(400).send(error);
        return;
    }

    const course = {
        id: courses.length + 1,
        name: req.body.name
    }
    courses.push(course);
    res.send(course);
})

const port = process.env.port || 3000;

app.listen(port, () => { console.log(`Listening on port ${port}`) })