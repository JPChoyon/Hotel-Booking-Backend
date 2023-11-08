const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())


// mongodb connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.fycfdwn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const roomsCollection = client.db("hotelDB").collection("rooms");
    const bookingCollection = client.db('hotelDB').collection('booked')

    // rooms found 
    app.get('/rooms', async (req, res) => {
      const cursor = roomsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // rooms details 
    app.get('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await roomsCollection.findOne(query);
      res.send(result);
    });

    // jwt authinacation
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('tocken for ', user);
      const token = jwt.sign(user, process.env.SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      })

        .send({ success: true })

    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })

   


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// server setup 
app.get('/', (req, res) => {
  res.send('hotel service is running')
})

app.listen(port, (req, res) => {
  console.log('app runnig at port :', port);
})