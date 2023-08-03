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
const body_parser_1 = __importDefault(require("body-parser"));
const promise_1 = require("mysql2/promise");
const app = (0, express_1.default)();
const port = 3000; // Change this to the desired port
const pool = (0, promise_1.createPool)({
    host: 'sql6.freesqldatabase.com',
    user: 'sql6637212',
    password: '5QR7s3hIdc',
    database: 'sql6637212',
    connectionLimit: 10,
});
app.use(body_parser_1.default.json());
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield pool.getConnection();
        console.log('Connected to the database!');
        const email = 'test@example.com'; // Replace with your test email
        const phoneNumber = '1234567890';
        // Perform a test query to check the database connection
        const emailParam = email || null;
        const phoneNumberParam = phoneNumber || null;
        const [rows] = yield connection.execute('SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?', [emailParam, phoneNumberParam]);
        // Use type assertion to properly cast the results to ContactRow[]
        const contacts = rows;
        console.log('Test query result:', contacts);
        connection.release();
    }
    catch (error) {
        console.error('Error connecting to the database:');
        return;
    }
}))();
// (async () => {
//     try {
//       const connection = await pool.getConnection();
//       console.log('Connected to the database!');
//       connection.release();
//     } catch (error) {
//       console.error('Error connecting to the database:');
//     }
//   })();
app.post('/identify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    try {
        const connection = yield pool.getConnection();
        // Find the contact with the same email or phoneNumber
        const [rows] = yield connection.execute('SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?', [email, phoneNumber]);
        const contacts = rows;
        console.log('Test query result:', contacts);
        console.log('Test query result:', rows);
        if (contacts.length > 0) {
            const existingContact = contacts[0];
            // If contact exists, create a secondary contact if there's new information
            const newContact = {
                id: contacts.length + 1,
                phoneNumber: phoneNumber || existingContact.phoneNumber,
                email: email || existingContact.email,
                linkedId: existingContact.linkPrecedence === 'primary' ? existingContact.id : existingContact.linkedId,
                linkPrecedence: 'secondary',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
            };
            // Save the new contact to the database
            const [insertResult] = yield connection.query('INSERT INTO Contact SET ?', newContact);
            //   newContact.id = insertResult.insertId;
            connection.release();
            //   res.status(200).json({
            //     contact: {
            //       primaryContatctId: existingContact.linkPrecedence === 'primary' ? existingContact.id : existingContact.linkedId,
            //       emails: [existingContact.email, newContact.email].filter((e) => e !== null),
            //       phoneNumbers: [existingContact.phoneNumber, newContact.phoneNumber].filter((p) => p !== null),
            //       secondaryContactIds: rows
            //         .filter((contact) => contact.linkedId === existingContact.id)
            //         .map((contact) => contact.id),
            //     },
            //   });
        }
        else {
            // If contact doesn't exist, create a new primary contact
            const newContact = {
                id: contacts.length + 1,
                phoneNumber,
                email,
                linkedId: null,
                linkPrecedence: 'primary',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
            };
            // Save the new contact to the database
            const [insertResult] = yield connection.query('INSERT INTO Contact SET ?', newContact);
            //   newContact.id = insertResult.insertId;
            connection.release();
            res.status(200).json({
                contact: {
                    primaryContatctId: newContact.id,
                    emails: [newContact.email].filter((e) => e !== null),
                    phoneNumbers: [newContact.phoneNumber].filter((p) => p !== null),
                    secondaryContactIds: [],
                },
            });
        }
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
