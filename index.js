const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middlewares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8iumwdu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


    const db = client.db("unknownDb");
    const bannerCollection = db.collection("banner");
    const testCollection = db.collection("test");


    //banner api

    app.get("/banner",async(req,res)=>{
        const result = await bannerCollection.find().toArray();
        res.send(result);
    })

    app.post('/banner',async(req,res)=>{
        const banner = req.body;
        const result = await bannerCollection.insertOne(banner);
        res.send(result);
    })

    app.delete('/banner/:id',async(req,res)=>{
       const id = req.params.id;
       const query = {_id: new ObjectId(id)};
       const result = await bannerCollection.deleteOne(query);
       //console.log(result);
       res.send(result);
    })

    app.patch('/banner/active/:id',async(req,res)=>{
      await bannerCollection.updateMany({}, { $set: { isActive: 'false' } });
       const id = req.params.id;
       const query = {_id: new ObjectId(id)};
       const updateDoc = {
           $set: {
            isActive: 'true',
           }
       }
       const result = await bannerCollection.updateOne(query,updateDoc);
       res.send(result);
    })

    //selected banner
    app.get('/banner/active',async(req,res)=>{
       const result = await bannerCollection.findOne({isActive:'true'});
       res.send(result);
    })

    //Banner Api Finished

    //Test api starts from here

    app.get('/test',async(req,res)=>{
      const result = await testCollection.find().toArray();
      res.send(result);
    })

    app.post('/test',async(req,res)=>{
      const test = req.body;
      const result = await testCollection.insertOne(test);
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Unknown Server is running")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})