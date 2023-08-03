import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { createPool, Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const app = express();
const port = process.env.PORT || 3000; // Change this to the desired port

const pool: Pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
});

app.use(bodyParser.json());

app.post('/identify', async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body || null;

  try {
    const connection = await pool.getConnection();
    console.log(email);

    // Find the contact with the same email or phoneNumber
    const [rows] = await connection.execute(
        'SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?',
        [email=== undefined ? null : email, phoneNumber === undefined ? null : phoneNumber]
      );
      const contacts: Contact[] = rows as unknown as Contact[];


    if (contacts.length > 0) {
      const existingContact = contacts[0];

      // Update the second primary contact to be a secondary contact
      if (contacts.length > 1) {
        const secondPrimaryContact = contacts[1];

        // Updates the contact only when it's primary other-wise no need to update 
        if(contacts[1].linkPrecedence === 'primary'){
            await connection.query(
                'UPDATE Contact SET linkPrecedence = ?,linkedId = ?, updatedAt = ? WHERE id = ?',
                ['secondary',contacts[0].id,new Date().toISOString(), contacts[1].id]
                );
            }
       
        // Remove duplicates from emails and phoneNumbers arrays

        const emailsSet = new Set([existingContact.email, secondPrimaryContact.email].filter((e) => e !== null));
        const phoneNumbersSet = new Set([existingContact.phoneNumber, secondPrimaryContact.phoneNumber].filter((p) => p !== null));
       
       
        res.status(200).json({
            contact:{
                primaryContatctId: existingContact.linkPrecedence === 'primary' ? existingContact.id : existingContact.linkedId,   
                emails: Array.from(emailsSet),
                phoneNumbers: Array.from(phoneNumbersSet),
                secondaryContactIds: contacts
                .filter((contact) => contact.linkedId === existingContact.id)
                .map((contacts) => contacts.id),
            }
        })
    }else{        
        // If contact exists, create a secondary contact if there's new information
        const newContact: any = {
            phoneNumber: phoneNumber || existingContact.phoneNumber,
            email: email || existingContact.email,
            linkedId: existingContact.linkPrecedence === 'primary' ? existingContact.id : existingContact.linkedId,
            linkPrecedence: 'secondary',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
        };
        
        // Save the new contact to the database
        const [insertResult] = await connection.query('INSERT INTO Contact SET ?', newContact);


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
    } else {
      // If contact doesn't exist, create a new primary contact
      const newContact: any = {
        phoneNumber,
        email,
        linkedId: null,
        linkPrecedence: 'primary',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      // Save the new contact to the database
      const [insertResult] = await connection.query('INSERT INTO Contact SET ?', newContact);
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
  } catch (err) {
    console.error('Error:',err);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
