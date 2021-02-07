# LoudMouth - Online Chat Forum API

Faux API + database for learning purposes.

Part of my (upcoming) Udemy course on front end development!

This API is for a coffee delivery service, where customers can sign up and get coffee delivered to their front door!
Your job is to build the front end and ge this product rolling.

Your data will be stored for 1 day - so you can build a **tailored** app with **real** functions/users.

When demo day comes for your job interview or professor, you can show off your app working with and responding to real data.

# TODO

- [ ] Make the Udemy course

# Public facing API

There server can be accessed at `https://mock-server-uo5cf2letq-uw.a.run.app`

# Security

All passwords are hashed and data is saved in Google Cloud Storage to mock a database. Records are deleted after 1 day.

## Objects docs

There are 2 objects returned by this API: Users and Messages

## User object

The user object will always have a username, this cannot be changed once the user has been created.

Schema:

```javascript
{
  username: string,
}
```

## Message object

The message object represents a message from a user in our chat forum.

Schema:

```javascript
{
    id: int,
    message: string,
    createdAt: string,
    sender: string, (username)
  }
```

# API docs

This API uses Bearer Authentication Schema.

## User API

The User API allows you to CRUD users.

### Signup

Authentication: `no` <br />
Endpoint: `/signup` <br />
Method: `POST` <br />
Body: `{ username: USERNAME, password: PASSWORD } ` <br />
Response: `{ token: AUTH_TOKEN }` <br />

### Login

Authentication: `no` <br />
Endpoint: `/signup` <br />
Method: `POST` <br />
Body: `{ username: USERNAME, password: PASSWORD } ` <br />
Response: `{ token: AUTH_TOKEN }` <br />

## Messages API

The Message API allows you to fetch and create messages in the forum.

### Create a message

Authentication: `yes` <br />
Endpoint: `/message` <br />
Method: `POST` <br />
Body: `{ message: string } ` <br />
Response: `MESSAGE` <br />

### Get all messages

This API will return the last 100 messages

Authentication: `yes` <br />
Endpoint: `/message` <br />
Method: `GET` <br />
Response: `[]MESSAGE` <br />
