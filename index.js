require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middle wares
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5ur1zwx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// database connection
async function dbConnect() {
    try {
        await client.connect();
        console.log("Database connected");

    } catch (error) {
        console.log(error.name, error.message);

    }
}

dbConnect();

const serviceCollection = client.db('geniusCar').collection("services");
const orderCollection = client.db('geniusCar').collection("orders");

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })

}

app.get('/', (req, res) => {
    res.send('running')
})

//generate jwt token

app.post('/jwt', (req, res) => {
    try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1hr" });
        res.send({ token });

    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            message: error.message
        });
    }
})

//find all service data

app.get('/services', async (req, res) => {
    try {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send({
            success: true,
            message: "Successfully got data",
            data: services
        });

    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            message: error.message
        });

    }
});

app.get('/services/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const service = await serviceCollection.findOne(query)
        res.send({
            success: true,
            message: "Successfully got data",
            data: service
        })

    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            message: error.message
        });
    }
});

// orders api 
app.post('/orders', async (req, res) => {
    try {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        if (result.insertedId) {
            res.send({
                success: true,
                message: `Successfully created the ${order.serviceName} with id ${result.insertedId}`,
            });
        }
        else {
            res.send({
                success: false,
                error: "Couldn't place the order",
            });
        }
    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            error: error.message,
        });
    }
});

app.get('/orders', verifyJWT, async (req, res) => {
    try {
        const decoded = req.decoded;
        if (decoded.email !== req.query.email) {
            return res.status(403).send({ message: "Forbidden Access" });
        }


        let query = {}
        if (req.query.email) {
            query = {
                email: req.query.email
            }
        }

        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send({
            success: true,
            message: "Successfully got data",
            data: orders
        });

    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            message: error.message
        });
    }
});

// app.get('/orders/:id', async (req, res) => {
//     try {
//         const id = req.params.id;
//         const query = { _id: ObjectId(id) };
//         const order = await orderCollection.findOne(query)
//         res.send({
//             success: true,
//             message: "Successfully got data",
//             data: order
//         })

//     } catch (error) {
//         console.log(error.name, error.message);
//         res.send({
//             success: false,
//             message: error.message
//         });
//     }
// });

app.patch('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.body.status;
        const query = { _id: ObjectId(id) };
        const updateDoc = {
            $set: {
                status: status
            }
        }

        const result = await orderCollection.updateOne(query, updateDoc);
        if (result.modifiedCount) {
            res.send({
                success: true,
                message: `successfully updated `,
            });
        } else {
            res.send({
                success: false,
                error: "Couldn't update  the product",
            });
        }


    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            message: error.message
        });

    }

})

app.delete('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: ObjectId(id) }
        const result = await orderCollection.deleteOne(query);

        if (result.deletedCount) {
            res.send({
                success: true,
                message: 'Deleted Successfully'
            });
        }
        else {
            res.send({
                success: false,
                error: "couldn't delete the data"
            })
        }

    } catch (error) {
        console.log(error.name, error.message);
        res.send({
            success: false,
            message: error.message
        });

    }
})


app.listen(port, () => {
    console.log(`genius car server running on port ${port}`);
})

