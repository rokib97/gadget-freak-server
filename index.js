const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ghltq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   console.log("db connected");
//   client.close();
// });

async function run() {
  try {
    await client.connect();
    console.log("db connected");
    const productCollection = client.db("gadgetFreak").collection("products");
    const orderCollection = client.db("gadgetFreak").collection("orders");

    app.post("/login", (req, res) => {
      const email = req.body;
      //   console.log(email);
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET_KEY);
      //   console.log(token);
      res.send({ token });
    });

    app.post("/uploadPd", async (req, res) => {
      const product = req.body;
      //   console.log(product);
      const tokenInfo = req.headers.authorization;
      //   console.log(tokenInfo);
      const [email, accessToken] = tokenInfo.split(" ");
      const decoded = verifyToken(accessToken);
      console.log(decoded);

      if (email === decoded?.email) {
        const result = await productCollection.insertOne(product);
        res.send({ success: "Product Upload Successfully!" });
      } else {
        res.send({ success: "UnAuthorized Access" });
      }
    });

    app.get("/orderList", async (req, res) => {
      const tokenInfo = req.headers.authorization;
      const [email, accessToken] = tokenInfo.split(" ");
      const decoded = verifyToken(accessToken);
      console.log(tokenInfo);
      if (email === decoded?.email) {
        const orders = await orderCollection.find({ email: email }).toArray();
        res.send(orders);
      } else {
        res.send({ success: "UnAuthorized Access" });
      }
    });

    app.get("/products", async (req, res) => {
      const products = await productCollection.find({}).toArray();
      res.send(products);
    });

    app.post("/addOrder", async (req, res) => {
      const orderInfo = req.body;
      console.log(orderInfo);
      const result = await orderCollection.insertOne(orderInfo);
      res.send({ success: "Order Complete Successfully!" });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// verify token function
function verifyToken(token) {
  let email;
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET_KEY,
    function (err, decoded) {
      if (err) {
        email: "Invalid Email";
      }
      if (decoded) {
        email = decoded;
      }
    }
  );
  return email;
}
