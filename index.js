const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middlewares
app.use(cors());
app.use(express.json());

const stripe = require("stripe")('sk_test_51PRp6PIJ4ZwIIzxdli4zSPMHIJFlOzEBhAuYdAhPuJfGaxP9jvYUOd1KmwOQUimT0YBNGvTNMkDJJifQnreI3mog00HZ4Ww1fj');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8iumwdu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("unknownDb");
    const bannerCollection = db.collection("banner");
    const testCollection = db.collection("test");
    const recommendationCollection = db.collection("recommendation");
    const userCollection = db.collection("user");
    const reservationCollection = db.collection("reservation");
    const resultCollection = db.collection("result");
    const doctorCollection = db.collection("doctor");
    const paymentCollection = db.collection("payments");

    // JWT related Api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.patch("/user/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedUser = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedUser);
      res.send(result);
    });

    // user related Api starts from here

    app.get("/user", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.patch("/user/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: item.name,
          bloodGroup: item.bloodGroup,
          district: item.district,
          upazila: item.upazila,
          photo: item.photo,
        },
      };
      const result = await userCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    app.get("/user/singleUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //banner api

    app.get("/banner", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });

    app.post("/banner", verifyToken, verifyAdmin, async (req, res) => {
      const banner = req.body;
      const result = await bannerCollection.insertOne(banner);
      res.send(result);
    });

    app.delete("/banner/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bannerCollection.deleteOne(query);
      //console.log(result);
      res.send(result);
    });

    app.patch(
      "/banner/active/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        await bannerCollection.updateMany({}, { $set: { isActive: "false" } });
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            isActive: "true",
          },
        };
        const result = await bannerCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );

    //selected banner
    app.get("/banner/active", async (req, res) => {
      const result = await bannerCollection.findOne({ isActive: "true" });
      res.send(result);
    });

    //Banner Api Finished

    //Test api starts from here

    app.get("/test", async (req, res) => {
      const result = await testCollection.find().toArray();
      res.send(result);
    });

    app.post("/test", verifyToken, verifyAdmin, async (req, res) => {
      const test = req.body;
      const result = await testCollection.insertOne(test);
      res.send(result);
    });

    app.get("/test/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testCollection.findOne(query);
      //console.log(result);
      res.send(result);
    });

    app.patch("/test/:id", verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          testName: item.testName,
          testFee: item.testFee,
          image: item.image,
          slot: item.slot,
          date: item.date,
          description: item.description,
        },
      };
      const result = await testCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete("/test/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/test/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const oldData = await testCollection.findOne(filter);
      const newData = parseInt(oldData.slot);
      const updatedData = await testCollection.updateOne(filter, {
        $set: { slot: newData - 1 },
      });
      res.send(updatedData);
    });

    // Test Api ends her

    // Recommendation starts Here

    app.post("/recommendation", async (req, res) => {
      const item = req.body;
      const result = await recommendationCollection.insertOne(item);
      res.send(result);
    });

    app.get("/recommendation", async (req, res) => {
      const result = await recommendationCollection.find().toArray();
      res.send(result);
    });

    // Recommendation ends here

    // Reservation Starts Here

    app.get("/reservation", async (req, res) => {
      const result = await reservationCollection.find().toArray();
      res.send(result);
    });
    app.post("/reservation", verifyToken, async (req, res) => {
      const item = req.body;
      const result = await reservationCollection.insertOne(item);
      res.send(result);
    });

    app.get("/reservation/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await reservationCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/reservation/forResult/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reservationCollection.findOne(query);
      res.send(result);
    });

    app.delete("/reservation/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reservationCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/reservation/forAdmin/:testName",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const testName = req.params.testName;
        const query = { testName: testName };
        const result = await reservationCollection.find(query).toArray();
        res.send(result);
      }
    );

    // Test Result

    app.get("/result", async (req, res) => {
      const result = await resultCollection.find().toArray();
      res.send(result);
    });
    app.post("/result", async (req, res) => {
      const item = req.body;
      const result = await resultCollection.insertOne(item);
      res.send(result);
    });
    app.get("/result/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await resultCollection.find(query).toArray();
      res.send(result);
    });

    //Doctor api starts here

    app.get("/doctor", async (req, res) => {
      const result = await doctorCollection.find().toArray();
      res.send(result);
    });

    app.post("/doctor", verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await doctorCollection.insertOne(item);
      res.send(result);
    });

    app.get("/doctor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await doctorCollection.findOne(query);
      res.send(result);
    });

    //  payment gateway Stripe

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payments/:email", async (req, res) => {
      const query = { email: req.params.email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      res.send({ paymentResult});
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Unknown Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
