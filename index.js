const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const admin = require('firebase-admin');

const serviceAccount = require("./service-account.json");
admin.initializeApp({
    credential:admin.credential.cert(serviceAccount),
})

const db = admin.firestore();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({ createParentPath: true }));

app.post('/steps',async(req,res)=>{
    const {uid,token,step,applicationId} = req.body;
    try {
        const user = await db.collection('users').doc(uid).get();
        const userData = user.data();
        if (token !== userData.deviceToken) {
            return res.status(404).send({
                status: "Token not registred"
            })
        }
        const application = await db.collection('users').doc(uid).collection('applications').doc(applicationId).get();
        const applicationData = application.data();
        await db.collection('users').doc(uid).collection('applications').doc(applicationId).update({
            steps: admin.firestore.FieldValue.arrayUnion(parseInt(step)),
        });
        const notificationData = {
            notification: {
                title: "Cek status lamaran kamu",
                body: `Status lamaran kamu ${applicationData.vacancy.title}, lolos ke tahap berikutnya`
            },
            data:{
                "uid":uid,
            }
        };
        await admin.messaging().sendToDevice(token,notificationData)  
        return res.send({
            status:'SUCCESS',
            data:notificationData,
        });
    } catch (error) {
        return res.send(error);
    }
})

app.post('/status',async(req,res)=>{
    const {uid,token,status,applicationId} = req.body;
    try {
        const user = await db.collection('users').doc(uid).get();
        const userData = user.data();
        if (token !== userData.deviceToken) {
            return res.status(404).send({
                status: "Token not registred"
            })
        }
        const application = await db.collection('users').doc(uid).collection('applications').doc(applicationId).get();
        const applicationData = application.data();
        await db.collection('users').doc(uid).collection('applications').doc(applicationId).update({
            status: parseInt(status),
        });
        let st = status === '1'?'Diterima':status === '2'?'Ditolak':'Sedang diproses';
        const notificationData = {
            notification: {
                title: "Cek status lamaran kamu",
                body: `Status lamaran kamu ${applicationData.vacancy.title} ${st} `
            },
            data:{
                "uid":uid,
            }
        };
        await admin.messaging().sendToDevice(token,notificationData)  
        return res.send({
            status:'SUCCESS',
            data:notificationData,
        });
    } catch (error) {
        return res.send(error);
    }
})

app.listen(3000,()=>{
    console.log('app started');
})