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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000; // Change this to the desired port
const pool = (0, promise_1.createPool)({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
});
app.use(body_parser_1.default.json());
app.post('/identify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body || null;
    try {
        const connection = yield pool.getConnection();
        console.log(email);
        // Find the contact with the same email or phoneNumber
        const [rows] = yield connection.execute('SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?', [email === undefined ? null : email, phoneNumber === undefined ? null : phoneNumber]);
        const contacts = rows;
        if (contacts.length > 0) {
            const existingContact = contacts[0];
            // Update the second primary contact to be a secondary contact
            if (contacts.length > 1) {
                const secondPrimaryContact = contacts[1];
                // Updates the contact only when it's primary other-wise no need to update 
                if (contacts[1].linkPrecedence === 'primary') {
                    yield connection.query('UPDATE Contact SET linkPrecedence = ?,linkedId = ?, updatedAt = ? WHERE id = ?', ['secondary', contacts[0].id, new Date().toISOString(), contacts[1].id]);
                }
                // Remove duplicates from emails and phoneNumbers arrays
                const emailsSet = new Set([existingContact.email, secondPrimaryContact.email].filter((e) => e !== null));
                const phoneNumbersSet = new Set([existingContact.phoneNumber, secondPrimaryContact.phoneNumber].filter((p) => p !== null));
                res.status(200).json({
                    contact: {
                        primaryContatctId: existingContact.linkPrecedence === 'primary' ? existingContact.id : existingContact.linkedId,
                        emails: Array.from(emailsSet),
                        phoneNumbers: Array.from(phoneNumbersSet),
                        secondaryContactIds: contacts
                            .filter((contact) => contact.linkedId === existingContact.id)
                            .map((contacts) => contacts.id),
                    }
                });
            }
            else {
                // If contact exists, create a secondary contact if there's new information
                const newContact = {
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
                // Remove duplicates from emails and phoneNumbers arrays
                const emailsSet = new Set([existingContact.email, newContact.email].filter((e) => e !== null));
                const phoneNumbersSet = new Set([existingContact.phoneNumber, newContact.phoneNumber].filter((p) => p !== null));
                res.status(200).json({
                    contact: {
                        primaryContatctId: existingContact.linkPrecedence === 'primary' ? existingContact.id : existingContact.linkedId,
                        emails: Array.from(emailsSet),
                        phoneNumbers: Array.from(phoneNumbersSet),
                        secondaryContactIds: contacts
                            .filter((contact) => contact.linkedId === existingContact.id)
                            .map((contacts) => contacts.id),
                    },
                });
                connection.release();
            }
        }
        else {
            // If contact doesn't exist, create a new primary contact
            const newContact = {
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
