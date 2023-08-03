# FluxKart Bitespeed Backend Task: Identity Reconciliation

Welcome to the FluxKart Bitespeed Backend Task for Identity Reconciliation! In this task, we aim to identify and keep track of a customer's identity across multiple purchases using the Bitespeed web service.

## Endpoint `/identify`

The web service provides an endpoint `/identify` that receives HTTP POST requests with a JSON body containing either the `email` or `phoneNumber` of the customer. The web service then attempts to reconcile the customer's identity and returns a JSON response containing the consolidated contact information.

### Example Request:

POST https://bitespeed-backend-task-ybhe.onrender.com/identify

Request Body:
{
"email": "mcfly@hillvalley.edu",
"phoneNumber": "123456"
}

shell
Copy code

### Example Response:

Response Body:
{
"contact": {
"primaryContatctId": 1,
"emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
"phoneNumbers": ["123456"],
"secondaryContactIds": [23]
}
}

vbnet
Copy code

## How It Works

1. The web service first checks if a contact with the provided `email` or `phoneNumber` exists in the database.

2. If the contact exists, a new contact is created with the provided information, and it is linked to the existing contact. The existing contact is considered the "primary" contact, and the new contact is the "secondary" contact.

3. If the contact does not exist, a new primary contact is created with the provided information.

4. The web service then returns the consolidated contact information, including all email addresses and phone numbers associated with the primary contact, along with the IDs of any secondary contacts linked to the primary.

## Hosted Endpoint

The web service is now hosted on Render.com, and you can access the endpoint at the following URL:

[https://bitespeed-backend-task-ybhe.onrender.com/identify](https://bitespeed-backend-task-ybhe.onrender.com/identify)

Please feel free to make POST requests to this endpoint with appropriate JSON bodies to test the identity reconciliation feature.

For any questions or assistance regarding database access, feel free to contact us at alpesh57678@gmail.com


Happy testing!

---
*Note: This README is a summary of the functionality and features of the FluxKart Bitespeed Backend Task. For more detailed information, please refer to the actual implementation in the source code.*
