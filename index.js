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

// logger middleware 
const logger = async (req, res, next) => {
  console.log('called', req.host, req.originalUrl)
  next()
}

// verify tocken
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({
        message: 'unauthorized access'
      })
    }
    console.log(decoded);
    req.user = decoded
    next()
  })
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const roomsCollection = client.db("hotelDB").collection("rooms");
    const bookingCollection = client.db('hotelDB').collection('booked')
    const riviewColllection = client.db('hotelDB').collection('review')

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
    app.post('/jwt',logger, async (req, res) => {
      const user = req.body;
      console.log('tocken for ', user);
      const token = jwt.sign(user, process.env.SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })

        .send({ success: true })

    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })


    // bookings 
    app.get('/bookings', logger, verifyToken, async (req, res) => {
      console.log(req.query.email);
      console.log('ttttt token', req.cookies.token)
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    // revew 
    app.post('/riview', async (req, res) => {
      const newsit = req.body;

      const result = await riviewColllection.insertOne(newsit);
      res.send(result)
    })
    app.get('/riview', async (req, res) => {
      const cursor = riviewColllection
        .find();
      const result = await cursor.toArray()

      res.send(result)
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

