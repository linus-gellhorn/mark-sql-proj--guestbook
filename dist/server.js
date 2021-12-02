"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
//This line will read in any MY_KEY=myValue pairs in your .env file and
// make them available as environment variables as properties of process.env
// Example: if the file has
// MY_KEY=myValue
// we'd be able to access process.env.MY_KEY
// Specifically, you should provide a DB connection string as DATABASE_URL in .env
require("dotenv").config();
if (!process.env.DATABASE_URL) {
    throw "No DATABASE_URL env var!  Have you made a .env file?  And set up dotenv?";
}
// To connect to a heroku db you need to specify an object value for the ssl option
// (however, if you want to connect to a local db you should set this property to false).
const client = new pg_1.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
client.connect();
// //As your database is on your local machine, with default port,
// //and default username and password,
// //we only need to specify the (non-default) database name.
// const client = new Client({ database: "guestbook" });
// //TODO: this request for a connection will not necessarily complete before the first HTTP request is made!
// client.connect();
const app = express_1.default();
/**
 * Simplest way to connect a front-end. Unimportant detail right now, although you can read more: https://flaviocopes.com/express-cors/
 */
app.use(cors_1.default());
/**
 * Middleware to parse a JSON body in requests
 */
app.use(express_1.default.json());
//When this route is called, return the most recent 100 signatures in the db
app.get("/signatures", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signatures = (yield client.query(`SELECT * from signatures LIMIT 100`))
        .rows; // FIXED! FIXME-TASK: get signatures from db!
    res.status(200).json({
        status: "success",
        data: {
            signatures,
        },
    });
}));
app.get("/signatures/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // :id indicates a "route parameter", available as req.params.id
    //  see documentation: https://expressjs.com/en/guide/routing.html
    const id = parseInt(req.params.id); // params are always string type
    // const signature = (
    //   await client.query(`SELECT * FROM signatures WHERE id = $1`, [id])
    // ).rows; // FIXED! FIXME-TASK get the signature row from the db (match on id)
    // DODGY CODE SUSCEPTIBLE TO SQL ATTACKS
    const signature = (yield client.query(`SELECT * FROM signatures WHERE id = ${id}`)).rows;
    if (signature.length > 0) {
        res.status(200).json({
            status: "success",
            data: {
                signature,
            },
        });
    }
    else {
        res.status(404).json({
            status: "fail",
            data: {
                id: "Could not find a signature with that id identifier",
            },
        });
    }
}));
app.post("/signatures", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, message } = req.body;
    if (typeof name === "string") {
        const text = `INSERT INTO signatures(signature, message) VALUES($1, $2) RETURNING *`;
        const values = [name, message];
        const createdSignature = yield client.query(text, values); // FIXED! FIXME-TASK: insert the supplied signature object into the DB
        res.status(201).json({
            status: "success",
            data: {
                signature: createdSignature.rows, // DONE! return the relevant data (including its db-generated id)
            },
        });
    }
    else {
        res.status(400).json({
            status: "fail",
            data: {
                name: "A string value for name is required in your JSON body",
            },
        });
    }
}));
//update a signature.
app.put("/signatures/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //  :id refers to a route parameter, which will be made available in req.params.id
    const { name, message } = req.body;
    const id = parseInt(req.params.id);
    if (typeof name === "string") {
        const text = `UPDATE signatures SET signature = $1, message = $2 WHERE id = $3 RETURNING *`;
        const values = [name, message, id];
        const result = yield client.query(text, values); // FIXED! FIXME-TASK: update the signature with given id in the DB.
        if (result.rowCount === 1) {
            const updatedSignature = result.rows;
            res.status(200).json({
                status: "success",
                data: {
                    signature: updatedSignature,
                },
            });
        }
        else {
            res.status(404).json({
                status: "fail",
                data: {
                    id: "Could not find a signature with that id identifier",
                },
            });
        }
    }
    else {
        res.status(400).json({
            status: "fail",
            data: {
                name: "A string value for name is required in your JSON body",
            },
        });
    }
}));
app.delete("/signatures/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id); // params are string type
    const text = `DELETE FROM signatures WHERE id = $1`;
    const values = [id];
    const queryResult = yield client.query(text, values); // FIXED! FIXME-TASK: delete the row with given id from the db
    const didRemove = queryResult.rowCount === 1;
    if (didRemove) {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE#responses
        // we've gone for '200 response with JSON body' to respond to a DELETE
        //  but 204 with no response body is another alternative:
        //  res.status(204).send() to send with status 204 and no JSON body
        res.status(200).json({
            status: "success",
        });
    }
    else {
        res.status(404).json({
            status: "fail",
            data: {
                id: "Could not find a signature with that id identifier",
            },
        });
    }
}));
exports.default = app;
