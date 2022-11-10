const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@dserver.8fbud8m.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('chef-steps').collection('services')
        const reviewCollection = client.db('chef-steps').collection('reviews');
        
        app.post('/jwt',(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
            res.send({token})
        });

        
        app.get('/services',async(req,res)=>{
            const query ={};
            const cursor = serviceCollection.find(query)
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });
        app.get('/allservices',async(req,res)=>{
            const query ={};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service)
        });

        app.get('/allreviews',async(req,res)=>{
            const query ={};
            const cursor = reviewCollection.find(query)
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.get('/reviews', async (req, res) => {
            const decoded = req.decoded;
            console.log('inside review api', decoded);


            let query = {};

            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }

            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status: status
                }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc);
            res.send(result);
        });

        

        
    }
    finally {

    }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Chef Steps server is running')
})
app.listen(port, () => {
    console.log(`Chef Steps server running on ${port}`);
})



// require('crypto').randomBytes(64).toString('hex')